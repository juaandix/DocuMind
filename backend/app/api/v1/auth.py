from datetime import UTC, datetime

from bson import ObjectId
from fastapi import APIRouter, Depends
from slugify import slugify

from app.core.dependencies import get_current_user
from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.database import get_db
from app.models.user import TokenResponse, UserInDB, UserLogin, UserPublic, UserRegister, UserRole

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: UserRegister):
    db = get_db()
    if await db.users.find_one({"email": body.email}):
        raise ConflictError("Email already registered")

    workspace_id = ObjectId()
    slug = slugify(body.workspace_name)
    # ensure unique slug
    if await db.workspaces.find_one({"slug": slug}):
        slug = f"{slug}-{str(workspace_id)[:6]}"

    await db.workspaces.insert_one(
        {
            "_id": workspace_id,
            "name": body.workspace_name,
            "slug": slug,
            "plan": "FREE",
            "storage_used_bytes": 0,
            "storage_limit_bytes": 1 * 1024 * 1024 * 1024,  # 1 GB
            "created_at": datetime.now(UTC),
        }
    )

    user_id = ObjectId()
    await db.users.insert_one(
        {
            "_id": user_id,
            "email": body.email,
            "hashed_password": hash_password(body.password),
            "full_name": body.full_name,
            "workspace_id": workspace_id,
            "role": UserRole.OWNER,
            "avatar_url": None,
            "is_active": True,
            "created_at": datetime.now(UTC),
            "updated_at": datetime.now(UTC),
        }
    )
    # update workspace with owner
    await db.workspaces.update_one({"_id": workspace_id}, {"$set": {"owner_id": user_id}})

    return TokenResponse(
        access_token=create_access_token(str(user_id)),
        refresh_token=create_refresh_token(str(user_id)),
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin):
    db = get_db()
    user_doc = await db.users.find_one({"email": body.email, "is_active": True})
    if not user_doc or not verify_password(body.password, user_doc["hashed_password"]):
        raise UnauthorizedError("Invalid credentials")
    user_id = str(user_doc["_id"])
    return TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: dict):
    token = body.get("refresh_token", "")
    payload = decode_token(token)
    if not payload or payload.get("type") != "refresh":
        raise UnauthorizedError("Invalid refresh token")
    user_id = payload["sub"]
    return TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
    )


@router.post("/logout")
async def logout(current_user: UserInDB = Depends(get_current_user)):
    # Stateless JWT — tokens expire naturally.
    # For immediate invalidation, add token to Redis blocklist here.
    return {"message": "Logged out"}


@router.get("/me", response_model=UserPublic)
async def me(current_user: UserInDB = Depends(get_current_user)):
    return UserPublic(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        avatar_url=current_user.avatar_url,
        workspace_id=current_user.workspace_id,
    )
