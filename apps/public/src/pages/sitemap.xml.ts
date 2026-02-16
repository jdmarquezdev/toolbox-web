import type { APIRoute } from "astro";

import { env } from "@toolbox/core/env";

export const GET: APIRoute = async () => {
  const response = await fetch(`${env.PUBLIC_API_BASE_URL}/api/public/tools?sort=reviewedAt`);
  const tools = response.ok ? await response.json() : [];

  const urls = [
    "https://toolbox.jdmarquez.dev",
    "https://toolbox.jdmarquez.dev/collections",
    ...tools.map((tool: any) => `https://toolbox.jdmarquez.dev/tools/${tool.id}`)
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `<url><loc>${url}</loc></url>`).join("\n")}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "content-type": "application/xml; charset=utf-8"
    }
  });
};
