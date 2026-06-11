from fastapi import Depends, WebSocket
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import decode_token
from app.database import get_db
from app.models.user import UserInDB, UserRole

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> UserInDB:
    if not credentials:
        raise UnauthorizedError()
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        raise UnauthorizedError("Invalid or expired token")
    user_id = payload.get("sub")
    db = get_db()
    from bson import ObjectId

    user_doc = await db.users.find_one({"_id": ObjectId(user_id), "is_active": True})
    if not user_doc:
        raise UnauthorizedError("User not found")
    user_doc["_id"] = str(user_doc["_id"])
    if user_doc.get("workspace_id"):
        user_doc["workspace_id"] = str(user_doc["workspace_id"])
    return UserInDB(**user_doc)


async def get_ws_user(websocket: WebSocket, token: str) -> UserInDB | None:
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        return None
    user_id = payload.get("sub")
    db = get_db()
    from bson import ObjectId

    user_doc = await db.users.find_one({"_id": ObjectId(user_id), "is_active": True})
    if not user_doc:
        return None
    user_doc["_id"] = str(user_doc["_id"])
    if user_doc.get("workspace_id"):
        user_doc["workspace_id"] = str(user_doc["workspace_id"])
    return UserInDB(**user_doc)


def require_role(*roles: UserRole):
    async def checker(current_user: UserInDB = Depends(get_current_user)) -> UserInDB:
        if current_user.role not in roles:
            raise ForbiddenError()
        return current_user

    return checker


async def require_platform_admin(current_user: UserInDB = Depends(get_current_user)) -> UserInDB:
    if current_user.role != UserRole.PLATFORM_ADMIN:
        raise ForbiddenError("Platform admin access required")
    return current_user
