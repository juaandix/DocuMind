from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field

from app.models.user import PyObjectId


class MessageRole(StrEnum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class MessageSource(BaseModel):
    document_id: str
    document_name: str
    chunk_content: str
    page: int | None = None
    score: float


class MessageInDB(BaseModel):
    id: PyObjectId | None = Field(default=None, alias="_id")
    room_id: PyObjectId
    workspace_id: PyObjectId
    author_id: PyObjectId | None = None
    role: MessageRole
    content: str
    sources: list[MessageSource] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class MessagePublic(BaseModel):
    id: str
    room_id: str
    author_id: str | None = None
    role: MessageRole
    content: str
    sources: list[MessageSource]
    created_at: datetime
