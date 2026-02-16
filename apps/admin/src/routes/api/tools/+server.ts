import { createOrBumpTool } from "@toolbox/core/repo";
import { env } from "@toolbox/core/env";
import { verifySessionToken } from "@toolbox/core/auth";
import { json } from "@sveltejs/kit";

function canIngest(request: Request, sessionToken?: string) {
  const ingestToken = request.headers.get("x-ingest-token");
  if (ingestToken && ingestToken === env.INGEST_TOKEN) return true;
  return Boolean(sessionToken && verifySessionToken(sessionToken));
}

export async function POST({ request, cookies }) {
  const session = cookies.get("toolbox_session");
  if (!canIngest(request, session)) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  const isForm = contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data");

  const payload = isForm ? await request.formData() : await request.json();
  const url = String((isForm ? payload.get("url") : payload.url) ?? "").trim();
  const notesPrivate = String((isForm ? payload.get("notesPrivate") : payload.notesPrivate) ?? "").trim();
  const createdVia = String((isForm ? payload.get("createdVia") : payload.createdVia) ?? "api") as
    | "admin"
    | "telegram"
    | "bookmarklet"
    | "api";

  if (!url) {
    return json({ error: "Missing url" }, { status: 400 });
  }

  try {
    const result = await createOrBumpTool({
      url,
      notesPrivate: notesPrivate || null,
      createdVia
    });

    return json(result, { status: result.created ? 201 : 200 });
  } catch {
    return json({ error: "Invalid url" }, { status: 400 });
  }
}
