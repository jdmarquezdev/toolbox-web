import { addToolToCollection, getToolsByCollectionId, removeToolFromCollection, reorderCollectionTools } from "@toolbox/core/repo";
import { verifySessionToken } from "@toolbox/core/auth";
import { json } from "@sveltejs/kit";

function isAuthed(token?: string) {
  return Boolean(token && verifySessionToken(token));
}

export async function GET({ params, cookies }) {
  if (!isAuthed(cookies.get("toolbox_session"))) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  return json(await getToolsByCollectionId(params.id));
}

export async function PATCH({ params, request, cookies }) {
  if (!isAuthed(cookies.get("toolbox_session"))) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const orderedToolIds = Array.isArray(body?.toolIds)
    ? body.toolIds.map((id: unknown) => String(id)).filter((id: string) => id.length > 0)
    : [];

  await reorderCollectionTools(params.id, orderedToolIds);
  return json({ ok: true });
}

export async function POST({ params, request, cookies }) {
  if (!isAuthed(cookies.get("toolbox_session"))) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const toolId = String(body?.toolId ?? "").trim();
  if (!toolId) {
    return json({ error: "Missing toolId" }, { status: 400 });
  }

  await addToolToCollection(params.id, toolId);
  return json({ ok: true });
}

export async function DELETE({ params, request, cookies }) {
  if (!isAuthed(cookies.get("toolbox_session"))) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const toolId = String(body?.toolId ?? "").trim();
  if (!toolId) {
    return json({ error: "Missing toolId" }, { status: 400 });
  }

  await removeToolFromCollection(params.id, toolId);
  return json({ ok: true });
}
