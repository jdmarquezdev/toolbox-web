import { getPublicTools } from "@toolbox/core/repo";
import { json } from "@sveltejs/kit";

export async function GET({ url }) {
  const tools = await getPublicTools({
    query: url.searchParams.get("query") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    sourceType: url.searchParams.get("sourceType") ?? undefined,
    oss: url.searchParams.get("oss") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined
  });

  return json(tools);
}
