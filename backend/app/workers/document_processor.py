import asyncio
import io
import logging
from datetime import UTC, datetime

from bson import ObjectId

from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3)
def process_document(self, document_id: str, workspace_id: str):
    asyncio.run(_process_document_async(document_id, workspace_id))


async def _process_document_async(document_id: str, workspace_id: str):
    from app.config import settings
    from app.database import get_db
    from app.services.storage_service import StorageService

    db = get_db()
    doc_oid = ObjectId(document_id)
    storage = StorageService()

    try:
        doc = await db.documents.find_one({"_id": doc_oid})
        if not doc:
            logger.error("Document %s not found", document_id)
            return

        await db.documents.update_one(
            {"_id": doc_oid}, {"$set": {"status": "PROCESSING"}}
        )

        # Download from S3/MinIO
        file_bytes = await storage.download(doc["s3_key"])

        # Extract text
        text_chunks = _extract_text(file_bytes, doc["mime_type"], doc["original_name"])

        # Generate embeddings
        embeddings = await _generate_embeddings(text_chunks, settings)

        # Persist chunks
        chunk_docs = [
            {
                "document_id": doc_oid,
                "workspace_id": ObjectId(workspace_id),
                "content": chunk["content"],
                "embedding": emb,
                "metadata": chunk["metadata"],
            }
            for chunk, emb in zip(text_chunks, embeddings, strict=True)
        ]
        if chunk_docs:
            await db.document_chunks.insert_many(chunk_docs)

        await db.documents.update_one(
            {"_id": doc_oid},
            {
                "$set": {
                    "status": "READY",
                    "chunk_count": len(chunk_docs),
                    "processed_at": datetime.now(UTC),
                }
            },
        )

        # Notify WebSocket subscribers
        from app.redis_client import get_redis
        import json

        redis = get_redis()
        await redis.publish(
            f"workspace:{workspace_id}",
            json.dumps({
                "type": "document_ready",
                "document_id": document_id,
                "name": doc["original_name"],
            }),
        )

        # Notify Notification Service via shared Redis channel
        uploader = await db.users.find_one({"_id": doc["uploaded_by"]}, {"email": 1, "full_name": 1})
        await redis.publish(
            "notifications",
            json.dumps({
                "type": "document_ready",
                "workspace_id": workspace_id,
                "user_id": str(doc["uploaded_by"]),
                "userEmail": uploader["email"] if uploader else "",
                "userName": uploader["full_name"] if uploader else "",
                "metadata": {
                    "documentId": document_id,
                    "documentName": doc["original_name"],
                    "chunkCount": len(chunk_docs),
                },
                "title": f'"{doc["original_name"]}" está listo para consultar',
                "body": f"Se han indexado {len(chunk_docs)} fragmentos.",
            }),
        )

    except Exception as exc:
        logger.exception("Error processing document %s", document_id)
        await db.documents.update_one(
            {"_id": doc_oid},
            {"$set": {"status": "ERROR", "error_message": str(exc)}},
        )
        # Notify error via Notification Service
        try:
            from app.redis_client import get_redis
            import json
            redis = get_redis()
            doc = await db.documents.find_one({"_id": doc_oid}, {"uploaded_by": 1, "original_name": 1})
            if doc:
                uploader = await db.users.find_one({"_id": doc["uploaded_by"]}, {"email": 1, "full_name": 1})
                await redis.publish(
                    "notifications",
                    json.dumps({
                        "type": "document_error",
                        "workspace_id": workspace_id,
                        "user_id": str(doc["uploaded_by"]),
                        "userEmail": uploader["email"] if uploader else "",
                        "userName": uploader["full_name"] if uploader else "",
                        "metadata": {
                            "documentId": document_id,
                            "documentName": doc["original_name"],
                            "errorMessage": str(exc),
                        },
                        "title": f'Error al procesar "{doc["original_name"]}"',
                        "body": str(exc),
                    }),
                )
        except Exception:
            logger.exception("Failed to publish document_error notification")


def _extract_text(file_bytes: bytes, mime_type: str, filename: str) -> list[dict]:
    from langchain.text_splitter import RecursiveCharacterTextSplitter

    splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=80)

    if mime_type == "application/pdf":
        raw_chunks = _extract_pdf(file_bytes)
    elif mime_type == "text/csv":
        raw_chunks = _extract_csv(file_bytes)
    elif mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        raw_chunks = _extract_docx(file_bytes)
    else:
        raw_chunks = [{"content": file_bytes.decode("utf-8", errors="replace"), "page": None}]

    result = []
    for i, raw in enumerate(raw_chunks):
        sub_chunks = splitter.split_text(raw["content"])
        for j, sub in enumerate(sub_chunks):
            result.append(
                {
                    "content": sub,
                    "metadata": {
                        "page": raw.get("page"),
                        "chunk_index": i * 100 + j,
                        "source": filename,
                    },
                }
            )
    return result


def _extract_pdf(file_bytes: bytes) -> list[dict]:
    import fitz  # PyMuPDF

    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages = []
    for page_num in range(len(doc)):
        text = doc[page_num].get_text()
        if text.strip():
            pages.append({"content": text, "page": page_num + 1})
    return pages


def _extract_csv(file_bytes: bytes) -> list[dict]:
    import pandas as pd

    df = pd.read_csv(io.BytesIO(file_bytes))
    # Convert to readable text blocks
    header = ", ".join(df.columns.tolist())
    rows = df.to_string(index=False)
    return [{"content": f"Columns: {header}\n\n{rows}", "page": None}]


def _extract_docx(file_bytes: bytes) -> list[dict]:
    from docx import Document

    doc = Document(io.BytesIO(file_bytes))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return [{"content": "\n".join(paragraphs), "page": None}]


async def _generate_embeddings(chunks: list[dict], settings) -> list[list[float]]:
    texts = [c["content"] for c in chunks]
    if settings.llm_provider == "anthropic":
        # Voyage embeddings via LangChain
        from langchain_community.embeddings import VoyageEmbeddings

        embedder = VoyageEmbeddings(
            voyage_api_key=settings.anthropic_api_key, model="voyage-3"
        )
    else:
        from langchain_openai import OpenAIEmbeddings

        embedder = OpenAIEmbeddings(
            api_key=settings.openai_api_key, model=settings.embedding_model
        )
    return await embedder.aembed_documents(texts)
