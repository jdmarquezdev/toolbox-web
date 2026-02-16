import type { Actions, PageServerLoad } from "./$types";

import {
  deleteTool,
  getCollectionIdsForTool,
  getToolByIdOrSlug,
  listCollections,
  patchTool,
  setToolCollections,
  setToolModerationState
} from "@toolbox/core/repo";
import { adminPath } from "$lib/paths";
import { error, redirect } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ params }) => {
  const tool = await getToolByIdOrSlug(params.id);
  if (!tool) {
    throw error(404, "Tool not found");
  }

  const [collections, selectedCollectionIds] = await Promise.all([listCollections(), getCollectionIdsForTool(tool.id)]);

  return { tool, collections, selectedCollectionIds };
};

export const actions: Actions = {
  save: async ({ request, params }) => {
    const data = await request.formData();

    const title = String(data.get("title") ?? "").trim();
    const slug = String(data.get("slug") ?? "").trim();
    const description = String(data.get("description") ?? "").trim();
    const sourceType = String(data.get("sourceType") ?? "").trim();
    const notesPrivate = String(data.get("notesPrivate") ?? "").trim();
    const notesPublic = String(data.get("notesPublic") ?? "").trim();
    const moderationState = String(data.get("moderationState") ?? "").trim();
    const collectionIds = data
      .getAll("collectionIds")
      .map((value) => String(value).trim())
      .filter((value) => value.length > 0);

    await patchTool(params.id, {
      title: title || null,
      slug: slug || null,
      description: description || null,
      sourceType: sourceType || null,
      notesPrivate: notesPrivate || null,
      notesPublic: notesPublic || null
    });

    await setToolCollections(params.id, collectionIds);

    if (moderationState === "relevant" || moderationState === "archived" || moderationState === "discarded") {
      await setToolModerationState(params.id, moderationState);
    }

    throw redirect(303, adminPath(`/tools/${params.id}?toast=tool-updated`));
  },
  delete: async ({ params }) => {
    await deleteTool(params.id);
    throw redirect(303, adminPath("/?toast=tool-deleted"));
  },
  setState: async ({ request, params }) => {
    const data = await request.formData();
    const state = String(data.get("state") ?? "");

    if (state === "relevant" || state === "archived" || state === "discarded") {
      await setToolModerationState(params.id, state);
    }

    throw redirect(303, adminPath(`/tools/${params.id}?toast=state-updated`));
  }
};
