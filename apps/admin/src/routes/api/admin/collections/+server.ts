import { createCollection, listCollections } from "@toolbox/core/repo";
import { verifySessionToken } from "@toolbox/core/auth";
import { json } from "@sveltejs/kit";

function isAuthed(token?: string) {
  return Boolean(token && verifySessionToken(token));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET({ cookies }) {
  if (!isAuthed(cookies.get("toolbox_session"))) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  return json(await listCollections());
}

export async function POST({ request, cookies }) {
  if (!isAuthed(cookies.get("toolbox_session"))) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  if (!name) return json({ error: "Missing name" }, { status: 400 });

  const slug = String(body.slug ?? "").trim() || slugify(name);
  const description = String(body.description ?? "").trim();
  const isPublic = typeof body.isPublic === "boolean" ? body.isPublic : true;

  return json(
    await createCollection({
      name,
      slug,
      description: description || null,
      isPublic
    }),
    { status: 201 }
  );
}
