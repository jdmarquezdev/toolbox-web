import type { Handle } from "@sveltejs/kit";

import { verifySessionToken } from "@toolbox/core/auth";
import { ADMIN_BASE_PATH, adminPath } from "$lib/paths";

export const handle: Handle = async ({ event, resolve }) => {
  const pathname = event.url.pathname;

  if (pathname === ADMIN_BASE_PATH) {
    const next = `${ADMIN_BASE_PATH}/${event.url.search}`;
    return new Response(null, {
      status: 308,
      headers: { location: next }
    });
  }

  const token = event.cookies.get("toolbox_session");
  const isAuthed = Boolean(token && verifySessionToken(token));
  event.locals.isAuthed = isAuthed;

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
