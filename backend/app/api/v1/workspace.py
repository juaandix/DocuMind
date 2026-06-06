from bson import ObjectId
from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user, require_role
from app.core.exceptions import NotFoundError
from app.database import get_db
from app.models.user import UserInDB, UserRole

router = APIRouter(prefix="/workspace", tags=["workspace"])


def _fmt_workspace(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    doc["owner_id"] = str(doc.get("owner_id", ""))
    return doc


def _fmt_user(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    doc.pop("hashed_password", None)
    if doc.get("workspace_id"):
        doc["workspace_id"] = str(doc["workspace_id"])
    return doc


@router.get("/")
async def get_workspace(current_user: UserInDB = Depends(get_current_user)):
    db = get_db()
    ws = await db.workspaces.find_one({"_id": ObjectId(current_user.workspace_id)})
    if not ws:
        raise NotFoundError("Workspace not found")
    return _fmt_workspace(ws)


@router.patch("/")
async def update_workspace(
    body: dict,
    current_user: UserInDB = Depends(require_role(UserRole.OWNER, UserRole.ADMIN)),
):
    db = get_db()
    allowed = {k: v for k, v in body.items() if k in {"name"}}
    if allowed:
        await db.workspaces.update_one(
            {"_id": ObjectId(current_user.workspace_id)}, {"$set": allowed}
        )
    ws = await db.workspaces.find_one({"_id": ObjectId(current_user.workspace_id)})
    return _fmt_workspace(ws)


@router.get("/members")
async def list_members(current_user: UserInDB = Depends(get_current_user)):
    db = get_db()
    cursor = db.users.find({"workspace_id": ObjectId(current_user.workspace_id), "is_active": True})
    members = [_fmt_user(u) async for u in cursor]
    return members


@router.delete("/members/{user_id}", status_code=204)
async def remove_member(
    user_id: str,
    current_user: UserInDB = Depends(require_role(UserRole.OWNER, UserRole.ADMIN)),
):
    db = get_db()
    await db.users.update_one(
        {"_id": ObjectId(user_id), "workspace_id": ObjectId(current_user.workspace_id)},
        {"$set": {"is_active": False}},
    )
