# Toolbox — agents.md

## 1) Objetivo
Construir **Toolbox**, una plataforma personal para:
- Capturar rápidamente herramientas/enlaces de IA desde cualquier dispositivo (URL).
- Revisarlas y moderarlas desde panel admin.
- Publicar una web pública rápida, limpia y con buen SEO.

## 2) Superficies y URL base
Toolbox se publica como sub-sitio dentro de `jdmarquez.dev`:

- **Público:** `https://toolbox.jdmarquez.dev`
- **Admin/API:** `https://toolbox.jdmarquez.dev/admin` y `https://toolbox.jdmarquez.dev/api/*`

Requisito: el panel admin solo es accesible para el owner (login obligatorio).

## 3) Roles
- Visitor (público): ver listado, filtrar, abrir fuente y detalle.
- Owner (admin): capturar, editar, moderar, ordenar y curar colecciones.

## 4) Estados y flujo (core)
El estado de moderación actual de una herramienta es:
- `inbox`
- `relevant`
- `archived`
- `discarded`

Flujo:
1) Entra por URL (admin / API) => `moderationState=inbox`.
2) Owner revisa y mueve entre estados.
3) Solo `relevant` aparece en la web pública.

Compatibilidad histórica:
- Se conservan campos legacy (`status`, `relevant`) por compatibilidad interna, pero la fuente de verdad de publicación es `moderationState`.

## 5) Requisitos funcionales

### 5.1 Captura de herramientas (inbox)
- Añadir herramienta pegando una URL (mínimo: `url`).
- Autocompletar metadatos OG:
  - `title`, `description`, `ogImageUrl`, `faviconUrl`.
- Normalizar URL.
- Deduplicar:
  - si la URL normalizada existe, no crear duplicado.
  - al detectar duplicado: incrementar `seenCount` y actualizar `lastSeenAt`.
- Registrar origen de captura:
  - `createdVia`: `admin` | `telegram` | `bookmarklet` | `api`.

### 5.2 Slugs y URLs públicas
- Herramientas usan slug estable en público: `/tools/:slug`.
- Si se entra por GUID legacy, redirección canónica a slug.
- El slug:
  - se propone automáticamente desde título,
  - es editable en admin,
  - no se regenera automáticamente al editar título (estable).
- Colecciones usan `/collections/:slug`.

### 5.3 Web pública
- Home:
  - grid de cards de herramientas relevantes,
  - card clicable abre fuente en nueva pestaña,
  - enlace "Ver detalle" abre ficha interna.
- Filtros públicos vigentes:
  - texto libre (`query`),
  - tipo de fuente (`sourceType`).
- Vista de colecciones (`/collections`):
  - una fila por colección,
  - nombre + descripción,
  - carrusel horizontal con cards de herramientas,
  - controles de flechas integrados y scroll horizontal.
- Detalle de colección (`/collections/:slug`):
  - grid de cards estilo Toolbox,
  - botón volver (SVG).
- SEO:
  - sitemap,
  - metatags,
  - OG/Twitter cards,
  - feed JSON público.

### 5.4 Panel admin (ruta `/admin`)
- Login obligatorio.
- Secciones:
  - Herramientas
  - Colecciones
- Herramientas:
  - vista por tabs: Nuevo, Relevantes, Archivadas, Descartadas,
  - drag and drop dentro y entre estados,
  - persistencia de orden por `moderationPosition`.
- Ficha de herramienta:
  - editar título, slug, descripción, tipo, notas,
  - asignar colecciones (multiselección),
  - cambiar estado,
  - guardar/eliminar.
- Colecciones:
  - crear/editar/eliminar,
  - ordenar por drag and drop,
  - `isPublic=true` por defecto,
  - slug sugerido automáticamente desde nombre.
- UX:
  - iconografía SVG física,
  - feedback de guardado por toast.

### 5.5 Integración Telegram / n8n
**Pospuesta temporalmente.**

Se mantiene la base preparada:
- ingestión por token (`INGEST_TOKEN`) en `POST /api/tools`.

Queda pendiente para una fase posterior:
- flujo n8n completo,
- validación/whitelist de `chat_id`,
- automatización de ingestión desde bot.

### 5.6 Screenshot/preview (opcional)
- Mantener soporte de `screenshotUrl`/`previewStatus` en modelo.
- Worker de screenshots queda opcional para fase posterior.

## 6) Tema visual
- La aplicación pública y admin usan visual oscuro por defecto.
- No es requisito actual mantener toggle manual de tema.

## 7) Modelo de datos (Postgres)

### `tools`
- `id` (uuid)
- `slug` (text, unique, nullable durante migraciones legacy)
- `url` (text, unique)
- `originalUrl` (text)
- `createdVia` (enum: admin|telegram|bookmarklet|api)
- `sourceType` (enum: website|github|youtube|article|x|other)
- `title`, `description`, `faviconUrl`, `ogImageUrl`
- `screenshotUrl` (nullable)
- `previewStatus` (enum: none|pending|ready|failed)
- `pricing`, `oss`, `categoryId`
- `notesPrivate`, `notesPublic`
- `status`, `relevant` (legacy)
- `moderationState` (enum: inbox|relevant|archived|discarded)
- `moderationPosition` (int)
- `createdAt`, `updatedAt`, `reviewedAt`
- `lastSeenAt`, `seenCount`

### `collections`
- `id`, `name`, `slug`, `description`
- `isPublic` (default true)
- `position`
- `createdAt`

### `collection_tools`
- `collectionId`, `toolId`, `position`
- PK (`collectionId`, `toolId`)

### `tags`, `tool_tags`, `categories`, `users`
- Se mantienen en esquema para evolución futura.

## 8) API (estado actual)

### Pública
- `GET /api/public/tools?query=&sourceType=&sort=`
- `GET /api/public/tools/:idOrSlug`
- `GET /api/public/collections`
- `GET /api/public/collections/:slug`
- `GET /api/public/feed.json`
- `GET /api/public/feed.rss`

### Ingestión
- `POST /api/tools`
  - auth por sesión owner o header `x-ingest-token`.

### Admin
- `GET /api/admin/tools`
- `PATCH /api/admin/tools/reorder`
- `GET/PUT /api/admin/tools/:id/collections`
- `GET/POST /api/admin/collections`
- `PATCH /api/admin/collections/reorder`
- `GET/PATCH/DELETE /api/admin/collections/:id`
- `GET/POST/PATCH/DELETE /api/admin/collections/:id/tools`
- `GET/POST /api/admin/tags`
- `GET/POST /api/admin/categories`

Nota:
- `POST /api/tools/:id/review` del diseño inicial queda reemplazado por el flujo actual de moderación/orden.

## 9) Tech stack
- Monorepo Bun.
- Público: Astro (`apps/public`).
- Admin/API: SvelteKit (`apps/admin`).
- Núcleo compartido: `packages/core` (env, auth, db, repo, tipos).
- DB: Postgres.

## 10) Deploy (Docker)
- Servicios base:
  - `public`
  - `admin`
  - `postgres`
- Reverse proxy externo enruta dominio/subrutas según entorno.

## 11) Variables de entorno (mínimas)
- `DATABASE_URL`
- `SESSION_SECRET`
- `INGEST_TOKEN`
- `SCREENSHOT_WORKER_ENABLED` (opcional)
- credenciales owner (`OWNER_EMAIL`, `OWNER_PASSWORD`)

## 12) Criterios de aceptación (actual)
- Puedo añadir una URL y aparece en inbox.
- Deduplicación activa con `seenCount`/`lastSeenAt`.
- Al mover a `relevant`, aparece en público.
- `archived` y `discarded` no aparecen en público.
- Público muestra herramientas y colecciones correctamente.
- Slugs de herramientas y colecciones funcionan de forma canónica.
- Admin requiere login y permite moderar/ordenar/editar.
- Colecciones se pueden crear, editar, ordenar y publicar.

## 13) No objetivos (por ahora)
- Integración Telegram/n8n completa.
- Registro público de usuarios.
- Comentarios/ratings públicos de terceros.
- Monetización, afiliados, pagos.
- Moderación multiusuario.

## 14) DEVLOG
Registrar todos los cambios funcionales/técnicos en `DEVLOG.md`.
