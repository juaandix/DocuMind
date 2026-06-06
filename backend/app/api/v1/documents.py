from datetime import UTC, datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, File, Query, UploadFile

from app.config import settings
from app.core.dependencies import get_current_user, require_role
from app.core.exceptions import NotFoundError, UnprocessableError
from app.database import get_db
from app.models.document import DocumentPublic, TagsUpdate
from app.models.user import UserInDB, UserRole
from app.services.storage_service import StorageService
from app.workers.document_processor import process_document

router = APIRouter(prefix="/documents", tags=["documents"])


def _fmt_doc(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    doc["workspace_id"] = str(doc["workspace_id"])
    doc["uploaded_by"] = str(doc["uploaded_by"])
    return doc


@router.get("/", response_model=list[DocumentPublic])
async def list_documents(
    status: str | None = Query(None),
    tag: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: UserInDB = Depends(get_current_user),
):
    db = get_db()
    query: dict = {"workspace_id": ObjectId(current_user.workspace_id)}
    if status:
        query["status"] = status
    if tag:
        query["tags"] = tag
    cursor = db.documents.find(query).skip(skip).limit(limit).sort("created_at", -1)
    return [DocumentPublic(**_fmt_doc(d)) async for d in cursor]


@router.post("/upload", response_model=DocumentPublic, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_user),
):
    if file.content_type not in settings.allowed_mime_types:
        raise UnprocessableError(f"File type '{file.content_type}' not supported")

    file_bytes = await file.read()
    if len(file_bytes) > settings.max_upload_size_bytes:
        raise UnprocessableError("File exceeds the 50 MB size limit")

    storage = StorageService()
    s3_key = await storage.upload(file_bytes, file.filename, file.content_type)

    db = get_db()
    doc_id = ObjectId()
    doc = {
        "_id": doc_id,
        "workspace_id": ObjectId(current_user.workspace_id),
        "uploaded_by": ObjectId(current_user.id),
        "filename": file.filename,
        "original_name": file.filename,
        "mime_type": file.content_type,
        "size_bytes": len(file_bytes),
        "s3_key": s3_key,
        "status": "UPLOADING",
        "error_message": None,
        "page_count": None,
        "chunk_count": None,
        "tags": [],
        "created_at": datetime.now(UTC),
        "processed_at": None,
    }
    await db.documents.insert_one(doc)

    # Enqueue Celery task
    process_document.delay(str(doc_id), current_user.workspace_id)

    return DocumentPublic(**_fmt_doc(doc))


@router.get("/{doc_id}", response_model=DocumentPublic)
async def get_document(doc_id: str, current_user: UserInDB = Depends(get_current_user)):
    db = get_db()
    doc = await db.documents.find_one(
        {"_id": ObjectId(doc_id), "workspace_id": ObjectId(current_user.workspace_id)}
    )
    if not doc:
        raise NotFoundError("Document not found")
    return DocumentPublic(**_fmt_doc(doc))


@router.get("/{doc_id}/status")
async def get_document_status(doc_id: str, current_user: UserInDB = Depends(get_current_user)):
    db = get_db()
    doc = await db.documents.find_one(
        {"_id": ObjectId(doc_id), "workspace_id": ObjectId(current_user.workspace_id)},
        {"status": 1, "error_message": 1, "chunk_count": 1},
    )
    if not doc:
        raise NotFoundError("Document not found")
    return {
        "status": doc["status"],
        "error_message": doc.get("error_message"),
        "chunk_count": doc.get("chunk_count"),
    }


@router.patch("/{doc_id}/tags", response_model=DocumentPublic)
async def update_tags(
    doc_id: str,
    body: TagsUpdate,
    current_user: UserInDB = Depends(get_current_user),
):
    db = get_db()
    result = await db.documents.find_one_and_update(
        {"_id": ObjectId(doc_id), "workspace_id": ObjectId(current_user.workspace_id)},
        {"$set": {"tags": body.tags}},
        return_document=True,
    )
    if not result:
        raise NotFoundError("Document not found")
    return DocumentPublic(**_fmt_doc(result))


@router.delete("/{doc_id}", status_code=204)
async def delete_document(
    doc_id: str,
    current_user: UserInDB = Depends(require_role(UserRole.OWNER, UserRole.ADMIN)),
):
    db = get_db()
    doc = await db.documents.find_one(
        {"_id": ObjectId(doc_id), "workspace_id": ObjectId(current_user.workspace_id)}
    )
    if not doc:
        raise NotFoundError("Document not found")

    storage = StorageService()
    await storage.delete(doc["s3_key"])

    await db.document_chunks.delete_many({"document_id": ObjectId(doc_id)})
    await db.documents.delete_one({"_id": ObjectId(doc_id)})
