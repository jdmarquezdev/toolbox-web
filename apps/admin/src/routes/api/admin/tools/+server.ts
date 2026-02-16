import { getAdminTools } from "@toolbox/core/repo";
import { verifySessionToken } from "@toolbox/core/auth";
import { json } from "@sveltejs/kit";

export async function GET({ url, cookies }) {
  const token = cookies.get("toolbox_session");
  if (!token || !verifySessionToken(token)) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = url.searchParams.get("state");
  const tools = await getAdminTools(
    state === "inbox" || state === "relevant" || state === "archived" || state === "discarded" ? state : undefined
  );

  return json(tools);
}
