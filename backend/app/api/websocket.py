import asyncio
import json
import logging
from datetime import UTC, datetime

from bson import ObjectId
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.dependencies import get_ws_user
from app.database import get_db
from app.redis_client import get_redis
from app.services.ai_service import ai_service

router = APIRouter()
logger = logging.getLogger(__name__)

# In-memory registry: room_id -> {user_id: WebSocket}
_connections: dict[str, dict[str, WebSocket]] = {}


@router.websocket("/ws/workspace")
async def workspace_websocket(websocket: WebSocket, token: str = ""):
    user = await get_ws_user(websocket, token)
    if not user:
        await websocket.close(code=4001)
        return

    await websocket.accept()

    redis = get_redis()
    pubsub = redis.pubsub()
    try:
        await pubsub.subscribe(f"workspace:{user.workspace_id}")
    except Exception:
        # Redis unavailable — keep connection open, events won't arrive
        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            pass
        return

    async def forward():
        async for message in pubsub.listen():
            if message["type"] == "message":
                try:
                    await websocket.send_text(message["data"])
                except Exception:
                    break

    forwarder = asyncio.create_task(forward())

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        forwarder.cancel()
        await pubsub.unsubscribe(f"workspace:{user.workspace_id}")


@router.websocket("/ws/room/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, token: str = ""):
    user = await get_ws_user(websocket, token)
    if not user:
        await websocket.close(code=4001)
        return

    db = get_db()
    room = await db.rooms.find_one(
        {"_id": ObjectId(room_id), "workspace_id": ObjectId(user.workspace_id)}
    )
    if not room:
        await websocket.close(code=4004)
        return

    await websocket.accept()

    # Register connection
    _connections.setdefault(room_id, {})[user.id] = websocket

    # Broadcast join
    await _broadcast(
        room_id,
        {"type": "user_joined", "user": {"id": user.id, "name": user.full_name}},
        exclude=user.id,
    )

    # Subscribe to Redis channel for this room (handles multi-worker broadcasts)
    redis = get_redis()
    pubsub = redis.pubsub()
    await pubsub.subscribe(f"room:{room_id}")

    redis_listener = asyncio.create_task(_redis_listener(pubsub, room_id, user.id))

    try:
        while True:
            raw = await websocket.receive_text()
            event = json.loads(raw)
            await _handle_event(event, room_id, room, user, websocket)
    except WebSocketDisconnect:
        pass
    finally:
        redis_listener.cancel()
        await pubsub.unsubscribe(f"room:{room_id}")
        _connections.get(room_id, {}).pop(user.id, None)
        await _broadcast(room_id, {"type": "user_left", "user_id": user.id})


async def _handle_event(event: dict, room_id: str, room: dict, user, websocket: WebSocket):
    event_type = event.get("type")

    if event_type == "typing_start":
        await _broadcast(
            room_id,
            {"type": "user_typing", "user_id": user.id, "name": user.full_name, "typing": True},
            exclude=user.id,
        )

    elif event_type == "typing_stop":
        await _broadcast(
            room_id,
            {"type": "user_typing", "user_id": user.id, "name": user.full_name, "typing": False},
            exclude=user.id,
        )

    elif event_type == "user_message":
        content = event.get("content", "").strip()
        if not content:
            return

        db = get_db()
        # Save user message
        user_msg_id = ObjectId()
        await db.messages.insert_one(
            {
                "_id": user_msg_id,
                "room_id": ObjectId(room_id),
                "workspace_id": room["workspace_id"],
                "author_id": ObjectId(user.id),
                "role": "user",
                "content": content,
                "sources": [],
                "created_at": datetime.now(UTC),
            }
        )

        # Broadcast user message to all in room
        await _broadcast(
            room_id,
            {
                "type": "user_message",
                "message_id": str(user_msg_id),
                "user_id": user.id,
                "user_name": user.full_name,
                "content": content,
            },
        )

        # Run RAG and stream AI response
        asyncio.create_task(
            _stream_ai_response(content, room, room_id, user)
        )


async def _stream_ai_response(question: str, room: dict, room_id: str, user):
    db = get_db()
    redis = get_redis()

    # Fetch recent history
    cursor = db.messages.find({"room_id": room["_id"]}).sort("_id", -1).limit(10)
    history = [
        {"role": m["role"], "content": m["content"]}
        async for m in cursor
    ]
    history.reverse()

    document_ids = [str(d) for d in room.get("document_ids", [])]
    workspace_id = str(room["workspace_id"])

    try:
        # Vector search for relevant chunks
        chunks = await ai_service.similarity_search(question, workspace_id, document_ids)

        full_response = ""
        async for token in ai_service.stream_answer(question, chunks, history):
            full_response += token
            payload = json.dumps({"type": "ai_stream", "token": token})
            # Publish to Redis so all workers deliver to their clients
            await redis.publish(f"room:{room_id}", payload)

        # Save complete AI message
        sources = [
            {
                "document_id": c["document_id"],
                "document_name": c["metadata"].get("source", ""),
                "chunk_content": c["content"][:200],
                "page": c["metadata"].get("page"),
                "score": c["score"],
            }
            for c in chunks
        ]
        msg_id = ObjectId()
        await db.messages.insert_one(
            {
                "_id": msg_id,
                "room_id": room["_id"],
                "workspace_id": room["workspace_id"],
                "author_id": None,
                "role": "assistant",
                "content": full_response,
                "sources": sources,
                "created_at": datetime.now(UTC),
            }
        )

        end_payload = json.dumps(
            {"type": "ai_stream_end", "message_id": str(msg_id), "sources": sources}
        )
        await redis.publish(f"room:{room_id}", end_payload)

    except Exception as exc:
        logger.exception("AI streaming error in room %s", room_id)
        err_payload = json.dumps(
            {"type": "error", "code": "AI_ERROR", "message": str(exc)}
        )
        await redis.publish(f"room:{room_id}", err_payload)


async def _redis_listener(pubsub, room_id: str, own_user_id: str):
    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = message["data"]
                # Forward to all local connections in this room
                dead = []
                for uid, ws in (_connections.get(room_id) or {}).items():
                    try:
                        await ws.send_text(data)
                    except Exception:
                        dead.append(uid)
                for uid in dead:
                    _connections.get(room_id, {}).pop(uid, None)
    except asyncio.CancelledError:
        pass


async def _broadcast(room_id: str, payload: dict, exclude: str | None = None):
    data = json.dumps(payload)
    dead = []
    for uid, ws in (_connections.get(room_id) or {}).items():
        if uid == exclude:
            continue
        try:
            await ws.send_text(data)
        except Exception:
            dead.append(uid)
    for uid in dead:
        _connections.get(room_id, {}).pop(uid, None)
