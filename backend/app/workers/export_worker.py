import asyncio
import logging

from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True)
def export_chat_pdf(self, room_id: str, workspace_id: str, requested_by: str):
    asyncio.run(_export_chat_pdf_async(room_id, workspace_id, requested_by))


async def _export_chat_pdf_async(room_id: str, workspace_id: str, requested_by: str):
    # Implemented in Phase 5
    logger.info("PDF export task triggered for room %s", room_id)
