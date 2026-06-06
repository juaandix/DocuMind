# DocuMind — Project Conventions

## Project Structure

```
DocuMind/
├── backend/       FastAPI + Python 3.12
├── frontend/      Vue.js 3 + TypeScript
├── docker-compose.yml
└── .github/workflows/
```

## Backend

### Stack
- **FastAPI** with async/await throughout
- **Motor** (async MongoDB driver) — never use PyMongo directly
- **Redis** via `redis.asyncio` — get client via `app.redis_client.get_redis()`
- **Celery** for background tasks (document processing, PDF export)
- **LangChain** for RAG pipeline
- **Pydantic v2** for all models

### Patterns
- All DB access goes through `app.database.get_db()` — never create a new client per request
- Multi-tenant: **always filter by `workspace_id`** in every DB query
- Auth: JWT Bearer tokens. Use `Depends(get_current_user)` for protected routes
- Role checks: use `Depends(require_role(UserRole.OWNER, UserRole.ADMIN))`
- ObjectId handling: convert `_id` → `id` (str) before returning to client
- Celery tasks use `asyncio.run()` to call async helpers

### File layout
```
app/
├── main.py          FastAPI app + lifespan
├── config.py        Settings (pydantic-settings, reads .env)
├── database.py      Motor client
├── redis_client.py  Redis client
├── api/v1/          REST routers
├── api/websocket.py WebSocket endpoint
├── models/          Pydantic models (InDB + Public + Request)
├── services/        Business logic (ai_service, storage_service)
├── workers/         Celery tasks
└── core/            security, dependencies, exceptions
```

### LLM Provider
Configured via `LLM_PROVIDER` env var (`openai` or `anthropic`). Code must support both.
- OpenAI: `ChatOpenAI`, `OpenAIEmbeddings`
- Anthropic: `ChatAnthropic`, `VoyageEmbeddings`

## Frontend

### Stack
- **Vue.js 3** — always use Composition API (`<script setup>`)
- **TypeScript** — strict mode, no `any`
- **Pinia** stores in `src/stores/*.store.ts`
- **TanStack Query** for server state, Pinia for app state
- **Tailwind CSS v4** — utility classes only
- **Vue Router 4** — route guards in `src/router/index.ts`

### Patterns
- Types in `src/types/` — match backend models exactly
- HTTP calls only through `src/services/*.service.ts`
- `api.ts` has Axios instance with JWT interceptor + auto-refresh
- WebSocket managed in `rooms.store.ts` — reconnects automatically

### Naming
- Views: `*View.vue` in `src/views/`
- Components: PascalCase, grouped by feature in `src/components/`
- Stores: `use*Store` function name, file `*.store.ts`

## Running Locally

```bash
# Copy env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start infrastructure + app
docker compose up -d

# Backend only (no Docker)
cd backend && uv sync && uv run uvicorn app.main:app --reload

# Frontend only (no Docker)
cd frontend && npm install && npm run dev
```

URLs:
- API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Frontend: http://localhost:5173
- MinIO: http://localhost:9001

## Testing

```bash
# Backend
cd backend && uv run pytest tests/ -v

# Frontend
cd frontend && npm run test
cd frontend && npm run type-check
```

## Important Constraints
- Document processing is always async via Celery — never block HTTP endpoints
- Redis pub/sub is the broadcast bus for WebSockets (supports multi-worker)
- MongoDB Vector Search requires Atlas M10+ or local Atlas CLI for development
- Never store raw passwords — always use `hash_password()` from `core/security.py`
