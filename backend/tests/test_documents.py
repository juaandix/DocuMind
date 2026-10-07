import io

import pytest


@pytest.mark.asyncio
async def test_list_empty(client, auth_headers):
    resp = await client.get("/api/v1/documents/", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_upload_unsupported_type(client, auth_headers):
    resp = await client.post(
        "/api/v1/documents/upload",
        headers=auth_headers,
        files={"file": ("test.exe", b"binary", "application/octet-stream")},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_upload_txt(client, auth_headers):
    content = b"Hello DocuMind test document"
    resp = await client.post(
        "/api/v1/documents/upload",
        headers=auth_headers,
        files={"file": ("test.txt", io.BytesIO(content), "text/plain")},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["filename"] == "test.txt"
    assert data["status"] == "UPLOADING"
    assert data["size_bytes"] == len(content)
    return data["id"]


@pytest.mark.asyncio
async def test_get_document(client, auth_headers):
    upload = await client.post(
        "/api/v1/documents/upload",
        headers=auth_headers,
        files={"file": ("get_me.txt", b"content", "text/plain")},
    )
    doc_id = upload.json()["id"]

    resp = await client.get(f"/api/v1/documents/{doc_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == doc_id


@pytest.mark.asyncio
async def test_get_document_not_found(client, auth_headers):
    from bson import ObjectId

    fake_id = str(ObjectId())
    resp = await client.get(f"/api/v1/documents/{fake_id}", headers=auth_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_document_status(client, auth_headers):
    upload = await client.post(
        "/api/v1/documents/upload",
        headers=auth_headers,
        files={"file": ("status.txt", b"hi", "text/plain")},
    )
    doc_id = upload.json()["id"]

    resp = await client.get(f"/api/v1/documents/{doc_id}/status", headers=auth_headers)
    assert resp.status_code == 200
    assert "status" in resp.json()


@pytest.mark.asyncio
async def test_update_tags(client, auth_headers):
    upload = await client.post(
        "/api/v1/documents/upload",
        headers=auth_headers,
        files={"file": ("tags.txt", b"content", "text/plain")},
    )
    doc_id = upload.json()["id"]

    resp = await client.patch(
        f"/api/v1/documents/{doc_id}/tags",
        headers=auth_headers,
        json={"tags": ["finance", "q4"]},
    )
    assert resp.status_code == 200
    assert resp.json()["tags"] == ["finance", "q4"]


@pytest.mark.asyncio
async def test_delete_document(client, auth_headers):
    upload = await client.post(
        "/api/v1/documents/upload",
        headers=auth_headers,
        files={"file": ("del.txt", b"bye", "text/plain")},
    )
    doc_id = upload.json()["id"]

    resp = await client.delete(f"/api/v1/documents/{doc_id}", headers=auth_headers)
    assert resp.status_code == 204

    resp2 = await client.get(f"/api/v1/documents/{doc_id}", headers=auth_headers)
    assert resp2.status_code == 404


@pytest.mark.asyncio
async def test_document_isolated_between_workspaces(client, auth_headers):
    # Upload as user 1
    upload = await client.post(
        "/api/v1/documents/upload",
        headers=auth_headers,
        files={"file": ("private.txt", b"secret", "text/plain")},
    )
    doc_id = upload.json()["id"]

    # Register and login as user 2 (different workspace)
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "other@example.com",
            "password": "pass1234",
            "full_name": "Other",
            "workspace_name": "Other WS",
        },
    )
    login2 = await client.post(
        "/api/v1/auth/login", json={"email": "other@example.com", "password": "pass1234"}
    )
    headers2 = {"Authorization": f"Bearer {login2.json()['access_token']}"}

    resp = await client.get(f"/api/v1/documents/{doc_id}", headers=headers2)
    assert resp.status_code == 404
