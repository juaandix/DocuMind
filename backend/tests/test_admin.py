from datetime import UTC, datetime

import pytest
from bson import ObjectId

from tests.conftest import TEST_DB_NAME

BASE = "/api/v1/admin/platform"


async def _register(client, email: str, workspace_name: str) -> dict:
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "testpassword",
            "full_name": email.split("@")[0],
            "workspace_name": workspace_name,
        },
    )
    resp = await client.post(
        "/api/v1/auth/login", json={"email": email, "password": "testpassword"}
    )
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


@pytest.fixture()
def db(motor_client_session):
    return motor_client_session[TEST_DB_NAME]


@pytest.fixture()
async def admin_headers(client, db):
    headers = await _register(client, "admin@example.com", "Platform")
    await db.users.update_one({"email": "admin@example.com"}, {"$set": {"role": "PLATFORM_ADMIN"}})
    return headers


async def _workspace_id(db, name: str) -> str:
    ws = await db.workspaces.find_one({"name": name})
    return str(ws["_id"])


@pytest.mark.asyncio
async def test_requires_platform_admin(client, auth_headers):
    resp = await client.get(f"{BASE}/stats", headers=auth_headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_requires_authentication(client):
    resp = await client.get(f"{BASE}/stats")
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_stats_counts_new_workspaces_as_active(client, admin_headers, db):
    await _register(client, "owner@acme-example.com", "Acme")
    await db.documents.insert_one(
        {
            "workspace_id": ObjectId(await _workspace_id(db, "Acme")),
            "status": "READY",
            "size_bytes": 2048,
            "processed_at": datetime.now(UTC),
        }
    )

    resp = await client.get(f"{BASE}/stats", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_workspaces"] == 2
    assert data["active_workspaces"] == 2
    assert data["total_users"] == 2
    assert data["total_documents"] == 1
    assert data["documents_processed_today"] == 1
    assert data["storage_total_bytes"] == 2048


@pytest.mark.asyncio
async def test_list_workspaces(client, admin_headers, db):
    await _register(client, "owner@acme-example.com", "Acme")
    await db.workspaces.update_one({"name": "Acme"}, {"$set": {"storage_used_bytes": 4096}})

    resp = await client.get(f"{BASE}/workspaces", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 2
    acme = next(w for w in body["data"] if w["name"] == "Acme")
    assert acme["owner_email"] == "owner@acme-example.com"
    assert acme["member_count"] == 1
    assert acme["plan"] == "FREE"
    assert acme["status"] == "ACTIVE"
    assert acme["storage_bytes"] == 4096


@pytest.mark.asyncio
async def test_suspend_workspace_returns_full_summary(client, admin_headers, db):
    await _register(client, "owner@acme-example.com", "Acme")
    ws_id = await _workspace_id(db, "Acme")

    resp = await client.patch(f"{BASE}/workspaces/{ws_id}/suspend", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == ws_id
    assert data["status"] == "SUSPENDED"
    assert data["owner_email"] == "owner@acme-example.com"
    assert data["member_count"] == 1

    stats = (await client.get(f"{BASE}/stats", headers=admin_headers)).json()
    assert stats["active_workspaces"] == 1


@pytest.mark.asyncio
async def test_change_plan(client, admin_headers, db):
    await _register(client, "owner@acme-example.com", "Acme")
    ws_id = await _workspace_id(db, "Acme")

    resp = await client.patch(
        f"{BASE}/workspaces/{ws_id}/plan", headers=admin_headers, json={"plan": "PRO"}
    )
    assert resp.status_code == 200
    assert resp.json()["plan"] == "PRO"
    assert resp.json()["owner_email"] == "owner@acme-example.com"


@pytest.mark.asyncio
async def test_change_plan_rejects_unknown_plan(client, admin_headers, db):
    ws_id = await _workspace_id(db, "Platform")
    resp = await client.patch(
        f"{BASE}/workspaces/{ws_id}/plan", headers=admin_headers, json={"plan": "ENTERPRISE"}
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
@pytest.mark.parametrize("ws_id", [str(ObjectId()), "not-an-object-id"])
async def test_suspend_unknown_workspace_returns_404(client, admin_headers, ws_id):
    resp = await client.patch(f"{BASE}/workspaces/{ws_id}/suspend", headers=admin_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_list_users_filters_by_email_and_hides_password(client, admin_headers):
    await _register(client, "owner@acme-example.com", "Acme")

    resp = await client.get(f"{BASE}/users", headers=admin_headers, params={"email": "acme"})
    assert resp.status_code == 200
    users = resp.json()
    assert len(users) == 1
    assert users[0]["email"] == "owner@acme-example.com"
    assert users[0]["workspace_name"] == "Acme"
    assert "hashed_password" not in users[0]


@pytest.mark.asyncio
async def test_force_logout_deletes_refresh_tokens(client, admin_headers, db):
    user_id = ObjectId()
    await db.refresh_tokens.insert_many([{"user_id": user_id}, {"user_id": user_id}])

    resp = await client.delete(f"{BASE}/users/{user_id}/sessions", headers=admin_headers)
    assert resp.status_code == 204
    assert await db.refresh_tokens.count_documents({"user_id": user_id}) == 0


@pytest.mark.asyncio
async def test_stats_history_returns_requested_days(client, admin_headers):
    resp = await client.get(f"{BASE}/stats/history", headers=admin_headers, params={"days": 3})
    assert resp.status_code == 200
    history = resp.json()
    assert len(history) == 3
    # the admin registered today
    assert history[-1]["new_users"] == 1
