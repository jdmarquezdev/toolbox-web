import { createOrBumpTool } from "@toolbox/core/repo";
import { adminPath } from "$lib/paths";
import type { RequestEvent } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";

export async function GET({ url }: RequestEvent) {
  const raw = String(url.searchParams.get("url") ?? "").trim();

  if (!raw) {
    throw redirect(303, adminPath("/?toast=capture-missing#inbox"));
  }

  try {
    const result = await createOrBumpTool({
      url: raw,
      createdVia: "bookmarklet"
    });

    throw redirect(303, adminPath(`/?toast=${result.created ? "capture-created" : "capture-deduped"}#inbox`));
  } catch {
    throw redirect(303, adminPath("/?toast=capture-invalid#inbox"));
  }
}
