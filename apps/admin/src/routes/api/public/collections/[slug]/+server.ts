import { getCollectionBySlug } from "@toolbox/core/repo";
import { json } from "@sveltejs/kit";

export async function GET({ params }) {
  const collection = await getCollectionBySlug(params.slug);
  if (!collection) return json({ error: "Not found" }, { status: 404 });
  return json(collection);
}
