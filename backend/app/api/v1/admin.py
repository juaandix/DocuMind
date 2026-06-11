from datetime import UTC, datetime, timedelta

from bson import ObjectId
from fastapi import APIRouter, Depends, Query

from app.core.dependencies import require_platform_admin
from app.core.exceptions import NotFoundError
from app.database import get_db
from app.models.user import UserInDB

router = APIRouter(prefix="/admin/platform", tags=["admin-platform"])


def _str_ids(doc: dict, *fields: str) -> dict:
    for f in fields:
        if doc.get(f) is not None:
            doc[f] = str(doc[f])
    return doc


@router.get("/stats")
async def platform_stats(_: UserInDB = Depends(require_platform_admin)):
    db = get_db()
    today = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)

    total_workspaces = await db.workspaces.count_documents({})
    active_workspaces = await db.workspaces.count_documents({"status": "ACTIVE"})
    total_users = await db.users.count_documents({})
    total_documents = await db.documents.count_documents({})
    processed_today = await db.documents.count_documents({"status": "READY", "processed_at": {"$gte": today}})
    failed_today = await db.celery_jobs.count_documents({"status": "FAILURE", "finished_at": {"$gte": today}})
    pending_jobs = await db.celery_jobs.count_documents({"status": {"$in": ["PENDING", "STARTED"]}})

    storage_pipeline = [{"$group": {"_id": None, "total": {"$sum": "$size_bytes"}}}]
    storage_result = await db.documents.aggregate(storage_pipeline).to_list(1)
    storage_total = storage_result[0]["total"] if storage_result else 0

    return {
        "total_workspaces": total_workspaces,
        "active_workspaces": active_workspaces,
        "total_users": total_users,
        "total_documents": total_documents,
        "documents_processed_today": processed_today,
        "storage_total_bytes": storage_total,
        "celery_jobs_pending": pending_jobs,
        "celery_jobs_failed_today": failed_today,
    }


@router.get("/workspaces")
async def list_workspaces(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    _: UserInDB = Depends(require_platform_admin),
):
    db = get_db()
    skip = (page - 1) * limit
    total = await db.workspaces.count_documents({})
    cursor = db.workspaces.find({}).skip(skip).limit(limit).sort("created_at", -1)
    workspaces = []
    async for w in cursor:
        w_id = str(w["_id"])
        member_count = await db.users.count_documents({"workspace_id": w["_id"]})
        doc_count = await db.documents.count_documents({"workspace_id": w["_id"]})
        owner = await db.users.find_one({"_id": w.get("owner_id")}, {"email": 1})
        workspaces.append({
            "id": w_id,
            "name": w.get("name"),
            "plan": w.get("plan", "FREE"),
            "status": w.get("status", "ACTIVE"),
            "owner_email": owner["email"] if owner else "",
            "member_count": member_count,
            "document_count": doc_count,
            "storage_bytes": w.get("storage_bytes", 0),
            "created_at": w.get("created_at"),
        })
    return {"data": workspaces, "total": total, "page": page, "limit": limit}


@router.patch("/workspaces/{workspace_id}/suspend")
async def suspend_workspace(
    workspace_id: str,
    _: UserInDB = Depends(require_platform_admin),
):
    db = get_db()
    result = await db.workspaces.find_one_and_update(
        {"_id": ObjectId(workspace_id)},
        {"$set": {"status": "SUSPENDED", "updated_at": datetime.now(UTC)}},
        return_document=True,
    )
    if not result:
        raise NotFoundError("Workspace not found")
    return {**result, "id": str(result.pop("_id"))}


@router.patch("/workspaces/{workspace_id}/plan")
async def change_plan(
    workspace_id: str,
    body: dict,
    _: UserInDB = Depends(require_platform_admin),
):
    plan = body.get("plan")
    if plan not in ("FREE", "PRO"):
        from app.core.exceptions import UnprocessableError
        raise UnprocessableError("Plan must be FREE or PRO")

    db = get_db()
    result = await db.workspaces.find_one_and_update(
        {"_id": ObjectId(workspace_id)},
        {"$set": {"plan": plan, "updated_at": datetime.now(UTC)}},
        return_document=True,
    )
    if not result:
        raise NotFoundError("Workspace not found")
    return {**result, "id": str(result.pop("_id"))}


@router.get("/users")
async def list_users(
    email: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    _: UserInDB = Depends(require_platform_admin),
):
    db = get_db()
    query: dict = {}
    if email:
        query["email"] = {"$regex": email, "$options": "i"}

    cursor = db.users.find(query, {"hashed_password": 0}).skip(skip).limit(limit).sort("created_at", -1)
    users = []
    async for u in cursor:
        ws = None
        if u.get("workspace_id"):
            ws = await db.workspaces.find_one({"_id": u["workspace_id"]}, {"name": 1})
        users.append({
            "id": str(u["_id"]),
            "email": u["email"],
            "full_name": u["full_name"],
            "workspace_id": str(u["workspace_id"]) if u.get("workspace_id") else None,
            "workspace_name": ws["name"] if ws else "",
            "role": u.get("role"),
            "is_active": u.get("is_active", True),
            "last_login": u.get("last_login"),
            "created_at": u.get("created_at"),
        })
    return users


@router.delete("/users/{user_id}/sessions", status_code=204)
async def force_logout(user_id: str, _: UserInDB = Depends(require_platform_admin)):
    db = get_db()
    await db.refresh_tokens.delete_many({"user_id": ObjectId(user_id)})


@router.get("/jobs")
async def list_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    _: UserInDB = Depends(require_platform_admin),
):
    db = get_db()
    cursor = db.celery_jobs.find({}).skip(skip).limit(limit).sort("started_at", -1)
    jobs = []
    async for j in cursor:
        jobs.append({
            "id": str(j["_id"]),
            "task_name": j.get("task_name"),
            "status": j.get("status"),
            "document_id": str(j["document_id"]) if j.get("document_id") else None,
            "workspace_id": str(j["workspace_id"]) if j.get("workspace_id") else None,
            "started_at": j.get("started_at"),
            "finished_at": j.get("finished_at"),
            "duration_seconds": j.get("duration_seconds"),
            "error": j.get("error"),
        })
    return jobs


@router.get("/notifications")
async def list_platform_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    _: UserInDB = Depends(require_platform_admin),
):
    db = get_db()
    cursor = db.notifications.find({}).skip(skip).limit(limit).sort("created_at", -1)
    result = []
    async for n in cursor:
        user = await db.users.find_one({"_id": n.get("user_id")}, {"email": 1})
        result.append({
            "id": str(n["_id"]),
            "user_id": str(n.get("user_id", "")),
            "user_email": user["email"] if user else "",
            "type": n.get("type"),
            "title": n.get("title"),
            "read": n.get("read", False),
            "email_sent": n.get("email_sent", False),
            "created_at": n.get("created_at"),
        })
    return result
