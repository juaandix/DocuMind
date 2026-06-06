from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field

from app.models.user import PyObjectId


class DocumentStatus(StrEnum):
    UPLOADING = "UPLOADING"
    PROCESSING = "PROCESSING"
    READY = "READY"
    ERROR = "ERROR"


class DocumentInDB(BaseModel):
    id: PyObjectId | None = Field(default=None, alias="_id")
    workspace_id: PyObjectId
    uploaded_by: PyObjectId
    filename: str
    original_name: str
    mime_type: str
    size_bytes: int
    s3_key: str
    status: DocumentStatus = DocumentStatus.UPLOADING
    error_message: str | None = None
    page_count: int | None = None
    chunk_count: int | None = None
    tags: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: datetime | None = None


class DocumentPublic(BaseModel):
    id: str
    workspace_id: str
    uploaded_by: str
    filename: str
    original_name: str
    mime_type: str
    size_bytes: int
    status: DocumentStatus
    error_message: str | None = None
    page_count: int | None = None
    chunk_count: int | None = None
    tags: list[str]
    created_at: datetime
    processed_at: datetime | None = None


class DocumentChunkInDB(BaseModel):
    id: PyObjectId | None = Field(default=None, alias="_id")
    document_id: PyObjectId
    workspace_id: PyObjectId
    content: str
    embedding: list[float]
    metadata: dict = Field(default_factory=dict)


class TagsUpdate(BaseModel):
    tags: list[str]
