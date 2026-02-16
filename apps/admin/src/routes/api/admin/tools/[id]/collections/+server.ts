import { getCollectionIdsForTool, setToolCollections } from "@toolbox/core/repo";
import { verifySessionToken } from "@toolbox/core/auth";
import { json } from "@sveltejs/kit";

function isAuthed(token?: string) {
  return Boolean(token && verifySessionToken(token));
}

export async function GET({ params, cookies }) {
  if (!isAuthed(cookies.get("toolbox_session"))) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  return json({ collectionIds: await getCollectionIdsForTool(params.id) });
}

export async function PUT({ params, request, cookies }) {
  if (!isAuthed(cookies.get("toolbox_session"))) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const collectionIds = Array.isArray(body?.collectionIds)
    ? body.collectionIds.map((id: unknown) => String(id)).filter((id: string) => id.length > 0)
    : [];

  await setToolCollections(params.id, collectionIds);
  return json({ ok: true });
}
