# Toolbox

Toolbox es una plataforma personal para capturar, moderar y publicar herramientas de IA.

- Público (Astro): listado y detalle de herramientas relevantes, colecciones públicas y SEO.
- Admin/API (SvelteKit): captura por URL, moderación, edición y gestión de colecciones.
- Core compartido (`packages/core`): env, auth, db, repositorio SQL, tipos y utilidades.

## Stack

- Monorepo con Bun
- `apps/public`: Astro
- `apps/admin`: SvelteKit (panel + API)
- `packages/core`: lógica compartida
- Postgres

## Funcionalidad actual

### Captura y deduplicación

- Alta de herramientas por URL (`POST /api/tools`).
- Captura directa por bookmarklet autenticado (`GET /admin/capture?url=...`).
- Enriquecimiento OG automático (`title`, `description`, `ogImageUrl`, `faviconUrl`).
- Normalización de URL.
- Dedupe con actualización de `seenCount` y `lastSeenAt`.
- Registro de origen de captura (`createdVia`).

### Moderación

- Estado de verdad: `moderationState` (`inbox`, `relevant`, `archived`, `discarded`).
- Solo `relevant` se publica en la web pública.
- Orden persistente por `moderationPosition`.
- Drag and drop en admin dentro y entre estados.

### Slugs canónicos

- Herramientas con slug estable y editable.
- Colecciones con slug estable y editable.
- Redirección canónica desde GUID legacy a slug en herramientas.

### Web pública

- Home con grid de herramientas relevantes.
- Card clicable (abre fuente) y enlace de detalle interno.
- Filtros vigentes: `query` y `sourceType`.
- Sección de colecciones:
  - una fila por colección,
  - carrusel horizontal de cards,
  - flechas integradas + scroll horizontal.
- Detalle de colección con grid estilo Toolbox.
- Feed JSON/RSS y sitemap.

### Admin

- Login obligatorio para owner.
- Secciones separadas: Herramientas / Colecciones.
- Ficha de herramienta:
  - edición de `title`, `slug`, `description`, `sourceType`, notas,
  - asignación múltiple de colecciones,
  - cambio de estado,
  - guardar/eliminar.
- Colecciones:
  - crear/editar/eliminar,
  - ordenar por drag and drop,
  - públicas por defecto (`isPublic=true`),
  - acciones con iconografía SVG.
- Feedback de guardado con toast flotante.

## Estructura

- `apps/public` — sitio público Astro
- `apps/admin` — panel admin y API SvelteKit
- `packages/core` — DB/env/auth/repo/tipos
- `db/schema.sql` — esquema SQL de Postgres
- `DEVLOG.md` — historial funcional/técnico
- `AGENTS.md` — especificación vigente del producto

## Rutas y endpoints principales

### Apps (local)

- Público: `/<root>`
- Admin/API: `/admin` y `/api/*`

### API pública

- `GET /api/public/tools?query=&sourceType=&sort=`
- `GET /api/public/tools/:idOrSlug`
- `GET /api/public/collections`
- `GET /api/public/collections/:slug`
- `GET /api/public/feed.json`
- `GET /api/public/feed.rss`

### API admin

- `GET /api/admin/tools`
- `PATCH /api/admin/tools/reorder`
- `GET/PUT /api/admin/tools/:id/collections`
- `GET/POST /api/admin/collections`
- `PATCH /api/admin/collections/reorder`
- `GET/PATCH/DELETE /api/admin/collections/:id`
- `GET/POST/PATCH/DELETE /api/admin/collections/:id/tools`

### Ingestión

- `POST /api/tools` (sesión owner o `x-ingest-token`)
- `GET /admin/capture?url=...` (sesión owner, pensado para bookmarklet)

### Screenshot worker (opcional)

- Política actual: solo genera `screenshotUrl` cuando falta `ogImageUrl` válida.
- Activa con `SCREENSHOT_WORKER_ENABLED=true`.
- Ejecuta manualmente:

```bash
bun run screenshots:worker
```

## Arranque local

1. Copia variables de entorno:

```bash
cp .env.example .env
```

2. Levanta Postgres:

```bash
docker compose up -d postgres
```

3. Aplica esquema:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

4. Instala dependencias y arranca:

```bash
bun install
bun run dev
```

5. Checks:

```bash
bun run check
```

## Despliegue

Se despliega con Docker y reverse proxy externo:

- `/` -> público
- `/admin` -> admin
- `/api` -> admin API

## Estado de Telegram/n8n

La integración completa Telegram/n8n está pospuesta temporalmente.

Actualmente queda preparada la base de ingestión por token:

- `INGEST_TOKEN`
- `POST /api/tools`

## Nota sobre rutas admin

- El panel admin está fijado en `/admin`.

## Licencia

MIT.
