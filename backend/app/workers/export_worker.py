import asyncio
import io
import json
import logging
import textwrap
from datetime import UTC, datetime

from bson import ObjectId

from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3)
def export_chat_pdf(self, room_id: str, workspace_id: str, requested_by: str):
    asyncio.run(_export_chat_pdf_async(room_id, workspace_id, requested_by))


async def _export_chat_pdf_async(room_id: str, workspace_id: str, requested_by: str):
    from app.database import get_db
    from app.redis_client import get_redis
    from app.services.storage_service import StorageService

    db = get_db()
    storage = StorageService()

    room = await db.rooms.find_one({"_id": ObjectId(room_id)})
    if not room:
        logger.error("Room %s not found for export", room_id)
        return

    cursor = db.messages.find({"room_id": ObjectId(room_id)}).sort("created_at", 1)
    messages = [m async for m in cursor]

    requester = await db.users.find_one({"_id": ObjectId(requested_by)}, {"email": 1, "full_name": 1})
    requester_name = requester.get("full_name", "Unknown") if requester else "Unknown"
    requester_email = requester.get("email", "") if requester else ""

    author_cache: dict[str, str] = {}
    for msg in messages:
        aid = msg.get("author_id")
        if aid and str(aid) not in author_cache:
            user = await db.users.find_one({"_id": aid}, {"full_name": 1})
            author_cache[str(aid)] = user.get("full_name", "Member") if user else "Member"

    pdf_bytes = _build_pdf(room.get("name", "Chat Export"), messages, author_cache, requester_name)

    timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
    key = f"exports/{workspace_id}/{room_id}_{timestamp}.pdf"
    storage._ensure_bucket()
    storage._client.put_object(
        Bucket=storage._bucket,
        Key=key,
        Body=pdf_bytes,
        ContentType="application/pdf",
    )

    export_doc = {
        "room_id": ObjectId(room_id),
        "workspace_id": ObjectId(workspace_id),
        "requested_by": ObjectId(requested_by),
        "s3_key": key,
        "message_count": len(messages),
        "created_at": datetime.now(UTC),
    }
    result = await db.exports.insert_one(export_doc)
    export_id = str(result.inserted_id)

    redis = get_redis()
    await redis.publish(
        "notifications",
        json.dumps({
            "type": "export_ready",
            "workspace_id": workspace_id,
            "user_id": requested_by,
            "userEmail": requester_email,
            "userName": requester_name,
            "metadata": {"room_id": room_id, "export_id": export_id},
            "title": "Export ready",
            "body": f"Your PDF export for '{room.get('name')}' is ready to download.",
        }),
    )

    logger.info("PDF export complete — room=%s export=%s", room_id, export_id)


def _build_pdf(
    room_name: str,
    messages: list[dict],
    author_cache: dict[str, str],
    requester_name: str,
) -> bytes:
    import fitz  # PyMuPDF

    W, H = 595, 842  # A4 portrait
    ML, MR = 55, 540  # left / right margins
    LINE_H = 14
    WRAP_CHARS = 88

    INDIGO = (0.31, 0.275, 0.898)
    GRAY = (0.42, 0.447, 0.502)
    DARK = (0.12, 0.12, 0.12)

    doc = fitz.open()

    def new_page() -> tuple[fitz.Page, float]:
        p = doc.new_page(width=W, height=H)
        return p, 55.0

    page, y = new_page()

    # ── Header ──────────────────────────────────────────────
    page.insert_text((ML, y), "DocuMind", fontsize=18, color=INDIGO)
    y += 28
    page.insert_text((ML, y), room_name, fontsize=14, color=DARK)
    y += 22
    export_date = datetime.now().strftime("%B %d, %Y at %H:%M")
    page.insert_text(
        (ML, y),
        f"Exported by: {requester_name}  ·  {export_date}  ·  {len(messages)} messages",
        fontsize=8.5,
        color=GRAY,
    )
    y += 18
    page.draw_line((ML, y), (MR, y), color=(0.82, 0.82, 0.82), width=0.5)
    y += 16

    # ── Messages ────────────────────────────────────────────
    for msg in messages:
        role = msg.get("role", "user")
        content = str(msg.get("content", ""))

        if role == "assistant":
            label = "DocuMind AI"
            label_color = INDIGO
        else:
            aid = str(msg.get("author_id", ""))
            label = author_cache.get(aid, "Member")
            label_color = (0.18, 0.42, 0.78)

        created_at = msg.get("created_at")
        time_str = created_at.strftime("%H:%M") if isinstance(created_at, datetime) else ""

        # Ensure room for label
        if y > H - 70:
            page, y = new_page()

        page.insert_text((ML, y), label, fontsize=8.5, color=label_color)
        if time_str:
            page.insert_text((MR - 28, y), time_str, fontsize=8, color=GRAY)
        y += 13

        # Wrap & render content lines
        wrapped = textwrap.wrap(content, width=WRAP_CHARS) or ["(empty)"]
        for line in wrapped:
            if y > H - 48:
                page, y = new_page()
            page.insert_text((ML, y), line, fontsize=10.5, color=DARK)
            y += LINE_H

        # Sources
        sources = msg.get("sources") or []
        if sources:
            y += 3
            if y > H - 40:
                page, y = new_page()
            doc_names = ", ".join(s.get("document_name", "") for s in sources[:3])
            src_label = f"↳ Sources: {doc_names}"
            if len(src_label) > 95:
                src_label = src_label[:92] + "…"
            page.insert_text((ML + 8, y), src_label, fontsize=8, color=GRAY)
            y += 12

        y += 10  # gap between messages

    # ── Footer on last page ──────────────────────────────────
    page.draw_line((ML, H - 28), (MR, H - 28), color=(0.88, 0.88, 0.88), width=0.3)
    page.insert_text(
        (ML, H - 17),
        f"Generated by DocuMind  ·  {datetime.now().strftime('%Y-%m-%d')}",
        fontsize=7.5,
        color=GRAY,
    )

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()
