import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url }) => {
  const origin = url.origin;
  const response = await fetch(`${origin}/api/public/tools?sort=reviewedAt`);
  const tools = response.ok ? await response.json() : [];

  const urls = [
    `${origin}/`,
    `${origin}/?section=collections`,
    ...tools
      .filter((tool: any) => Boolean(tool.slug))
      .map((tool: any) => `${origin}/tools/${tool.slug}`)
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
