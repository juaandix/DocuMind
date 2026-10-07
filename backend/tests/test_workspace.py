import pytest


@pytest.mark.asyncio
async def test_get_workspace(client, auth_headers):
    resp = await client.get("/api/v1/workspace/", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Test Workspace"
    assert "storage_used_bytes" in data
    assert "storage_limit_bytes" in data


@pytest.mark.asyncio
async def test_update_workspace_name(client, auth_headers):
    resp = await client.patch(
        "/api/v1/workspace/",
        headers=auth_headers,
        json={"name": "Renamed Workspace"},
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Renamed Workspace"


@pytest.mark.asyncio
async def test_list_members(client, auth_headers):
    resp = await client.get("/api/v1/workspace/members", headers=auth_headers)
    assert resp.status_code == 200
    members = resp.json()
    assert len(members) == 1
    assert members[0]["email"] == "test@example.com"
    assert members[0]["role"] == "OWNER"


@pytest.mark.asyncio
async def test_invite_member(client, auth_headers):
    resp = await client.post(
        "/api/v1/workspace/members/invite",
        headers=auth_headers,
        json={"email": "invitee@example.com", "role": "MEMBER"},
    )
    assert resp.status_code == 201
    assert "token" in resp.json()


@pytest.mark.asyncio
async def test_invite_duplicate(client, auth_headers):
    body = {"email": "dup@example.com", "role": "MEMBER"}
    await client.post("/api/v1/workspace/members/invite", headers=auth_headers, json=body)
    resp = await client.post("/api/v1/workspace/members/invite", headers=auth_headers, json=body)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_get_invite_info(client, auth_headers):
    invite = await client.post(
        "/api/v1/workspace/members/invite",
        headers=auth_headers,
        json={"email": "info@example.com", "role": "ADMIN"},
    )
    token = invite.json()["token"]

    resp = await client.get(f"/api/v1/workspace/invite/{token}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "info@example.com"
    assert data["role"] == "ADMIN"


@pytest.mark.asyncio
async def test_accept_invite(client, auth_headers):
    invite = await client.post(
        "/api/v1/workspace/members/invite",
        headers=auth_headers,
        json={"email": "newmember@example.com", "role": "MEMBER"},
    )
    token = invite.json()["token"]

    resp = await client.post(
        f"/api/v1/workspace/invite/{token}/accept",
        json={"full_name": "New Member", "password": "password123"},
    )
    assert resp.status_code == 201
    assert "access_token" in resp.json()

    # Token can't be reused
    resp2 = await client.post(
        f"/api/v1/workspace/invite/{token}/accept",
        json={"full_name": "Another", "password": "password123"},
    )
    assert resp2.status_code == 404


@pytest.mark.asyncio
async def test_update_member_role(client, auth_headers):
    invite = await client.post(
        "/api/v1/workspace/members/invite",
        headers=auth_headers,
        json={"email": "promote@example.com", "role": "MEMBER"},
    )
    token = invite.json()["token"]
    await client.post(
        f"/api/v1/workspace/invite/{token}/accept",
        json={"full_name": "Promote Me", "password": "password123"},
    )

    members = await client.get("/api/v1/workspace/members", headers=auth_headers)
    target = next(m for m in members.json() if m["email"] == "promote@example.com")

    resp = await client.patch(
        f"/api/v1/workspace/members/{target['id']}",
        headers=auth_headers,
        json={"role": "ADMIN"},
    )
    assert resp.status_code == 200
    assert resp.json()["role"] == "ADMIN"


@pytest.mark.asyncio
async def test_member_update_workspace_forbidden(client, auth_headers):
    # Member role cannot update workspace
    invite = await client.post(
        "/api/v1/workspace/members/invite",
        headers=auth_headers,
        json={"email": "member@example.com", "role": "MEMBER"},
    )
    token = invite.json()["token"]
    await client.post(
        f"/api/v1/workspace/invite/{token}/accept",
        json={"full_name": "Member", "password": "pass1234"},
    )
    login = await client.post(
        "/api/v1/auth/login", json={"email": "member@example.com", "password": "pass1234"}
    )
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    resp = await client.patch("/api/v1/workspace/", headers=headers, json={"name": "Hacked"})
    assert resp.status_code == 403
