from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import settings

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongodb_url)
    return _client


def get_db() -> AsyncIOMotorDatabase:
    return get_client()[settings.mongodb_db_name]


async def close_db() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None


async def init_indexes() -> None:
    db = get_db()
    # users
    await db.users.create_index("email", unique=True)
    await db.users.create_index("workspace_id")
    # workspaces
    await db.workspaces.create_index("slug", unique=True)
    # documents
    await db.documents.create_index("workspace_id")
    await db.documents.create_index([("workspace_id", 1), ("status", 1)])
    # document_chunks
    await db.document_chunks.create_index("document_id")
    await db.document_chunks.create_index("workspace_id")
    # rooms
    await db.rooms.create_index("workspace_id")
    # messages
    await db.messages.create_index([("room_id", 1), ("created_at", -1)])
    await db.messages.create_index("workspace_id")
    # invites
    await db.invites.create_index("token", unique=True)
    await db.invites.create_index([("workspace_id", 1), ("email", 1)])
    await db.invites.create_index("expires_at")
