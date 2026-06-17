# DocuMind — Guía de Despliegue

Pasos para pasar de desarrollo local a producción completamente funcional.

---

## Índice

1. [OpenAI / Anthropic (LLM)](#1-openai--anthropic-llm)
2. [MongoDB Atlas (Vector Search)](#2-mongodb-atlas-vector-search)
3. [Gmail SMTP (Emails)](#3-gmail-smtp-emails)
4. [MinIO / AWS S3 (Storage)](#4-minio--aws-s3-storage)
5. [Railway (Backend)](#5-railway-backend)
6. [Vercel (Frontend)](#6-vercel-frontend)
7. [Activar CI/CD](#7-activar-cicd)
8. [Admin Panel](#8-admin-panel)
9. [Variables de entorno completas](#9-variables-de-entorno-completas)

---

## 1. OpenAI / Anthropic (LLM)

El chat RAG necesita un modelo de lenguaje para generar respuestas y embeddings para la búsqueda semántica.

### Opción A — OpenAI (recomendado)

1. Crea una cuenta en https://platform.openai.com
2. Ve a **API Keys** → **Create new secret key**
3. Copia la key (solo se muestra una vez)
4. Añade crédito en **Billing** (mínimo $5 para empezar)

Modelos usados por DocuMind:
- `gpt-4o-mini` — generación de respuestas (~$0.15 / millón de tokens)
- `text-embedding-3-small` — embeddings (~$0.02 / millón de tokens)

Edita `backend/.env`:
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-...
LLM_MODEL=gpt-4o-mini
EMBEDDING_MODEL=text-embedding-3-small
```

### Opción B — Anthropic

1. Crea cuenta en https://console.anthropic.com
2. Ve a **API Keys** → **Create Key**
3. Para embeddings se usa Voyage AI (incluido en la key de Anthropic)

Edita `backend/.env`:
```env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
LLM_MODEL=claude-haiku-4-5-20251001
EMBEDDING_MODEL=voyage-3
```

---

## 2. MongoDB Atlas (Vector Search)

MongoDB local no soporta `$vectorSearch`. Se necesita un cluster Atlas M10 o superior.

### Crear el cluster

1. Crea cuenta en https://cloud.mongodb.com
2. **Create a deployment** → elige **M10** (mínimo para vector search, ~$57/mes)
   - Para pruebas puedes usar **M0 gratuito** pero sin vector search (el chat no encontrará contexto)
3. En **Security** → **Database Access** → crea un usuario con contraseña
4. En **Security** → **Network Access** → añade `0.0.0.0/0` (permite cualquier IP) o la IP de tu servidor
5. En **Databases** → **Connect** → copia la connection string:
   ```
   mongodb+srv://usuario:contraseña@cluster0.xxxxx.mongodb.net
   ```

Edita `backend/.env`:
```env
MONGODB_URL=mongodb+srv://usuario:contraseña@cluster0.xxxxx.mongodb.net
MONGODB_DB_NAME=documind
```

### Crear el índice vectorial

Esto es lo más importante — sin este índice el RAG no funciona aunque tengas la clave de OpenAI.

1. En Atlas, ve a tu cluster → **Atlas Search** → **Create Search Index**
2. Selecciona **Vector Search** (no "Search")
3. Base de datos: `documind`, Colección: `document_chunks`
4. Pega esta configuración JSON:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "workspace_id"
    },
    {
      "type": "filter",
      "path": "document_id"
    }
  ]
}
```

> **Nombre del índice:** `vector_index` (exactamente así, el código lo busca por este nombre)

5. Haz clic en **Create Search Index** y espera ~2 minutos a que aparezca como `Active`

> **Nota:** Si usas Anthropic en lugar de OpenAI, cambia `numDimensions` a `1024` (dimensiones de Voyage embeddings)

---

## 3. Gmail SMTP (Emails)

Permite que el notification service envíe emails de invitación y notificaciones.

1. Ve a tu cuenta de Google → **Seguridad**
2. Activa **Verificación en dos pasos** (obligatorio para el siguiente paso)
3. Ve a **Seguridad** → busca **Contraseñas de aplicaciones**
4. Selecciona "Otra (nombre personalizado)" → escribe `DocuMind` → **Generar**
5. Copia la contraseña de 16 caracteres que aparece (con espacios: `xxxx xxxx xxxx xxxx`)

Edita `notification-service/.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tuemail@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
FROM_EMAIL=tuemail@gmail.com
FROM_NAME=DocuMind
```

### Alternativa — SendGrid (más robusto para producción)

1. Crea cuenta en https://sendgrid.com (100 emails/día gratis)
2. Ve a **Settings** → **API Keys** → **Create API Key**
3. Selecciona **Restricted Access** → activa **Mail Send**

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxx
FROM_EMAIL=noreply@tudominio.com
FROM_NAME=DocuMind
```

---

## 4. MinIO / AWS S3 (Storage)

Para almacenar documentos y PDFs exportados en producción.

### Opción A — MinIO propio (gratuito, recomendado para empezar)

Añade MinIO a tu `docker-compose.yml` (ya está incluido). Solo asegúrate de tener estas variables:

```env
STORAGE_PROVIDER=minio
S3_ENDPOINT_URL=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET_NAME=documind
```

Para acceder a la consola web de MinIO: http://localhost:9001

### Opción B — AWS S3

1. Crea cuenta en https://aws.amazon.com
2. Ve a **S3** → **Create bucket** → nombre: `documind-prod` → región: la más cercana
3. En **IAM** → **Users** → crea un usuario con política `AmazonS3FullAccess`
4. Crea **Access Key** para ese usuario

```env
STORAGE_PROVIDER=s3
S3_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
S3_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
S3_BUCKET_NAME=documind-prod
```

> Elimina `S3_ENDPOINT_URL` del `.env` cuando uses AWS S3 real

---

## 5. Railway (Backend)

Railway despliega el backend FastAPI con un comando.

### Preparación

1. Crea cuenta en https://railway.app (conecta con GitHub)
2. Haz clic en **New Project** → **Deploy from GitHub repo**
3. Selecciona el repositorio `DocuMind`
4. En **Root Directory** escribe: `backend`
5. Railway detecta Python y usa el `Procfile` o `pyproject.toml` automáticamente

Si no detecta el comando de inicio, añade un archivo `backend/Procfile`:
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Variables de entorno en Railway

En tu servicio → **Variables** → añade todas las variables de `backend/.env` con los valores de producción.

Las más importantes:
```
APP_ENV=production
MONGODB_URL=mongodb+srv://...
REDIS_URL=redis://...          # Railway ofrece Redis como plugin
SECRET_KEY=genera-uno-nuevo    # python -c "import secrets; print(secrets.token_hex(32))"
OPENAI_API_KEY=sk-...
STORAGE_PROVIDER=s3            # o minio
ALLOWED_ORIGINS=["https://tu-frontend.vercel.app"]
```

### Redis en Railway

1. En tu proyecto Railway → **Add Service** → **Database** → **Redis**
2. Railway genera automáticamente `REDIS_URL` — cópiala en las variables del backend:
   ```
   REDIS_URL=redis://default:xxxx@roundhouse.proxy.rlwy.net:xxxxx
   CELERY_BROKER_URL=redis://default:xxxx@roundhouse.proxy.rlwy.net:xxxxx/1
   CELERY_RESULT_BACKEND=redis://default:xxxx@roundhouse.proxy.rlwy.net:xxxxx/2
   ```

### Celery worker en Railway

El backend y el worker de Celery son procesos separados. Añade un segundo servicio:

1. **Add Service** → **GitHub Repo** → mismo repo, mismo `Root Directory: backend`
2. Cambia el comando de inicio a:
   ```
   celery -A app.workers.celery_app worker --loglevel=info
   ```
3. Comparte las mismas variables de entorno

### URL del backend

Una vez desplegado, Railway te da una URL como:
```
https://documind-backend-production.up.railway.app
```

Guárdala, la necesitarás para el frontend.

---

## 6. Vercel (Frontend)

1. Crea cuenta en https://vercel.com (conecta con GitHub)
2. **Add New Project** → selecciona el repo `DocuMind`
3. Configuración:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

4. En **Environment Variables** añade:
```
VITE_API_BASE_URL=https://documind-backend-production.up.railway.app
VITE_WS_BASE_URL=wss://documind-backend-production.up.railway.app
```

5. Haz clic en **Deploy**

Vercel te dará una URL como `https://documind.vercel.app`.

### Dominio personalizado (opcional)

En Vercel → tu proyecto → **Settings** → **Domains** → añade tu dominio.
Actualiza `ALLOWED_ORIGINS` en Railway con el dominio real:
```
ALLOWED_ORIGINS=["https://tudominio.com"]
```

---

## 7. Activar CI/CD

El workflow de GitHub Actions está desactivado. Para activarlo:

### Secrets en GitHub

Ve a tu repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret | Dónde obtenerlo |
|--------|----------------|
| `RAILWAY_TOKEN` | Railway → Account Settings → Tokens → New Token |
| `VERCEL_TOKEN` | Vercel → Settings → Tokens → Create |
| `VERCEL_ORG_ID` | Vercel → Settings → General → `Your ID` |
| `VERCEL_PROJECT_ID` | Vercel → tu proyecto → Settings → General → `Project ID` |

### Descomentar el workflow

Edita `.github/workflows/deploy.yml` y descomenta las líneas del deploy (están marcadas con comentarios `# disabled`).

A partir de aquí, cada push a `main` despliega automáticamente backend y frontend.

---

## 8. Admin Panel

El admin panel Angular se puede desplegar en Vercel también, o servir de forma estática.

### Crear el usuario administrador

En el servidor donde corre el backend:
```bash
cd backend
uv run python scripts/create_platform_admin.py --email admin@tudominio.com --password TuContraseñaSegura
```

O con Docker:
```bash
docker compose exec backend uv run python scripts/create_platform_admin.py
```

Por defecto crea `admin@documind.io` / `Admin1234!` si no pasas argumentos.

### Desplegar el admin panel en Vercel

1. **Add New Project** en Vercel → mismo repo
2. Configuración:
   - **Root Directory:** `admin-panel`
   - **Framework Preset:** Angular
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist/admin-panel`
3. Variables:
   ```
   NG_APP_API_URL=https://documind-backend-production.up.railway.app
   ```

---

## 9. Variables de entorno completas

### `backend/.env` (producción)

```env
APP_NAME=DocuMind
APP_ENV=production
SECRET_KEY=<genera con: python -c "import secrets; print(secrets.token_hex(32))">

ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30

MONGODB_URL=mongodb+srv://usuario:contraseña@cluster0.xxxxx.mongodb.net
MONGODB_DB_NAME=documind

REDIS_URL=redis://default:xxxx@host:port/0
CELERY_BROKER_URL=redis://default:xxxx@host:port/1
CELERY_RESULT_BACKEND=redis://default:xxxx@host:port/2

STORAGE_PROVIDER=s3
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_BUCKET_NAME=documind-prod

LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini
EMBEDDING_MODEL=text-embedding-3-small

ALLOWED_ORIGINS=["https://tudominio.com","https://documind.vercel.app"]
```

### `notification-service/.env` (producción)

```env
PORT=3001
MONGODB_URL=mongodb+srv://...
MONGODB_DB_NAME=documind
REDIS_URL=redis://default:xxxx@host:port/0
JWT_SECRET=<mismo SECRET_KEY que el backend>

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tuemail@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
FROM_EMAIL=tuemail@gmail.com
FROM_NAME=DocuMind

FRONTEND_URL=https://tudominio.com
```

### `frontend/.env` (producción)

```env
VITE_API_BASE_URL=https://documind-backend-production.up.railway.app
VITE_WS_BASE_URL=wss://documind-backend-production.up.railway.app
```

---

## Orden de despliegue recomendado

```
Paso 1 — OpenAI key          (~5 min)   → el RAG empieza a funcionar en local
Paso 2 — MongoDB Atlas        (~20 min)  → crear cluster + índice vectorial
Paso 3 — Probar RAG en local  (~10 min)  → subir un doc, crear room, hacer una pregunta
Paso 4 — Gmail SMTP           (~10 min)  → los emails de invitación funcionan
Paso 5 — Railway (backend)    (~20 min)  → backend accesible desde internet
Paso 6 — Vercel (frontend)    (~10 min)  → app completa en producción
Paso 7 — CI/CD                (~10 min)  → automatizar deploys futuros
Paso 8 — Admin panel          (~10 min)  → crear usuario PLATFORM_ADMIN
```

Tiempo total estimado: **~1.5 horas**
