from datetime import UTC, datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_current_user, require_role
from app.core.exceptions import NotFoundError
from app.database import get_db
from app.models.message import MessagePublic
from app.models.room import RoomCreate, RoomPublic, RoomUpdate
from app.models.user import UserInDB, UserRole
from app.workers.export_worker import export_chat_pdf

router = APIRouter(prefix="/rooms", tags=["rooms"])


def _fmt_room(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    doc["workspace_id"] = str(doc["workspace_id"])
    doc["created_by"] = str(doc["created_by"])
    doc["document_ids"] = [str(d) for d in doc.get("document_ids", [])]
    doc["members"] = [str(m) for m in doc.get("members", [])]
    return doc


def _fmt_msg(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    doc["room_id"] = str(doc["room_id"])
    if doc.get("author_id"):
        doc["author_id"] = str(doc["author_id"])
    return doc


@router.get("/", response_model=list[RoomPublic])
async def list_rooms(current_user: UserInDB = Depends(get_current_user)):
    db = get_db()
    cursor = db.rooms.find(
        {"workspace_id": ObjectId(current_user.workspace_id), "is_active": True}
    ).sort("created_at", -1)
    return [RoomPublic(**_fmt_room(r)) async for r in cursor]


@router.post("/", response_model=RoomPublic, status_code=201)
async def create_room(body: RoomCreate, current_user: UserInDB = Depends(get_current_user)):
    db = get_db()
    room_id = ObjectId()
    room = {
        "_id": room_id,
        "workspace_id": ObjectId(current_user.workspace_id),
        "name": body.name,
        "document_ids": [ObjectId(d) for d in body.document_ids],
        "created_by": ObjectId(current_user.id),
        "members": [ObjectId(current_user.id)],
        "is_active": True,
        "created_at": datetime.now(UTC),
    }
    await db.rooms.insert_one(room)
    return RoomPublic(**_fmt_room(room))


@router.get("/{room_id}", response_model=RoomPublic)
async def get_room(room_id: str, current_user: UserInDB = Depends(get_current_user)):
    db = get_db()
    room = await db.rooms.find_one(
        {"_id": ObjectId(room_id), "workspace_id": ObjectId(current_user.workspace_id)}
    )
    if not room:
        raise NotFoundError("Room not found")
    return RoomPublic(**_fmt_room(room))


@router.patch("/{room_id}", response_model=RoomPublic)
async def update_room(
    room_id: str,
    body: RoomUpdate,
    current_user: UserInDB = Depends(require_role(UserRole.OWNER, UserRole.ADMIN)),
):
    db = get_db()
    updates = {}
    if body.name is not None:
        updates["name"] = body.name
    if body.document_ids is not None:
        updates["document_ids"] = [ObjectId(d) for d in body.document_ids]

    if updates:
        await db.rooms.update_one({"_id": ObjectId(room_id)}, {"$set": updates})

    room = await db.rooms.find_one({"_id": ObjectId(room_id)})
    if not room:
        raise NotFoundError("Room not found")
    return RoomPublic(**_fmt_room(room))


@router.delete("/{room_id}", status_code=204)
async def archive_room(
    room_id: str,
    current_user: UserInDB = Depends(require_role(UserRole.OWNER, UserRole.ADMIN)),
):
    db = get_db()
    await db.rooms.update_one({"_id": ObjectId(room_id)}, {"$set": {"is_active": False}})


@router.get("/{room_id}/messages", response_model=list[MessagePublic])
async def get_messages(
    room_id: str,
    before_id: str | None = Query(None),
    limit: int = Query(30, ge=1, le=100),
    current_user: UserInDB = Depends(get_current_user),
):
    db = get_db()
    query: dict = {
        "room_id": ObjectId(room_id),
        "workspace_id": ObjectId(current_user.workspace_id),
    }
    if before_id:
        query["_id"] = {"$lt": ObjectId(before_id)}

    cursor = db.messages.find(query).sort("_id", -1).limit(limit)
    msgs = [MessagePublic(**_fmt_msg(m)) async for m in cursor]
    return list(reversed(msgs))


@router.post("/{room_id}/export", status_code=202)
async def export_room(room_id: str, current_user: UserInDB = Depends(get_current_user)):
    task = export_chat_pdf.delay(room_id, current_user.workspace_id, current_user.id)
    return {"task_id": task.id, "status": "queued"}


@router.get("/{room_id}/exports")
async def list_exports(room_id: str, current_user: UserInDB = Depends(get_current_user)):
    db = get_db()
    cursor = db.exports.find(
        {"room_id": ObjectId(room_id), "workspace_id": ObjectId(current_user.workspace_id)}
    ).sort("created_at", -1).limit(10)
    exports = []
    async for e in cursor:
        exports.append({
            "id": str(e["_id"]),
            "message_count": e.get("message_count", 0),
            "created_at": e.get("created_at"),
        })
    return exports


@router.get("/{room_id}/exports/{export_id}/download")
async def download_export(
    room_id: str,
    export_id: str,
    current_user: UserInDB = Depends(get_current_user),
):
    from app.services.storage_service import StorageService

    db = get_db()
    export = await db.exports.find_one(
        {
            "_id": ObjectId(export_id),
            "room_id": ObjectId(room_id),
            "workspace_id": ObjectId(current_user.workspace_id),
        }
    )
    if not export:
        raise NotFoundError("Export not found")
    storage = StorageService()
    url = storage.presigned_url(export["s3_key"], expires_in=300)
    return {"download_url": url, "expires_in": 300}
