import type { Handle } from "@sveltejs/kit";

import { verifySessionToken } from "@toolbox/core/auth";

export const handle: Handle = async ({ event, resolve }) => {
  const pathname = event.url.pathname;

  const token = event.cookies.get("toolbox_session");
  const isAuthed = Boolean(token && verifySessionToken(token));
  event.locals.isAuthed = isAuthed;

  if (!isAuthed && !pathname.startsWith("/api") && pathname !== "/login") {
    return new Response(null, {
      status: 302,
      headers: { location: "/login" }
    });
  }

  return resolve(event);
};
