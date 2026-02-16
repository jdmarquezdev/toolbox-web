import { reorderModerationTools } from "@toolbox/core/repo";
import { verifySessionToken } from "@toolbox/core/auth";
import { json } from "@sveltejs/kit";

function isAuthed(token?: string) {
  return Boolean(token && verifySessionToken(token));
}

export async function PATCH({ request, cookies }) {
  if (!isAuthed(cookies.get("toolbox_session"))) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const items = Array.isArray(body?.items) ? body.items : [];

  const normalized = items
    .map((item: any) => ({
      id: String(item.id ?? ""),
      moderationState: String(item.moderationState ?? ""),
      moderationPosition: Number(item.moderationPosition ?? -1)
    }))
    .filter(
      (item: any) =>
        item.id &&
        (item.moderationState === "inbox" ||
          item.moderationState === "relevant" ||
          item.moderationState === "archived" ||
          item.moderationState === "discarded") &&
        Number.isFinite(item.moderationPosition) &&
        item.moderationPosition >= 0
    );

  await reorderModerationTools(normalized);
  return json({ ok: true });
}
