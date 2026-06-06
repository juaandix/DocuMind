from datetime import datetime

from pydantic import BaseModel, Field

from app.models.user import PyObjectId


class RoomInDB(BaseModel):
    id: PyObjectId | None = Field(default=None, alias="_id")
    workspace_id: PyObjectId
    name: str
    document_ids: list[PyObjectId] = Field(default_factory=list)
    created_by: PyObjectId
    members: list[PyObjectId] = Field(default_factory=list)
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RoomPublic(BaseModel):
    id: str
    workspace_id: str
    name: str
    document_ids: list[str]
    created_by: str
    members: list[str]
    is_active: bool
    created_at: datetime


class RoomCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    document_ids: list[str] = Field(default_factory=list)


class RoomUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    document_ids: list[str] | None = None
