from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import websocket
from app.api.v1 import admin, auth, documents, health, rooms, workspace
from app.config import settings
from app.database import close_db, init_indexes
from app.redis_client import close_redis


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_indexes()
    yield
    await close_db()
    await close_redis()


app = FastAPI(
    title="DocuMind API",
    version="0.1.0",
    description="AI Document Intelligence Platform",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api/v1"
app.include_router(health.router, prefix=API_PREFIX)
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(workspace.router, prefix=API_PREFIX)
app.include_router(documents.router, prefix=API_PREFIX)
app.include_router(rooms.router, prefix=API_PREFIX)
app.include_router(admin.router, prefix=API_PREFIX)
app.include_router(websocket.router)
