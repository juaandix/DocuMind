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
