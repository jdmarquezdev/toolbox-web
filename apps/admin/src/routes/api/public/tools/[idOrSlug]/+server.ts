import { getToolByIdOrSlug } from "@toolbox/core/repo";
import { json } from "@sveltejs/kit";

export async function GET({ params }) {
  const tool = await getToolByIdOrSlug(params.idOrSlug);
  if (!tool || tool.moderationState !== "relevant") {
    return json({ error: "Not found" }, { status: 404 });
  }

  return json(tool);
}
