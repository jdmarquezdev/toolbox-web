import type { Actions, PageServerLoad } from "./$types";

import {
  createCollection,
  createOrBumpTool,
  deleteCollection,
  getAdminTools,
  listCollections,
  setToolModerationState,
  updateCollection
} from "@toolbox/core/repo";
import { redirect } from "@sveltejs/kit";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const load: PageServerLoad = async ({ url }) => {
  const inbox = await getAdminTools("inbox");
  const relevant = await getAdminTools("relevant");
  const archived = await getAdminTools("archived");
  const discarded = await getAdminTools("discarded");
  const collections = await listCollections();
  const section = url.searchParams.get("section") === "collections" ? "collections" : "tools";

  return {
    inbox,
    relevant,
    archived,
    discarded,
    collections,
    section
  };
};

export const actions: Actions = {
  addTool: async ({ request }) => {
    const data = await request.formData();
    const url = String(data.get("url") ?? "").trim();
    const notesPrivate = String(data.get("notesPrivate") ?? "").trim();

    if (!url) return { ok: false };

    await createOrBumpTool({
      url,
      notesPrivate: notesPrivate || null,
      createdVia: "admin"
    });

    throw redirect(303, "/?toast=tool-created");
  },
  setState: async ({ request }) => {
    const data = await request.formData();
    const id = String(data.get("id") ?? "");
    const state = String(data.get("state") ?? "");

    if (!id || (state !== "relevant" && state !== "archived" && state !== "discarded")) {
      return { ok: false };
    }

    await setToolModerationState(id, state);
    throw redirect(303, state === "relevant" ? "/?toast=state-updated#relevantes" : state === "archived" ? "/?toast=state-updated#archivadas" : "/?toast=state-updated#descartadas");
  },
  createCollection: async ({ request }) => {
    const data = await request.formData();
    const name = String(data.get("name") ?? "").trim();
    const slug = String(data.get("slug") ?? "").trim();
    const description = String(data.get("description") ?? "").trim();
    const isPublic = String(data.get("isPublic") ?? "on") === "on";

    if (!name) return { ok: false };

    await createCollection({
      name,
      slug: slug || slugify(name),
      description: description || null,
      isPublic
    });

    throw redirect(303, "/?section=collections&toast=collection-created");
  },
  updateCollection: async ({ request }) => {
    const data = await request.formData();
    const id = String(data.get("id") ?? "").trim();
    const name = String(data.get("name") ?? "").trim();
    const slug = String(data.get("slug") ?? "").trim();
    const description = String(data.get("description") ?? "").trim();
    const isPublic = String(data.get("isPublic") ?? "") === "on";

    if (!id) return { ok: false };

    await updateCollection(id, {
      name: name || undefined,
      slug: slug || undefined,
      description: description || undefined,
      isPublic
    });

    throw redirect(303, "/?section=collections&toast=collection-updated");
  },
  deleteCollection: async ({ request }) => {
    const data = await request.formData();
    const id = String(data.get("id") ?? "").trim();
    if (!id) return { ok: false };

    await deleteCollection(id);
    throw redirect(303, "/?section=collections&toast=collection-deleted");
  }
};
