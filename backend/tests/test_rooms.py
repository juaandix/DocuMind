import pytest


@pytest.mark.asyncio
async def test_create_room(client, auth_headers):
    resp = await client.post(
        "/api/v1/rooms/",
        headers=auth_headers,
        json={"name": "Test Room", "document_ids": []},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Test Room"
    assert data["document_ids"] == []
    return data["id"]


@pytest.mark.asyncio
async def test_list_rooms(client, auth_headers):
    await client.post("/api/v1/rooms/", headers=auth_headers, json={"name": "Room A", "document_ids": []})
    await client.post("/api/v1/rooms/", headers=auth_headers, json={"name": "Room B", "document_ids": []})

    resp = await client.get("/api/v1/rooms/", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2


@pytest.mark.asyncio
async def test_get_room(client, auth_headers):
    create = await client.post(
        "/api/v1/rooms/", headers=auth_headers, json={"name": "Get Me", "document_ids": []}
    )
    room_id = create.json()["id"]

    resp = await client.get(f"/api/v1/rooms/{room_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == room_id


@pytest.mark.asyncio
async def test_get_room_not_found(client, auth_headers):
    from bson import ObjectId
    resp = await client.get(f"/api/v1/rooms/{ObjectId()}", headers=auth_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_room_name(client, auth_headers):
    create = await client.post(
        "/api/v1/rooms/", headers=auth_headers, json={"name": "Old Name", "document_ids": []}
    )
    room_id = create.json()["id"]

    resp = await client.patch(
        f"/api/v1/rooms/{room_id}", headers=auth_headers, json={"name": "New Name"}
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "New Name"


@pytest.mark.asyncio
async def test_delete_room(client, auth_headers):
    create = await client.post(
        "/api/v1/rooms/", headers=auth_headers, json={"name": "Delete Me", "document_ids": []}
    )
    room_id = create.json()["id"]

    resp = await client.delete(f"/api/v1/rooms/{room_id}", headers=auth_headers)
    assert resp.status_code == 204

    # Room should not appear in list (is_active=False)
    rooms = await client.get("/api/v1/rooms/", headers=auth_headers)
    assert all(r["id"] != room_id for r in rooms.json())


@pytest.mark.asyncio
async def test_get_messages_empty(client, auth_headers):
    create = await client.post(
        "/api/v1/rooms/", headers=auth_headers, json={"name": "Msg Room", "document_ids": []}
    )
    room_id = create.json()["id"]

    resp = await client.get(f"/api/v1/rooms/{room_id}/messages", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_rooms_isolated_between_workspaces(client, auth_headers):
    create = await client.post(
        "/api/v1/rooms/", headers=auth_headers, json={"name": "Private", "document_ids": []}
    )
    room_id = create.json()["id"]

    await client.post(
        "/api/v1/auth/register",
        json={"email": "other2@example.com", "password": "pass1234", "full_name": "Other", "workspace_name": "WS2"},
    )
    login2 = await client.post("/api/v1/auth/login", json={"email": "other2@example.com", "password": "pass1234"})
    headers2 = {"Authorization": f"Bearer {login2.json()['access_token']}"}

    resp = await client.get(f"/api/v1/rooms/{room_id}", headers=headers2)
    assert resp.status_code == 404
