from datetime import datetime
from enum import StrEnum

from bson import ObjectId
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRole(StrEnum):
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    MEMBER = "MEMBER"
    PLATFORM_ADMIN = "PLATFORM_ADMIN"


class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema

        return core_schema.no_info_plain_validator_function(cls.validate)

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, str) and ObjectId.is_valid(v):
            return v
        raise ValueError(f"Invalid ObjectId: {v}")


class UserInDB(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: PyObjectId | None = Field(default=None, alias="_id")
    email: EmailStr
    hashed_password: str
    full_name: str
    workspace_id: PyObjectId | None = None
    role: UserRole = UserRole.MEMBER
    avatar_url: str | None = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class UserPublic(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    avatar_url: str | None = None
    workspace_id: str | None = None


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=1, max_length=100)
    workspace_name: str = Field(min_length=1, max_length=100)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
