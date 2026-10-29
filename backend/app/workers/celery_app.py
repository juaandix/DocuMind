import asyncio
from collections.abc import Coroutine
from typing import Any

from celery import Celery

from app.config import settings

celery_app = Celery(
    "documind",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=[
        "app.workers.document_processor",
        "app.workers.export_worker",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    broker_connection_retry=False,
    broker_connection_timeout=2,
)


def run_async(coro: Coroutine[Any, Any, Any]) -> Any:
    """Run a task's async body in its own event loop.

    Motor and redis.asyncio clients are module-level singletons bound to the loop
    that created them. Each Celery task gets a fresh loop from asyncio.run(), so
    the clients are closed when the task ends and recreated by the next one;
    otherwise the second task fails with "Event loop is closed".
    """
    from app.database import close_db
    from app.redis_client import close_redis

    async def _run() -> Any:
        try:
            return await coro
        finally:
            await close_db()
            await close_redis()

    return asyncio.run(_run())
