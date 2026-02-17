import { adminPath } from "$lib/paths";
import type { RequestEvent } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";

export const load = async (_event: RequestEvent) => {
  throw redirect(302, adminPath("/?section=bookmarklet"));
};
