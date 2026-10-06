# NexScope — AI-Powered YouTube Niche Finder

Plataforma SaaS para encontrar nichos rentables en YouTube con análisis impulsado por IA (Z.ai), datos de tendencia, explorador de keywords, análisis de canales, brechas de contenido, planes de contenido, monetización y matriz de competidores.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS 4** + shadcn/ui + recharts + framer-motion
- **Prisma ORM** + SQLite
- **Autenticación JWT** (cookies httpOnly)
- **Z.ai Web Dev SDK** para generación de datos con IA en tiempo real
- **Zustand** para estado global

## Requisitos

- Node.js 20+
- npm (o bun/pnpm)

## Puesta en marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Crear la base de datos SQLite a partir del schema de Prisma
npx prisma db push

# 3. Generar el cliente de Prisma (se ejecuta solo con db push, si no:)
npx prisma generate

# 4. Arrancar en modo desarrollo
npm run dev
```

Abre http://localhost:3000, regístrate y empieza a usar la plataforma.

## Variables de entorno (.env)

```
DATABASE_URL=file:../db/custom.db
JWT_SECRET=<openssl rand -hex 32>
JWT_EXPIRES_IN=24h
YOUTUBE_API_KEY=<opcional, también configurable desde la UI>
NODE_ENV=production|development  # fijada automáticamente por Next.js
```

> La ruta de `DATABASE_URL` es relativa a la carpeta `prisma/` (donde vive `schema.prisma`) y apunta a `db/custom.db` en la raíz del proyecto. La YouTube Data API key se configura desde la UI (vista Ajustes) y se persiste en la base de datos, no en archivos. `NODE_ENV` la establece Next.js automáticamente; no la declares manualmente en `.env`. El template `.env.example` documenta todas las variables usadas en `src/`.

## Características

- **Cero mockups**: todas las vistas consumen datos reales de IA o YouTube Data API; nunca datos falsos.
- **Banner de estado de IA**: cada vista informa si la IA está en vivo, no disponible o verificando.
- **Autenticación JWT** con cookies httpOnly y contraseñas hasheadas.
- **Persistencia multiusuario**: nichos, canales, historial de chat y planes guardados por usuario (optimistic UI).
- **Exportar a CSV** los planes de contenido.
- **Parser robusto de respuestas IA** (`extract-json.ts`): tolera fences markdown, texto extra y JSON con errores comunes.
- **Cache de IA en memoria** (`src/lib/cache.ts`): `/api/trends` (90 s) y `/api/keywords` (30 s) cachean por nicho para que múltiples usuarios compartiendo la misma consulta no paguen latencia ni quota por duplicado.

## Estructura del proyecto

```
src/
  app/
    api/              # Endpoints REST (auth, keywords, trends, chat, etc.)
    layout.tsx        # Layout raíz
    page.tsx          # Página principal
    globals.css
  components/
    views/            # 11 vistas de la aplicación
    ui/               # Componentes shadcn/ui
    shared/           # Cards, banners, indicadores reutilizables
    auth/             # Modales de login/registro
  hooks/              # use-ai-status, use-youtube-api, use-toast, use-mobile
  lib/
    auth.ts           # JWT + hashing de contraseñas
    db.ts             # Cliente Prisma
    store.ts          # Estado global Zustand
    extract-json.ts   # Parser robusto de respuestas IA
    types.ts
prisma/
  schema.prisma       # Modelos: User, SavedNiche, SavedChannel, ChatMessage, ContentPlan, Setting
db/                   # Base de datos SQLite (se crea con prisma db push)
public/
scripts/              # Utilidades de desarrollo (inspección de DB, tests E2E)
```

## Endpoints principales

| Endpoint                | Descripción                                    |
|-------------------------|------------------------------------------------|
| `POST /api/auth/register` | Registro de usuario (JWT en cookie httpOnly) |
| `POST /api/auth/login`    | Login                                        |
| `GET  /api/health`        | Estado de disponibilidad de la IA            |
| `POST /api/keywords`      | Keywords de un nicho (IA)                    |
| `POST /api/trends`        | Tendencias de YouTube (IA)                   |
| `POST /api/content-gaps`  | Brechas de contenido (IA)                    |
| `POST /api/content-plan`  | Plan de contenido de 30 videos (IA)          |
| `POST /api/monetization`  | Estimación de ingresos RPM/CPM (IA)          |
| `POST /api/competitor-analysis` | Comparación de canales (IA)            |
| `POST /api/chat`          | Asistente conversacional (IA)                |
| `GET/POST/DELETE /api/saved-niches` | Nichos guardados por usuario       |
| `GET/POST/DELETE /api/saved-channels` | Canales guardados               |
| `GET/POST/DELETE /api/chat-messages` | Historial del chat               |
| `GET/POST/DELETE /api/content-plans` | Planes guardados                 |
| `GET  /api/dashboard`     | Métricas agregadas del usuario               |
| `GET/POST /api/youtube`   | Proxy a YouTube Data API v3                  |

## Scripts de producción

```bash
# 1. Compilar (output standalone + copia static/public al bundle)
npm run build

# 2. Arrancar en producción (puerto configurable con PORT, por defecto 3000)
npm start
```

> Nota: el script `start` inyecta automáticamente `DATABASE_URL=file:$(pwd)/db/custom.db` y arranca con `node` (no `bun`), porque el servidor standalone de Next.js NO carga el archivo `.env` automáticamente. En Windows usar `npm run start:win` (usa `cross-env` y ruta relativa). La base de datos debe existir previamente (`npx prisma db push`).

### Producción: Vercel vs self-hosting

| Aspecto | Self-hosting (PM2, Docker, `npm start`) | Vercel |
|---|---|---|
| `output: 'standalone'` | Necesario para servir `.next/standalone/server.js` sin `node_modules` | Ignorado — Vercel usa su propio pipeline |
| SQLite | Funciona (filesystem persistente) | **NO funciona** — el filesystem serverless es efímero y de solo lectura en runtime |
| Cache en memoria (`src/lib/cache.ts`) | Funciona (proceso único) | No efectivo (cada invocation serverless puede arrancar desde cero); usar Upstash Redis |
| `postinstall: prisma generate` | Innecesario pero inofensivo | Necesario — Vercel instala deps en build, no en runtime |
| `JWT_SECRET` | Seteado en entorno del proceso | Configurado en el panel de Vercel → Settings → Environment Variables |

**Migración a Postgres para Vercel**: la forma más económica y simple es **Turso** (libSQL hosted, compatible con Prisma) o **Neon** (Postgres serverless). El cambio en código es únicamente el bloque `datasource` de `schema.prisma` + la variable `DATABASE_URL`. No hay queries SQL crudas en el proyecto, así que toda la lógica multi-tenant (incluyendo los índices `@@index([userId])` añadidos en audit-3) funciona sin cambios.

### Migraciones Prisma

El proyecto usa `prisma db push` para sincronizar el schema con la DB (workflow de prototipo). Para producción se recomienda migraciones formales:

```bash
# Solo primera vez — genera el baseline `prisma/migrations/` a partir del estado actual
npx prisma migrate dev --name init

# Aplica migraciones pendientes en deploy (CI/CD, Vercel build, servidor)
npm run db:migrate:deploy
```

No se generaron migrations automáticas en audit-3 porque el proyecto se ha iterado con `db push` y un `migrate dev` requiere una DB limpia o un baseline explícito (`prisma migrate diff`). Documentar la transición cuando se decida promocionar el schema a "estable".

### Observabilidad

- `/api/health` → estado de disponibilidad de la IA + latencia (cache 60 s).
- Logs: en dev, Prisma loguea queries (`log: ['query', 'error', 'warn']`); en producción solo `['error', 'warn']` para evitar fugas de datos sensibles en logs.
- `safeErrorMessage` (audit-1) y `logError` (`src/lib/errors.ts`) centralizan el manejo de errores server-side.
- Brecha documentada: no hay `/api/version` con hash de commit ni Sentry/Datadog; pendiente de infra externa.
