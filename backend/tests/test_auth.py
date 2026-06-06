import pytest


@pytest.mark.asyncio
async def test_register_success(client):
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "securepassword",
            "full_name": "New User",
            "workspace_name": "New Workspace",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    body = {
        "email": "dup@example.com",
        "password": "securepassword",
        "full_name": "User",
        "workspace_name": "WS",
    }
    await client.post("/api/v1/auth/register", json=body)
    resp = await client.post("/api/v1/auth/register", json=body)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_login_success(client):
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "login@example.com",
            "password": "mypassword",
            "full_name": "Login User",
            "workspace_name": "Login WS",
        },
    )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "login@example.com", "password": "mypassword"},
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "wp@example.com",
            "password": "correctpass",
            "full_name": "WP User",
            "workspace_name": "WP WS",
        },
    )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "wp@example.com", "password": "wrongpass"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_authenticated(client, auth_headers):
    resp = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_protected_route_unauthorized(client):
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401
