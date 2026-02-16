import type { APIRoute } from "astro";

import { apiGet } from "../lib/api";

export const GET: APIRoute = async () => {
  const feed = await apiGet<any[]>("/api/public/feed.json");
  return new Response(JSON.stringify(feed), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
};
