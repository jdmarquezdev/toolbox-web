import { getPublicFeedJson } from "@toolbox/core/repo";

export async function GET() {
  const items = await getPublicFeedJson();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Toolbox Feed</title>
    <link>https://toolbox.jdmarquez.dev</link>
    <description>Herramientas de IA relevantes y curadas</description>
    ${items
      .map(
        (item: { id: string; title: string | null; url: string; description: string | null }) => `<item>
      <title>${(item.title ?? "Toolbox item").replace(/</g, "&lt;")}</title>
      <link>${item.url}</link>
      <guid>${item.id}</guid>
      <description>${(item.description ?? "").replace(/</g, "&lt;")}</description>
    </item>`
      )
      .join("\n")}
  </channel>
</rss>`;

  return new Response(rss, {
    status: 200,
    headers: {
      "content-type": "application/rss+xml; charset=utf-8"
    }
  });
}
