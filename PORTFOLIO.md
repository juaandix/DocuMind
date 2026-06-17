# DocuMind — Portfolio Brief

> Plataforma SaaS de análisis de documentos con IA. Los usuarios suben documentos, los interrogan mediante chat con RAG y colaboran en tiempo real dentro de un workspace multi-tenant.

---

## Descripción del proyecto

DocuMind es una aplicación full-stack de producción construida de cero que demuestra la integración de varios sistemas complejos: un pipeline RAG con LangChain, chat en tiempo real por WebSockets, arquitectura de microservicios, multi-tenancy y un panel de administración independiente.

El proyecto está orientado a equipos de trabajo: cada empresa tiene su propio workspace aislado, puede subir documentos internos y hacer preguntas sobre ellos en salas de chat colaborativas donde las respuestas citan las fuentes exactas.

---

## Stack tecnológico

### Backend principal — Python / FastAPI
- **FastAPI** con async/await en todos los endpoints
- **LangChain** — pipeline RAG completo: chunking, embeddings, `$vectorSearch` sobre MongoDB Atlas
- **Motor** — driver async de MongoDB; Motor es a PyMongo lo que asyncpg es a psycopg2
- **Celery + Redis** — procesamiento de documentos y exportación de PDFs en background, desacoplados del HTTP request
- **Redis pub/sub** — bus de eventos entre servicios; FastAPI publica, Node.js consume, sin acoplamiento HTTP directo
- **JWT** — autenticación con access + refresh tokens, roles por workspace (OWNER / ADMIN / MEMBER) y rol de plataforma (PLATFORM_ADMIN)

### Microservicio de notificaciones — Node.js / Express
- **Bull** — queue de jobs con reintentos y backoff exponencial
- **Nodemailer + Handlebars** — emails HTML de invitación con templates
- **ioredis** — subscriptor del canal `"notifications"` publicado por Celery
- **Mongoose** — historial de notificaciones en MongoDB

### Frontend — Vue.js 3 / TypeScript
- **Composition API** (`<script setup>`) en todos los componentes
- **Pinia** — estado de la aplicación (auth, documentos, rooms, notificaciones)
- **TanStack Query** — estado de servidor con caché y revalidación
- **WebSocket nativo** — chat en tiempo real con reconexión automática y streaming token a token
- **Tailwind CSS v4** — UI estilo macOS (sin librerías de componentes)

### Panel de administración — Angular 17
- **Standalone Components** — sin NgModule
- **NgRx** — store / effects / selectors para estado global
- **Angular Material** — componentes UI
- **Chart.js + ng2-charts** — dashboard con métricas en tiempo real (documentos, usuarios, actividad 7 días)

### Infraestructura
- **MongoDB Atlas** con `$vectorSearch` para búsqueda semántica
- **Redis** — broker de Celery + pub/sub de WebSockets + cola de Bull
- **MinIO / AWS S3** — almacenamiento de documentos (proveedor configurable)
- **Docker Compose** — todos los servicios orquestados con healthchecks y `depends_on: condition: service_healthy`
- **Railway** — deploy del backend + worker Celery
- **Vercel** — deploy del frontend y admin panel

---

## Funcionalidades implementadas

### Autenticación y workspaces
- Registro → crea usuario + workspace en una transacción
- Login con JWT (access 60 min + refresh 30 días) y renovación automática en el cliente
- Invitación de miembros por token de un solo uso (7 días de validez)
- Gestión de roles: cambio de MEMBER ↔ ADMIN, eliminación de miembros
- Vista de perfil con cambio de nombre y contraseña

### Documentos
- Subida con drag & drop y barra de progreso real (Axios `onUploadProgress`)
- Procesamiento async via Celery: extracción de texto, chunking, embeddings → MongoDB Atlas
- Polling de estado (UPLOADING → PROCESSING → READY / ERROR)
- Filtro por estado y por etiquetas (tag cloud)
- Auto-refresh cada 5 s mientras hay documentos procesando
- Detalle de documento: metadatos, etiquetas editables, chunks procesados

### Chat RAG
- Creación de salas de chat asociadas a documentos seleccionados
- Pipeline RAG: embedding de la pregunta → `$vectorSearch` → contexto → LLM
- Respuesta en streaming token a token por WebSocket
- Fuentes citadas: cada respuesta muestra los fragmentos de documento relevantes con su score de similitud
- Historial de mensajes persistente en MongoDB
- Renombrado de sala y edición de documentos asociados en tiempo real

### Exportación
- Exportar conversación a PDF con Celery: texto formateado, paginación automática, upload a S3/MinIO
- Historial de exportaciones descargable

### Notificaciones
- Centro de notificaciones en el frontend con badge de no leídas
- Emails HTML de invitación (Nodemailer)
- Eventos en tiempo real por Redis pub/sub: FastAPI publica → Node.js consume → WebSocket broadcast

### Panel de administración (Angular)
- Métricas globales de la plataforma: usuarios, workspaces, documentos, mensajes
- Gráfico de actividad de los últimos 7 días (bar chart + doughnut de distribución)
- Listado de usuarios con última conexión y rol
- Logs de auditoría con filtro por estado HTTP
- Acceso restringido a PLATFORM_ADMIN con guard Angular

---

## Arquitectura

```
┌─────────────┐     HTTP/WS      ┌──────────────────────────────┐
│  Vue.js 3   │ ←──────────────► │  FastAPI  :8000              │
│  (Vercel)   │                  │  - REST API (auth, docs,      │
└─────────────┘                  │    rooms, workspace, admin)   │
                                 │  - WebSocket /ws/room/:id     │
┌─────────────┐     HTTP         │  - WebSocket /ws/workspace    │
│ Angular 17  │ ◄──────────────► └──────┬───────────┬───────────┘
│  (Vercel)   │                         │           │
└─────────────┘                    Redis pub/sub    Motor (async)
                                         │           │
                                  ┌──────▼──────┐  ┌▼──────────┐
                                  │  Node.js    │  │  MongoDB  │
                                  │  :3001      │  │  Atlas    │
                                  │  Bull queue │  │  + Vector │
                                  │  Nodemailer │  │  Search   │
                                  └─────────────┘  └───────────┘
                                         │
                                  ┌──────▼──────┐
                                  │   Celery    │
                                  │   Worker    │
                                  │  (Railway)  │
                                  └─────────────┘
```

**Decisiones de diseño relevantes:**
- FastAPI y Node.js se comunican exclusivamente por Redis pub/sub, nunca por HTTP directo — permite escalar cada servicio independientemente
- Los WebSockets se coordinan a través de Redis para soportar múltiples workers de FastAPI sin pérdida de mensajes
- El procesamiento de documentos nunca bloquea un endpoint HTTP — siempre pasa por Celery
- Multi-tenancy: todo query a MongoDB filtra por `workspace_id` — los datos de un workspace son inaccesibles desde otro

---

## Métricas del proyecto

| Métrica | Valor |
|---|---|
| Líneas de código fuente | ~8.000 |
| Endpoints REST | 43 |
| Vistas (Vue.js) | 14 |
| Tests backend (Pytest) | 37 |
| Tests frontend (Vitest) | 10 |
| Servicios Docker | 8 |
| Tiempo de desarrollo | ~3 semanas |

---

## Puntos técnicos destacables para entrevistas

**"¿Por qué microservicio Node.js si el backend ya es FastAPI?"**
El servicio de notificaciones tiene un ciclo de vida diferente: consume eventos de Redis de forma permanente, gestiona colas de reintentos con Bull y envía emails. Mezclarlo en FastAPI habría acoplado la lógica de dominio con la infraestructura de emails. El contrato entre servicios es el schema del evento Redis, no una interfaz de código.

**"¿Cómo funciona el RAG?"**
1. Al subir un documento, Celery lo divide en chunks de ~500 tokens con overlap de 50
2. Genera embeddings con OpenAI (`text-embedding-3-small`, 1536 dims) o Voyage AI
3. Los almacena en MongoDB con `$vectorSearch` index
4. Al hacer una pregunta, genera su embedding, busca los K chunks más cercanos por coseno filtrados por `workspace_id` y `document_id`
5. Los inyecta como contexto en el prompt del LLM y hace streaming de la respuesta por WebSocket

**"¿Cómo garantizas el aislamiento multi-tenant?"**
Todos los modelos tienen `workspace_id` y todos los queries filtran por él usando el `workspace_id` del usuario autenticado, extraído del JWT. No hay endpoint que devuelva datos sin ese filtro. Los tests de integración verifican explícitamente que un usuario de un workspace no puede acceder a recursos de otro.

**"¿Por qué Angular para el admin panel y Vue.js para el frontend?"**
Decisión deliberada para el portfolio: demostrar que se puede trabajar con ambos frameworks en el mismo proyecto. En un proyecto real habría sido el mismo stack. El admin panel tiene estado más complejo (métricas, filtros, paginación) donde NgRx aportaba más que Pinia.

---

## Repositorio

- **GitHub:** [github.com/tuusuario/documind](https://github.com/tuusuario/documind)
- **Demo:** pendiente de deploy (Railway + Vercel)
- **Documentación de API:** http://localhost:8000/docs (Swagger autogenerado por FastAPI)

---

## Para ejecutar localmente

```bash
git clone https://github.com/tuusuario/documind
cd documind

cp backend/.env.example backend/.env        # añadir OPENAI_API_KEY
cp frontend/.env.example frontend/.env
cp notification-service/.env.example notification-service/.env

docker compose up -d
```

Abre http://localhost:80 · API docs en http://localhost:8000/docs · Admin en http://localhost:4200
