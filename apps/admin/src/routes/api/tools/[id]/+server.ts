import { patchTool } from "@toolbox/core/repo";
import { verifySessionToken } from "@toolbox/core/auth";
import { json } from "@sveltejs/kit";

export async function PATCH({ request, params, cookies }) {
  const token = cookies.get("toolbox_session");
  if (!token || !verifySessionToken(token)) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  await patchTool(params.id, body);
  return json({ ok: true });
}
