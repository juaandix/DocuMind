# DocuMind — Project Conventions (v2.0)

## Project Structure

```
DocuMind/
├── backend/                FastAPI + Python 3.12
├── notification-service/   Node.js 22 + Express (microservicio de notificaciones)
├── frontend/               Vue.js 3 + TypeScript (app principal)
├── admin-panel/            Angular 17 + NgRx (panel de administración)
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

### Admin Endpoints
- Prefix: `/api/v1/admin/platform/*`
- Role: `UserRole.PLATFORM_ADMIN` (separate from workspace `ADMIN`)
- Use `Depends(require_platform_admin)` from `app.core.dependencies`

### Redis Notification Events
Celery workers publish to channel `"notifications"` (consumed by Node.js service).  
WebSocket broadcasts go to `f"workspace:{workspace_id}"`.  
Event schema: `{ type, workspace_id, user_id, userEmail, userName, metadata, title, body }`

## Notification Service (Node.js)

### Stack
- **Express 4** — REST API on port 3001
- **ioredis** — subscribes to `"notifications"` Redis channel from FastAPI
- **Bull** — internal queue with retries + exponential backoff
- **Nodemailer + Handlebars** — email sending with HTML templates
- **Mongoose** — MongoDB access (`notifications` collection)
- **Winston** — structured logging

### Patterns
- Config validated at startup via Joi (`src/config/index.js`)
- JWT auth shares the same `JWT_SECRET` as FastAPI backend
- Bull processes jobs in `src/workers/notification.worker.js`
- Templates in `src/templates/*.hbs`, layout in `src/templates/layouts/base.hbs`

### File layout
```
notification-service/src/
├── index.js           Express app entry point
├── config/            Joi-validated env config
├── models/            Mongoose schemas
├── routes/            Express routers
├── services/          email, queue, notification business logic
├── subscribers/       ioredis Redis subscriber
├── workers/           Bull job processors
└── templates/         Handlebars email templates
```

## Admin Panel (Angular 17)

### Stack
- **Angular 17 Standalone Components** — no NgModule
- **NgRx** — store/effects/selectors in `src/app/store/`
- **Angular Material** — UI components
- **Chart.js + ng2-charts** — dashboard metrics
- **Cypress** — E2E tests

### Patterns
- `app.config.ts` uses `provideRouter`, `provideHttpClient(withInterceptors([...]))`, `provideStore`, `provideEffects`
- Auth interceptor adds JWT Bearer to all requests
- Error interceptor calls `auth.logout()` on 401
- `authGuard` checks `AuthService.isLoggedIn()` before activating routes
- All feature components use `standalone: true`
- Lazy loading via `loadComponent` in routes

### File layout
```
admin-panel/src/app/
├── app.config.ts      ApplicationConfig (providers)
├── app.routes.ts      Routes with lazy loading
├── core/              guards, interceptors, services
├── store/             NgRx slices (workspaces, ...)
├── features/          Standalone components per feature
└── shared/            Models (TypeScript interfaces), shared components
```

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
cp notification-service/.env.example notification-service/.env

# Start all services
docker compose up -d

# Individual services (no Docker)
cd backend && uv sync && uv run uvicorn app.main:app --reload
cd notification-service && npm install && npm run dev
cd frontend && npm install && npm run dev
cd admin-panel && npm install && npm start
```

URLs:
- API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Frontend: http://localhost:5173
- Admin Panel: http://localhost:4200
- Notification Service: http://localhost:3001
- MinIO: http://localhost:9001

## Testing

```bash
# Backend
cd backend && uv run pytest tests/ -v

# Notification Service
cd notification-service && npm test

# Frontend
cd frontend && npm run test
cd frontend && npm run type-check

# Admin Panel
cd admin-panel && npm run test:ci
cd admin-panel && npm run e2e
```

## Important Constraints
- Document processing is always async via Celery — never block HTTP endpoints
- Redis pub/sub is the broadcast bus for WebSockets (supports multi-worker)
- MongoDB Vector Search requires Atlas M10+ or local Atlas CLI for development
- Never store raw passwords — always use `hash_password()` from `core/security.py`
