import { adminPath } from "$lib/paths";
import type { RequestEvent } from "@sveltejs/kit";

export const load = async ({ url }: RequestEvent) => {
  return {
    captureBase: `${url.origin}${adminPath("/capture")}`
  };
};
