import os

import fakeredis.aioredis
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from motor.motor_asyncio import AsyncIOMotorClient

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-testing-only")
os.environ.setdefault("MONGODB_URL", "mongodb://localhost:27017")
os.environ.setdefault("MONGODB_DB_NAME", "documind_test")
os.environ.setdefault("LLM_PROVIDER", "openai")
os.environ.setdefault("OPENAI_API_KEY", "sk-test")

TEST_MONGO_URL = "mongodb://localhost:27017"
TEST_DB_NAME = "documind_test"


@pytest_asyncio.fixture(scope="session")
async def motor_client_session():
    """Single Motor client for the entire test session — avoids event-loop caching issues."""
    client = AsyncIOMotorClient(TEST_MONGO_URL)
    yield client
    client.close()


@pytest_asyncio.fixture(scope="session")
async def fake_redis_session():
    r = fakeredis.aioredis.FakeRedis(decode_responses=True)
    yield r
    await r.aclose()


@pytest_asyncio.fixture(autouse=True)
async def clean_db(motor_client_session):
    """Drop all collections before each test to ensure isolation."""
    db = motor_client_session[TEST_DB_NAME]
    for name in await db.list_collection_names():
        await db.drop_collection(name)


@pytest_asyncio.fixture()
async def client(motor_client_session, fake_redis_session, monkeypatch):
    import app.database as db_module
    import app.redis_client as redis_module

    test_db = motor_client_session[TEST_DB_NAME]

    monkeypatch.setattr(db_module, "_client", motor_client_session)
    monkeypatch.setattr(db_module, "get_db", lambda: test_db)
    monkeypatch.setattr(redis_module, "_redis", fake_redis_session)
    monkeypatch.setattr(redis_module, "get_redis", lambda: fake_redis_session)

    from app.main import app

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture()
async def auth_headers(client):
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "testpassword",
            "full_name": "Test User",
            "workspace_name": "Test Workspace",
        },
    )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "testpassword"},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
