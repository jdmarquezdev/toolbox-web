import { reorderCollections } from "@toolbox/core/repo";
import { verifySessionToken } from "@toolbox/core/auth";
import { json } from "@sveltejs/kit";

function isAuthed(token?: string) {
  return Boolean(token && verifySessionToken(token));
}

export async function PATCH({ request, cookies }) {
  if (!isAuthed(cookies.get("toolbox_session"))) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const ids = Array.isArray(body?.ids) ? body.ids.map((id: unknown) => String(id)).filter(Boolean) : [];

  await reorderCollections(ids);
  return json({ ok: true });
}
