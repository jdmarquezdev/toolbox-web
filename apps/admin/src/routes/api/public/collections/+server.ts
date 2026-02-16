import { getPublicCollectionsWithTools } from "@toolbox/core/repo";
import { json } from "@sveltejs/kit";

export async function GET() {
  return json(await getPublicCollectionsWithTools());
}
