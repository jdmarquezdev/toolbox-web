import { getAdminTools } from "@toolbox/core/repo";
import { verifySessionToken } from "@toolbox/core/auth";
import { json } from "@sveltejs/kit";

export async function GET({ url }) {

  const state = url.searchParams.get("state");
  const tools = await getAdminTools(
    state === "inbox" || state === "relevant" || state === "archived" || state === "discarded" ? state : undefined
  );

  return json(tools);
}
