import json
import secrets
from datetime import datetime, timedelta

from bson import ObjectId
from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user, require_role
from app.core.exceptions import ConflictError, NotFoundError
from app.core.security import create_access_token, create_refresh_token, hash_password
from app.database import get_db
from app.models.user import InviteAccept, InviteRequest, UserInDB, UserRole
from app.redis_client import get_redis

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


@router.post("/members/invite", status_code=201)
async def invite_member(
    body: InviteRequest,
    current_user: UserInDB = Depends(require_role(UserRole.OWNER, UserRole.ADMIN)),
):
    db = get_db()

    # Already a member
    existing = await db.users.find_one({
        "email": body.email,
        "workspace_id": ObjectId(current_user.workspace_id),
        "is_active": True,
    })
    if existing:
        raise ConflictError("This email is already a member of the workspace")

    # Pending invite
    pending = await db.invites.find_one({
        "email": body.email,
        "workspace_id": ObjectId(current_user.workspace_id),
        "used": False,
        "expires_at": {"$gt": datetime.utcnow()},
    })
    if pending:
        raise ConflictError("An invite has already been sent to this email")

    ws = await db.workspaces.find_one({"_id": ObjectId(current_user.workspace_id)})
    token = secrets.token_urlsafe(32)

    await db.invites.insert_one({
        "token": token,
        "email": body.email,
        "role": body.role,
        "workspace_id": ObjectId(current_user.workspace_id),
        "inviter_id": ObjectId(current_user.id),
        "expires_at": datetime.utcnow() + timedelta(days=7),
        "used": False,
        "created_at": datetime.utcnow(),
    })

    redis = get_redis()
    await redis.publish("notifications", json.dumps({
        "type": "workspace_invite",
        "workspace_id": current_user.workspace_id,
        "user_id": current_user.id,
        "userEmail": body.email,
        "userName": "Guest",
        "metadata": {
            "inviterName": current_user.full_name,
            "workspaceName": ws["name"] if ws else "",
            "inviteToken": token,
        },
        "title": "Workspace invitation sent",
        "body": f"Invite sent to {body.email}",
    }))

    return {"token": token}


@router.get("/invite/{token}")
async def get_invite_info(token: str):
    db = get_db()
    invite = await db.invites.find_one({
        "token": token,
        "used": False,
        "expires_at": {"$gt": datetime.utcnow()},
    })
    if not invite:
        raise NotFoundError("Invite not found or expired")

    ws = await db.workspaces.find_one({"_id": invite["workspace_id"]})
    inviter = await db.users.find_one({"_id": invite["inviter_id"]})

    return {
        "email": invite["email"],
        "role": invite["role"],
        "workspace_name": ws["name"] if ws else "",
        "inviter_name": inviter["full_name"] if inviter else "",
    }


@router.post("/invite/{token}/accept", status_code=201)
async def accept_invite(token: str, body: InviteAccept):
    db = get_db()
    invite = await db.invites.find_one({
        "token": token,
        "used": False,
        "expires_at": {"$gt": datetime.utcnow()},
    })
    if not invite:
        raise NotFoundError("Invite not found or expired")

    existing = await db.users.find_one({"email": invite["email"]})
    if existing:
        raise ConflictError("An account with this email already exists")

    result = await db.users.insert_one({
        "email": invite["email"],
        "hashed_password": hash_password(body.password),
        "full_name": body.full_name,
        "workspace_id": invite["workspace_id"],
        "role": invite["role"],
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    })

    await db.invites.update_one(
        {"token": token},
        {"$set": {"used": True, "used_at": datetime.utcnow()}},
    )

    user_id = str(result.inserted_id)
    return {
        "access_token": create_access_token(user_id),
        "refresh_token": create_refresh_token(user_id),
        "token_type": "bearer",
    }
