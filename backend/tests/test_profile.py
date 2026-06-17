import pytest


@pytest.mark.asyncio
async def test_update_name(client, auth_headers):
    resp = await client.patch(
        "/api/v1/auth/me",
        headers=auth_headers,
        json={"full_name": "Updated Name"},
    )
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "Updated Name"


@pytest.mark.asyncio
async def test_update_name_too_short(client, auth_headers):
    resp = await client.patch(
        "/api/v1/auth/me",
        headers=auth_headers,
        json={"full_name": ""},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_change_password_success(client, auth_headers):
    resp = await client.post(
        "/api/v1/auth/me/password",
        headers=auth_headers,
        json={"current_password": "testpassword", "new_password": "newpass123"},
    )
    assert resp.status_code == 204

    # Old password no longer works
    login_old = await client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "testpassword"},
    )
    assert login_old.status_code == 401

    # New password works
    login_new = await client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "newpass123"},
    )
    assert login_new.status_code == 200


@pytest.mark.asyncio
async def test_change_password_wrong_current(client, auth_headers):
    resp = await client.post(
        "/api/v1/auth/me/password",
        headers=auth_headers,
        json={"current_password": "wrongpassword", "new_password": "newpass123"},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_change_password_too_short(client, auth_headers):
    resp = await client.post(
        "/api/v1/auth/me/password",
        headers=auth_headers,
        json={"current_password": "testpassword", "new_password": "short"},
    )
    assert resp.status_code == 422
