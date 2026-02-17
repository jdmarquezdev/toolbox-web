import type { Handle } from "@sveltejs/kit";

import { env } from "@toolbox/core/env";
import { verifySessionToken } from "@toolbox/core/auth";
import { ADMIN_BASE_PATH, adminPath } from "$lib/paths";

export const handle: Handle = async ({ event, resolve }) => {
  const pathname = event.url.pathname;

  const isDevAssetPath =
    pathname.startsWith("/@vite") ||
    pathname.startsWith("/@fs/") ||
    pathname.startsWith("/@id/") ||
    pathname.startsWith("/node_modules/.vite/") ||
    pathname.startsWith("/.svelte-kit/") ||
    pathname.startsWith(`${ADMIN_BASE_PATH}/@vite`) ||
    pathname.startsWith(`${ADMIN_BASE_PATH}/@fs/`) ||
    pathname.startsWith(`${ADMIN_BASE_PATH}/@id/`) ||
    pathname.startsWith(`${ADMIN_BASE_PATH}/node_modules/.vite/`) ||
    pathname.startsWith(`${ADMIN_BASE_PATH}/.svelte-kit/`);
  const isAdminStaticPath = pathname.startsWith(`${ADMIN_BASE_PATH}/_app/`) || pathname.startsWith(`${ADMIN_BASE_PATH}/icons/`);

  if (isDevAssetPath || isAdminStaticPath || pathname === "/favicon.ico") {
    return resolve(event);
  }

  if (pathname === ADMIN_BASE_PATH) {
    const next = `${ADMIN_BASE_PATH}/${event.url.search}`;
    return new Response(null, {
      status: 308,
      headers: { location: next }
    });
  }

  const token = event.cookies.get("toolbox_session");
  const isAuthed = Boolean(token && verifySessionToken(token));
  const canIngestWithToken = event.request.headers.get("x-ingest-token") === env.INGEST_TOKEN;
  event.locals.isAuthed = isAuthed;

  // Protected API routes
  if (pathname.startsWith("/api/admin") || pathname.startsWith("/api/tools")) {
    const allowIngestRoute = pathname.startsWith("/api/tools") && canIngestWithToken;
    if (!isAuthed && !allowIngestRoute) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" }
      });
    }
  }

  // Protected Page routes
  if (!isAuthed && !pathname.startsWith("/api") && pathname !== "/login" && pathname !== adminPath("/login")) {
    return new Response(null, {
      status: 302,
      headers: { location: adminPath("/login") }
    });
  }

  if (isAuthed && pathname === "/login") {
    return new Response(null, {
      status: 302,
      headers: { location: `${ADMIN_BASE_PATH}/` }
    });
  }

  return resolve(event);
};
