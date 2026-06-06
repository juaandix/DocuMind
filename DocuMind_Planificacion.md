# DocuMind — AI Document Intelligence Platform
## Documento de Planificación de Proyecto

> **Autor:** Juan David Gil Díaz  
> **Fecha:** Junio 2026  
> **Stack:** Python · FastAPI · Vue.js 3 · MongoDB · Redis · LangChain · WebSockets

---

## Índice

1. [Descripción del Proyecto](#1-descripción-del-proyecto)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Modelo de Datos](#4-modelo-de-datos)
5. [API REST — Endpoints](#5-api-rest--endpoints)
6. [WebSocket — Eventos](#6-websocket--eventos)
7. [Pipeline de IA (RAG)](#7-pipeline-de-ia-rag)
8. [Frontend — Páginas y Componentes](#8-frontend--páginas-y-componentes)
9. [Estructura de Carpetas](#9-estructura-de-carpetas)
10. [Variables de Entorno](#10-variables-de-entorno)
11. [Docker Compose](#11-docker-compose)
12. [CI/CD — GitHub Actions](#12-cicd--github-actions)
13. [Plan de Desarrollo por Fases](#13-plan-de-desarrollo-por-fases)
14. [Testing](#14-testing)
15. [Decisiones Técnicas Destacadas](#15-decisiones-técnicas-destacadas)

---

## 1. Descripción del Proyecto

DocuMind es una plataforma SaaS multi-tenant de análisis de documentos con inteligencia artificial. Los equipos suben documentos (PDFs, CSVs, DOCX), y pueden interrogarlos mediante un asistente de IA con respuestas en streaming y salas de chat colaborativas en tiempo real.

### Problema que resuelve

Los equipos de trabajo acumulan documentación dispersa (contratos, informes, datos de ventas, especificaciones) y pierden tiempo buscando información manualmente. DocuMind centraliza esos documentos y permite consultarlos en lenguaje natural, con la IA respondiendo directamente desde el contenido real de los archivos.

### Casos de uso principales

- Equipo de desarrollo consulta su documentación técnica con IA
- Equipo de ventas interroga informes de ventas en CSV sin escribir queries SQL
- Múltiples usuarios colaboran en la misma sala de chat analizando un PDF en tiempo real
- Gestor exporta el historial de conversaciones como informe en PDF

### Diferenciadores técnicos para el portfolio

| Skill | Ausente en proyectos anteriores |
|---|---|
| Python + FastAPI | Primer proyecto sin Java/Spring Boot |
| LangChain + RAG | Primer proyecto con IA real |
| MongoDB + Vector Search | Primer proyecto con NoSQL |
| Redis pub/sub + WebSockets | Primer proyecto con real-time |
| Celery (workers async) | Primer proyecto con cola de tareas |
| Vue.js 3 + Pinia | Primer proyecto sin React/Next.js |
| Deploy en producción (Railway) | Primer proyecto con CI/CD + cloud real |

---

## 2. Stack Tecnológico

### Backend

| Tecnología | Versión | Rol |
|---|---|---|
| Python | 3.12 | Lenguaje principal |
| FastAPI | 0.115+ | Framework REST + WebSockets |
| Pydantic v2 | 2.x | Validación y serialización de datos |
| Motor | 3.x | Driver async para MongoDB |
| Redis (redis-py async) | 5.x | Cache, pub/sub y broker de Celery |
| Celery | 5.x | Cola de tareas para procesamiento async |
| LangChain | 0.3+ | Orquestación del pipeline de IA |
| LangChain-Community | 0.3+ | Integraciones (MongoDB Vector, loaders) |
| OpenAI / Anthropic SDK | latest | Modelos LLM (configurable por variable de entorno) |
| PyMuPDF (fitz) | 1.x | Extracción de texto de PDFs |
| pandas | 2.x | Procesamiento de CSVs |
| python-docx | 1.x | Procesamiento de DOCX |
| python-jose + passlib | latest | JWT + hashing de contraseñas |
| boto3 | 1.x | Upload a AWS S3 / MinIO |
| Pytest + HTTPX | latest | Tests |
| Ruff | latest | Linter + formatter |

### Frontend

| Tecnología | Versión | Rol |
|---|---|---|
| Vue.js | 3.x (Composition API) | Framework UI |
| TypeScript | 5.x | Tipado estático |
| Pinia | 2.x | Estado global |
| Vue Router | 4.x | Enrutamiento SPA |
| TanStack Query (Vue) | 5.x | Cache de peticiones HTTP |
| Axios | 1.x | Cliente HTTP |
| Vite | 6.x | Bundler y dev server |
| Tailwind CSS | 4.x | Estilos utilitarios |
| shadcn-vue | latest | Componentes UI accesibles |
| Chart.js + vue-chartjs | 4.x | Visualizaciones de datos |
| Vitest + Vue Testing Library | latest | Tests unitarios |
| Playwright | 1.x | Tests E2E |

### Infraestructura

| Tecnología | Rol |
|---|---|
| MongoDB Atlas (o local) | Base de datos documental + Vector Search |
| Redis | Cache + broker Celery + pub/sub real-time |
| MinIO (dev) / AWS S3 (prod) | Almacenamiento de archivos |
| Docker + Docker Compose | Entorno de desarrollo local |
| GitHub Actions | CI/CD pipeline |
| Railway | Deploy de backend + servicios |
| Vercel | Deploy de frontend |

---

## 3. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Navegador (Vue.js 3)                        │
│  Vue Router · Pinia · TanStack Query · Chart.js · Tailwind CSS      │
└──────────────┬──────────────────────────────────┬───────────────────┘
               │ HTTP REST (JWT)                  │ WebSocket
               ▼                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FastAPI Application                               │
│                                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────────┐ │
│  │ Auth Router │  │  Docs Router  │  │    Chat Router (WS)        │ │
│  │  /auth/*    │  │  /documents/* │  │    /ws/room/{room_id}      │ │
│  └─────────────┘  └──────────────┘  └────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Services Layer                             │  │
│  │  AuthService · DocumentService · ChatService · AIService     │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────┬──────────────────┬────────────────────────┬─────────────────┘
       │                  │                        │
       ▼                  ▼                        ▼
┌──────────────┐  ┌───────────────┐  ┌────────────────────────────┐
│   MongoDB    │  │     Redis     │  │      Celery Workers        │
│              │  │               │  │                            │
│  users       │  │  JWT cache    │  │  process_document task     │
│  workspaces  │  │  pub/sub      │  │  generate_embeddings task  │
│  documents   │  │  Celery queue │  │  export_chat_pdf task      │
│  chunks      │  │  rate limit   │  │                            │
│  rooms       │  └───────────────┘  └────────────────────────────┘
│  messages    │           │
└──────────────┘           │
                           ▼
              ┌────────────────────────┐
              │   MinIO / AWS S3       │
              │   (archivos originales)│
              └────────────────────────┘
```

### Flujo de procesamiento de un documento

```
1. Usuario sube archivo  →  FastAPI valida tipo y tamaño
2. Archivo guardado en S3/MinIO  →  Registro creado en MongoDB (status: PROCESSING)
3. Tarea Celery encolada  →  Worker recibe la tarea
4. Worker extrae texto  →  PyMuPDF / pandas / python-docx
5. Texto dividido en chunks  →  LangChain RecursiveCharacterTextSplitter
6. Embeddings generados  →  OpenAI/Anthropic Embeddings API
7. Chunks + embeddings guardados en MongoDB  →  status: READY
8. WebSocket notifica al frontend  →  documento disponible para chat
```

### Flujo de una pregunta en el chat

```
1. Usuario envía mensaje por WebSocket
2. FastAPI publica evento en Redis pub/sub
3. ChatService recupera historial de conversación (últimos N mensajes)
4. AIService ejecuta búsqueda vectorial en MongoDB  →  top-K chunks relevantes
5. LangChain construye el prompt con contexto + historial + pregunta
6. LLM genera respuesta en streaming
7. Cada token se publica en Redis  →  todos los usuarios de la sala reciben el stream
8. Respuesta completa guardada en MongoDB como mensaje
```

---

## 4. Modelo de Datos

### Colección: `users`

```json
{
  "_id": "ObjectId",
  "email": "string (unique)",
  "hashed_password": "string",
  "full_name": "string",
  "workspace_id": "ObjectId (ref: workspaces)",
  "role": "OWNER | ADMIN | MEMBER",
  "avatar_url": "string | null",
  "is_active": "boolean",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Colección: `workspaces`

```json
{
  "_id": "ObjectId",
  "name": "string",
  "slug": "string (unique)",
  "owner_id": "ObjectId (ref: users)",
  "plan": "FREE | PRO",
  "storage_used_bytes": "int",
  "storage_limit_bytes": "int",
  "created_at": "datetime"
}
```

### Colección: `documents`

```json
{
  "_id": "ObjectId",
  "workspace_id": "ObjectId",
  "uploaded_by": "ObjectId (ref: users)",
  "filename": "string",
  "original_name": "string",
  "mime_type": "string",
  "size_bytes": "int",
  "s3_key": "string",
  "status": "UPLOADING | PROCESSING | READY | ERROR",
  "error_message": "string | null",
  "page_count": "int | null",
  "chunk_count": "int | null",
  "tags": ["string"],
  "created_at": "datetime",
  "processed_at": "datetime | null"
}
```

### Colección: `document_chunks`

```json
{
  "_id": "ObjectId",
  "document_id": "ObjectId (ref: documents)",
  "workspace_id": "ObjectId",
  "content": "string",
  "embedding": "[float] (1536 dimensiones)",
  "metadata": {
    "page": "int | null",
    "chunk_index": "int",
    "source": "string"
  }
}
```

> **Índice vectorial:** `db.document_chunks.createIndex({ embedding: "vectorSearch" })` — MongoDB Atlas Vector Search

### Colección: `rooms`

```json
{
  "_id": "ObjectId",
  "workspace_id": "ObjectId",
  "name": "string",
  "document_ids": ["ObjectId"],
  "created_by": "ObjectId",
  "members": ["ObjectId"],
  "is_active": "boolean",
  "created_at": "datetime"
}
```

### Colección: `messages`

```json
{
  "_id": "ObjectId",
  "room_id": "ObjectId (ref: rooms)",
  "workspace_id": "ObjectId",
  "author_id": "ObjectId | null",
  "role": "user | assistant | system",
  "content": "string",
  "sources": [
    {
      "document_id": "ObjectId",
      "document_name": "string",
      "chunk_content": "string",
      "page": "int | null",
      "score": "float"
    }
  ],
  "created_at": "datetime"
}
```

---

## 5. API REST — Endpoints

### Auth — `/api/v1/auth`

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/register` | Registrar usuario + workspace | No |
| POST | `/login` | Login, devuelve access + refresh token | No |
| POST | `/refresh` | Renovar access token | Refresh token |
| POST | `/logout` | Invalidar tokens en Redis | Sí |
| GET | `/me` | Perfil del usuario autenticado | Sí |

### Workspace — `/api/v1/workspace`

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/` | Info del workspace actual | Sí |
| PATCH | `/` | Actualizar nombre/configuración | OWNER/ADMIN |
| GET | `/members` | Listar miembros | Sí |
| POST | `/invite` | Invitar usuario por email | OWNER/ADMIN |
| DELETE | `/members/{user_id}` | Eliminar miembro | OWNER/ADMIN |

### Documents — `/api/v1/documents`

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/` | Listar documentos (paginado, filtros) | Sí |
| POST | `/upload` | Subir documento (multipart/form-data) | Sí |
| GET | `/{doc_id}` | Detalle de un documento | Sí |
| DELETE | `/{doc_id}` | Eliminar documento + chunks | ADMIN+ |
| PATCH | `/{doc_id}/tags` | Actualizar etiquetas | Sí |
| GET | `/{doc_id}/status` | Estado del procesamiento | Sí |

### Rooms — `/api/v1/rooms`

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/` | Listar salas del workspace | Sí |
| POST | `/` | Crear sala nueva | Sí |
| GET | `/{room_id}` | Detalle de sala | Sí |
| PATCH | `/{room_id}` | Actualizar nombre/documentos | ADMIN+ |
| DELETE | `/{room_id}` | Archivar sala | ADMIN+ |
| GET | `/{room_id}/messages` | Historial de mensajes (cursor pagination) | Sí |
| POST | `/{room_id}/export` | Exportar chat a PDF (tarea Celery) | Sí |

### Health — `/api/v1/health`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Estado de la API |
| GET | `/ready` | Readiness (MongoDB + Redis conectados) |

---

## 6. WebSocket — Eventos

**Endpoint de conexión:** `ws://host/ws/room/{room_id}?token={jwt}`

### Eventos Cliente → Servidor

```json
// Enviar mensaje
{ "type": "user_message", "content": "¿Cuál es el margen de beneficio del Q3?" }

// Indicar que está escribiendo
{ "type": "typing_start" }
{ "type": "typing_stop" }
```

### Eventos Servidor → Cliente

```json
// Streaming de respuesta IA (token a token)
{ "type": "ai_stream", "token": "El margen" }
{ "type": "ai_stream", "token": " de beneficio" }
{ "type": "ai_stream_end", "message_id": "abc123", "sources": [...] }

// Nuevo usuario se une
{ "type": "user_joined", "user": { "id": "...", "name": "Ana" } }

// Usuario abandona la sala
{ "type": "user_left", "user_id": "..." }

// Otro usuario está escribiendo
{ "type": "user_typing", "user_id": "...", "name": "Carlos" }

// Documento procesado y disponible
{ "type": "document_ready", "document_id": "...", "name": "Q3_report.pdf" }

// Error del servidor
{ "type": "error", "code": "RATE_LIMIT_EXCEEDED", "message": "..." }
```

---

## 7. Pipeline de IA (RAG)

### Configuración del modelo (variable de entorno `LLM_PROVIDER`)

```python
# Soporta OpenAI y Anthropic, configurable sin cambiar código
LLM_PROVIDER=openai   # gpt-4o-mini por defecto
LLM_PROVIDER=anthropic  # claude-3-haiku por defecto
```

### Document Processing Pipeline (Celery task)

```
archivo S3
    │
    ▼
TextExtractor (según MIME type)
    ├── PDF     →  PyMuPDF → texto por páginas
    ├── CSV     →  pandas  → texto estructurado con cabeceras
    ├── DOCX    →  python-docx → texto con headings
    └── TXT     →  lectura directa
    │
    ▼
RecursiveCharacterTextSplitter
    chunk_size=800, overlap=80
    │
    ▼
EmbeddingModel.embed_documents(chunks)
    └── OpenAI text-embedding-3-small  |  Anthropic (voyage-3)
    │
    ▼
MongoDB bulk insert (document_chunks)
    + Atlas Vector Search index
    │
    ▼
Document status → READY
WebSocket notification → usuarios de la sala
```

### RAG Query Pipeline

```
pregunta usuario
    │
    ▼
EmbeddingModel.embed_query(pregunta)
    │
    ▼
MongoDB Vector Search
    filter: { workspace_id, document_id: { $in: room.document_ids } }
    numCandidates: 100, limit: 5
    │
    ▼
ContextBuilder
    Construye string con chunks relevantes + metadatos de fuente
    │
    ▼
PromptTemplate
    system: "Eres un asistente que responde SOLO basándose en los documentos
             proporcionados. Si la información no está en los documentos, dilo."
    context: {chunks}
    history: {últimos 10 mensajes}
    human: {pregunta}
    │
    ▼
LLM.stream(prompt)
    │ token a token
    ▼
Redis PUBLISH → canal room:{room_id}
    │
    ▼
WebSocket broadcast → todos los clientes de la sala
```

---

## 8. Frontend — Páginas y Componentes

### Rutas (Vue Router)

```
/                           → Redirect a /login o /dashboard
/login                      → Página de login
/register                   → Registro (crea usuario + workspace)

/dashboard                  → Vista principal post-login
/documents                  → Listado de documentos
/documents/upload           → Subida de archivos (drag & drop)
/documents/:id              → Detalle + estado de procesamiento

/rooms                      → Listado de salas de chat
/rooms/:id                  → Sala de chat con IA (vista principal)
/rooms/new                  → Crear sala + seleccionar documentos

/settings/profile           → Perfil del usuario
/settings/workspace         → Configuración del workspace
/settings/members           → Gestión de miembros
```

### Stores (Pinia)

```typescript
// auth.store.ts
interface AuthStore {
  user: User | null
  accessToken: string | null
  login(credentials): Promise<void>
  logout(): Promise<void>
  refreshToken(): Promise<void>
}

// documents.store.ts
interface DocumentsStore {
  documents: Document[]
  uploadProgress: Record<string, number>
  upload(file: File): Promise<Document>
  pollStatus(docId: string): void  // polling hasta READY o ERROR
}

// rooms.store.ts
interface RoomsStore {
  rooms: Room[]
  activeRoom: Room | null
  messages: Message[]
  connectedUsers: User[]
  isAiTyping: boolean
  aiStreamBuffer: string
  connectWebSocket(roomId: string): void
  sendMessage(content: string): void
  disconnect(): void
}

// workspace.store.ts
interface WorkspaceStore {
  workspace: Workspace | null
  members: User[]
  fetchWorkspace(): Promise<void>
  inviteMember(email: string): Promise<void>
}
```

### Componentes principales

```
components/
├── layout/
│   ├── AppSidebar.vue          # Navegación lateral
│   ├── AppHeader.vue           # Header con info de workspace
│   └── PageContainer.vue       # Wrapper de páginas
│
├── documents/
│   ├── DocumentCard.vue        # Tarjeta de documento con status badge
│   ├── DocumentUploader.vue    # Drag & drop con barra de progreso
│   ├── DocumentStatusBadge.vue # PROCESSING (spinner) / READY / ERROR
│   └── DocumentList.vue        # Grid/lista con filtros y búsqueda
│
├── chat/
│   ├── ChatRoom.vue            # Contenedor principal de la sala
│   ├── MessageList.vue         # Lista de mensajes con scroll infinito
│   ├── MessageBubble.vue       # Burbuja user/assistant con fuentes
│   ├── MessageSources.vue      # Fuentes citadas por la IA (collapsable)
│   ├── ChatInput.vue           # Input + botón enviar + indicador typing
│   ├── AiStreamBubble.vue      # Burbuja con efecto de escritura token a token
│   └── OnlineUsers.vue         # Avatares de usuarios conectados
│
├── rooms/
│   ├── RoomCard.vue            # Tarjeta de sala en el listado
│   ├── CreateRoomModal.vue     # Modal: nombre + selección de documentos
│   └── DocumentSelector.vue   # Multi-select de documentos para la sala
│
└── ui/                         # Componentes genéricos (shadcn-vue)
    ├── AppButton.vue
    ├── AppModal.vue
    ├── AppToast.vue
    └── AppSpinner.vue
```

---

## 9. Estructura de Carpetas

```
documind/
│
├── backend/                        # FastAPI application
│   ├── app/
│   │   ├── main.py                 # FastAPI app, lifespan, routers
│   │   ├── config.py               # Settings via pydantic-settings
│   │   ├── database.py             # Motor MongoDB client
│   │   ├── redis_client.py         # Async Redis client
│   │   │
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── auth.py
│   │   │   │   ├── workspace.py
│   │   │   │   ├── documents.py
│   │   │   │   ├── rooms.py
│   │   │   │   └── health.py
│   │   │   └── websocket.py        # WebSocket endpoint + handlers
│   │   │
│   │   ├── models/                 # Pydantic models (request/response)
│   │   │   ├── user.py
│   │   │   ├── document.py
│   │   │   ├── room.py
│   │   │   └── message.py
│   │   │
│   │   ├── services/               # Lógica de negocio
│   │   │   ├── auth_service.py
│   │   │   ├── document_service.py
│   │   │   ├── chat_service.py
│   │   │   ├── ai_service.py       # LangChain RAG pipeline
│   │   │   └── storage_service.py  # S3/MinIO
│   │   │
│   │   ├── workers/                # Celery tasks
│   │   │   ├── celery_app.py
│   │   │   ├── document_processor.py
│   │   │   └── export_worker.py
│   │   │
│   │   └── core/
│   │       ├── security.py         # JWT, password hashing
│   │       ├── dependencies.py     # FastAPI deps (get_current_user, etc.)
│   │       └── exceptions.py       # Custom HTTP exceptions
│   │
│   ├── tests/
│   │   ├── conftest.py             # Fixtures: test DB, test client, users
│   │   ├── test_auth.py
│   │   ├── test_documents.py
│   │   ├── test_rooms.py
│   │   └── test_ai_service.py
│   │
│   ├── Dockerfile
│   ├── pyproject.toml              # dependencias (uv o pip)
│   └── .env.example
│
├── frontend/                       # Vue.js 3 application
│   ├── src/
│   │   ├── main.ts
│   │   ├── App.vue
│   │   ├── router/
│   │   │   └── index.ts
│   │   ├── stores/
│   │   │   ├── auth.store.ts
│   │   │   ├── documents.store.ts
│   │   │   ├── rooms.store.ts
│   │   │   └── workspace.store.ts
│   │   ├── composables/
│   │   │   ├── useWebSocket.ts
│   │   │   ├── useFileUpload.ts
│   │   │   └── useToast.ts
│   │   ├── views/                  # Páginas (una por ruta)
│   │   ├── components/             # Componentes reutilizables
│   │   ├── services/               # Capa HTTP (axios instances)
│   │   │   ├── api.ts              # Axios con interceptors JWT
│   │   │   ├── auth.service.ts
│   │   │   ├── documents.service.ts
│   │   │   └── rooms.service.ts
│   │   └── types/                  # Interfaces TypeScript
│   │       ├── user.ts
│   │       ├── document.ts
│   │       └── room.ts
│   │
│   ├── tests/
│   │   ├── unit/
│   │   └── e2e/
│   │
│   ├── Dockerfile
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
│
├── docker-compose.yml              # Dev: MongoDB + Redis + MinIO + backend + worker + frontend
├── docker-compose.prod.yml         # Prod: sin MinIO (usa S3 real)
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Tests en cada PR
│       └── deploy.yml              # Deploy a Railway + Vercel en merge a main
└── README.md
```

---

## 10. Variables de Entorno

### `backend/.env.example`

```bash
# App
APP_NAME=DocuMind
APP_ENV=development
SECRET_KEY=your-super-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30

# MongoDB
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=documind

# Redis
REDIS_URL=redis://localhost:6379/0

# Celery
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2

# Storage (MinIO para dev, S3 para prod)
STORAGE_PROVIDER=minio
S3_ENDPOINT_URL=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET_NAME=documind

# LLM (openai | anthropic)
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Modelo configurable
LLM_MODEL=gpt-4o-mini
EMBEDDING_MODEL=text-embedding-3-small

# CORS
ALLOWED_ORIGINS=http://localhost:5173
```

### `frontend/.env.example`

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
VITE_APP_NAME=DocuMind
```

---

## 11. Docker Compose

### `docker-compose.yml` (desarrollo)

```yaml
services:
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: documind

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file: ./backend/.env
    depends_on:
      - mongodb
      - redis
      - minio
    volumes:
      - ./backend:/app
    command: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

  worker:
    build: ./backend
    env_file: ./backend/.env
    depends_on:
      - mongodb
      - redis
      - minio
    volumes:
      - ./backend:/app
    command: celery -A app.workers.celery_app worker --loglevel=info

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    env_file: ./frontend/.env
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  mongo_data:
  minio_data:
```

**Comando de inicio:**
```bash
docker compose up -d
# API disponible en  http://localhost:8000
# Docs Swagger en   http://localhost:8000/docs
# Frontend en       http://localhost:5173
# MinIO console en  http://localhost:9001
```

---

## 12. CI/CD — GitHub Actions

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:7
        ports: ["27017:27017"]
      redis:
        image: redis:7-alpine
        ports: ["6379:6379"]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install uv && uv sync
        working-directory: backend
      - run: uv run ruff check .
        working-directory: backend
      - run: uv run pytest tests/ -v --cov=app
        working-directory: backend
        env:
          MONGODB_URL: mongodb://localhost:27017
          REDIS_URL: redis://localhost:6379/0
          SECRET_KEY: test-secret
          LLM_PROVIDER: openai
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "22" }
      - run: npm ci && npm run type-check && npm run test
        working-directory: frontend

  e2e:
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-tests]
    steps:
      - uses: actions/checkout@v4
      - run: docker compose up -d
      - run: npm ci && npx playwright install --with-deps
        working-directory: frontend
      - run: npx playwright test
        working-directory: frontend
      - run: docker compose down
```

### `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: railwayapp/railway-deploy@v1
        with:
          service: documind-backend
          railway-token: ${{ secrets.RAILWAY_TOKEN }}

  deploy-worker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: railwayapp/railway-deploy@v1
        with:
          service: documind-worker
          railway-token: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: --prod
          working-directory: frontend
```

---

## 13. Plan de Desarrollo por Fases

### Fase 0 — Setup (2-3 días)

- [ ] Crear repositorio en GitHub (`documind`)
- [ ] Inicializar backend: `fastapi`, `motor`, `redis-py`, `celery`, `langchain`
- [ ] Inicializar frontend: `npm create vue@latest` con TypeScript
- [ ] Configurar `docker-compose.yml` con MongoDB + Redis + MinIO
- [ ] Configurar `ruff` (linter Python) y ESLint/Prettier (frontend)
- [ ] Crear `CLAUDE.md` con convenciones del proyecto

### Fase 1 — Auth y Multi-Tenant (4-5 días)

- [ ] Modelo `User` + `Workspace` en MongoDB con Motor
- [ ] Endpoints `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`
- [ ] JWT con access token (60min) + refresh token (30 días) en cookie HttpOnly
- [ ] Middleware de autenticación FastAPI (dependency injection)
- [ ] RBAC: decorador `require_role(roles=[...])`
- [ ] Página de login y registro en Vue.js
- [ ] Auth store (Pinia) con interceptor Axios para refresh automático
- [ ] Guard de rutas en Vue Router
- [ ] Tests: `test_auth.py` (register, login, token refresh, unauthorized)

### Fase 2 — Gestión de Documentos (5-6 días)

- [ ] Modelo `Document` en MongoDB
- [ ] Endpoint `POST /documents/upload` — multipart, validación de tipo y tamaño
- [ ] `StorageService` — subida a MinIO/S3 con presigned URLs
- [ ] Tarea Celery `process_document`:
  - Extracción de texto (PyMuPDF, pandas, python-docx)
  - Chunking con LangChain
  - Generación de embeddings
  - Guardado de `DocumentChunk` en MongoDB
  - Actualización de status a READY / ERROR
- [ ] Página de documentos con DocumentList y DocumentCard
- [ ] DocumentUploader con drag & drop y barra de progreso
- [ ] DocumentStatusBadge con polling hasta READY
- [ ] Tests: `test_documents.py` (upload, status polling, delete)

### Fase 3 — Salas y WebSocket (4-5 días)

- [ ] Modelo `Room` + `Message` en MongoDB
- [ ] CRUD de salas (endpoints REST)
- [ ] WebSocket endpoint `/ws/room/{room_id}`
- [ ] Connection manager con Redis pub/sub (soporte multi-instancia)
- [ ] Eventos: `user_joined`, `user_left`, `user_typing`
- [ ] ChatRoom.vue con MessageList, ChatInput, OnlineUsers
- [ ] WebSocket composable (`useWebSocket.ts`) con reconexión automática
- [ ] Tests: `test_rooms.py` (CRUD, websocket connect, broadcast)

### Fase 4 — RAG Pipeline y Chat con IA (6-7 días)

- [ ] Configurar MongoDB Atlas Vector Search index en `document_chunks`
- [ ] `AIService.similarity_search(query, document_ids, top_k=5)`
- [ ] `AIService.stream_answer(question, context, history)` → async generator
- [ ] Integración LangChain: PromptTemplate + LLM streaming
- [ ] Broadcast de tokens por WebSocket (Redis pub/sub)
- [ ] `AiStreamBubble.vue` con efecto de escritura progresiva
- [ ] `MessageSources.vue` — citas de documentos collapsables
- [ ] Soporte dual OpenAI / Anthropic (configurable por env)
- [ ] Tests: `test_ai_service.py` (mock LLM, similarity search, streaming)

### Fase 5 — Funcionalidades Avanzadas (4-5 días)

- [ ] Exportar chat a PDF (tarea Celery + ReportLab/WeasyPrint)
- [ ] Scroll infinito en MessageList (cursor pagination)
- [ ] Sistema de invitaciones por email (SendGrid/Resend)
- [ ] Gestión de miembros del workspace
- [ ] Rate limiting por usuario (Redis + slowapi)
- [ ] Visualizaciones de CSV: tabla interactiva + gráfico básico (Chart.js)
- [ ] Tags en documentos + filtro por tag

### Fase 6 — Testing, Polish y Deploy (4-5 días)

- [ ] Tests E2E con Playwright: flujo completo (register → upload → chat)
- [ ] Cobertura de tests backend ≥ 80%
- [ ] Variables de entorno de producción en Railway y Vercel
- [ ] MongoDB Atlas en la nube (tier gratuito M0)
- [ ] Redis en Railway (o Upstash)
- [ ] S3 en AWS (tier gratuito) o Cloudflare R2
- [ ] GitHub Actions CI/CD funcionando
- [ ] README.md con arquitectura, setup local y demo GIF

**Duración total estimada: 4-6 semanas a ritmo de proyecto personal**

---

## 14. Testing

### Backend (Pytest)

```
tests/
├── conftest.py
│   ├── @pytest.fixture: mongo_client (usa mongomock o MongoDB de test)
│   ├── @pytest.fixture: redis_client (fakeredis)
│   ├── @pytest.fixture: client (AsyncClient de HTTPX)
│   ├── @pytest.fixture: auth_headers (usuario de test autenticado)
│   └── @pytest.fixture: workspace (workspace de test)
│
├── test_auth.py
│   ├── test_register_success
│   ├── test_register_duplicate_email
│   ├── test_login_success
│   ├── test_login_wrong_password
│   ├── test_refresh_token
│   └── test_protected_route_unauthorized
│
├── test_documents.py
│   ├── test_upload_pdf
│   ├── test_upload_invalid_mime_type
│   ├── test_upload_exceeds_size_limit
│   ├── test_get_document_status
│   └── test_delete_document
│
├── test_rooms.py
│   ├── test_create_room
│   ├── test_add_document_to_room
│   ├── test_websocket_connect
│   └── test_websocket_message_broadcast
│
└── test_ai_service.py
    ├── test_similarity_search (mock embeddings)
    ├── test_stream_answer (mock LLM)
    └── test_prompt_construction
```

### Frontend (Vitest + Playwright)

```
tests/
├── unit/
│   ├── stores/auth.store.test.ts
│   ├── stores/rooms.store.test.ts
│   ├── components/DocumentStatusBadge.test.ts
│   └── composables/useWebSocket.test.ts
│
└── e2e/
    ├── auth.spec.ts        # Registro + Login
    ├── documents.spec.ts   # Upload + estado procesamiento
    └── chat.spec.ts        # Enviar mensaje + recibir respuesta IA
```

---

## 15. Decisiones Técnicas Destacadas

### Motor (async MongoDB driver) en lugar de PyMongo

FastAPI es 100% async. Motor es el driver oficial de MongoDB para asyncio — permite hacer `await db.users.find_one(...)` sin bloquear el event loop. PyMongo bloqueante en una app FastAPI causa cuellos de botella bajo carga concurrente.

### Celery para procesamiento de documentos

El procesamiento (extracción de texto + embeddings) puede tardar de 5 a 30 segundos según el tamaño del documento. Hacerlo en el endpoint HTTP bloquearía la respuesta y agotaría los timeouts del cliente. Celery desacopla el trabajo: el endpoint responde inmediatamente con `status: PROCESSING`, y el worker notifica via WebSocket cuando termina.

### Redis pub/sub para WebSockets multi-instancia

En producción, FastAPI corre con múltiples workers (Gunicorn + Uvicorn). Si el usuario A está conectado al worker 1 y el usuario B al worker 2, un broadcast directo en memoria no funcionaría. Redis pub/sub actúa como bus de mensajes compartido: cualquier worker publica en el canal `room:{room_id}`, y todos los workers suscritos envían el mensaje a sus conexiones locales.

### MongoDB Vector Search para RAG

En lugar de una base de datos vectorial separada (Pinecone, Weaviate, Chroma), se usa MongoDB Atlas Vector Search. Esto evita un servicio adicional, permite filtrar por `workspace_id` y `document_id` en la misma query vectorial (crucial para el aislamiento multi-tenant), y simplifica el stack manteniendo todo en una sola base de datos.

### Pinia en lugar de Vuex

Vuex es la tienda de estado clásica de Vue 2/3, pero Pinia es el estándar oficial desde Vue 3. Tiene tipado TypeScript nativo, API más simple basada en Composition API, DevTools integradas y soporte de SSR. No hay razón técnica para usar Vuex en un proyecto nuevo con Vue 3.

### Cursor pagination en mensajes

La paginación por offset (`LIMIT 20 OFFSET 100`) es problemática en chats: si llegan mensajes nuevos mientras el usuario hace scroll, los offsets se desplazan y se pierden o duplican mensajes. La paginación por cursor (`mensajes anteriores al _id X`) es estable: el cursor apunta a un documento concreto, no a una posición numérica.

---

*Documento generado el 2026-06-06 — Juan David Gil Díaz*
