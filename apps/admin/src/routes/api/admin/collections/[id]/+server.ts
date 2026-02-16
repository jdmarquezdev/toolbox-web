import { deleteCollection, getCollectionById, updateCollection } from "@toolbox/core/repo";
import { verifySessionToken } from "@toolbox/core/auth";
import { json } from "@sveltejs/kit";

function isAuthed(token?: string) {
  return Boolean(token && verifySessionToken(token));
}

export async function GET({ params, cookies }) {
  if (!isAuthed(cookies.get("toolbox_session"))) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const collection = await getCollectionById(params.id);
  if (!collection) {
    return json({ error: "Not found" }, { status: 404 });
  }

  return json(collection);
}

export async function PATCH({ params, request, cookies }) {
  if (!isAuthed(cookies.get("toolbox_session"))) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const updated = await updateCollection(params.id, {
    name: typeof body.name === "string" ? body.name : undefined,
    slug: typeof body.slug === "string" ? body.slug : undefined,
    description: typeof body.description === "string" ? body.description : undefined,
    isPublic: typeof body.isPublic === "boolean" ? body.isPublic : undefined
  });

  if (!updated) {
    return json({ error: "Not found" }, { status: 404 });
  }

  return json(updated);
}

export async function DELETE({ params, cookies }) {
  if (!isAuthed(cookies.get("toolbox_session"))) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  await deleteCollection(params.id);
  return json({ ok: true });
}
