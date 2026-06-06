from fastapi import APIRouter

from app.database import get_db
from app.redis_client import get_redis

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
async def health():
    return {"status": "ok", "service": "documind-api"}


@router.get("/ready")
async def readiness():
    errors = []
    try:
        db = get_db()
        await db.command("ping")
    except Exception as e:
        errors.append(f"mongodb: {e}")
    try:
        redis = get_redis()
        await redis.ping()
    except Exception as e:
        errors.append(f"redis: {e}")
    if errors:
        return {"status": "degraded", "errors": errors}
    return {"status": "ready"}
