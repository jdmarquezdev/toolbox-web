type MetadataResult = {
  title: string | null;
  description: string | null;
  ogImageUrl: string | null;
  faviconUrl: string | null;
};

function extractMetaTag(html: string, key: string): string | null {
  const regex = new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i");
  return html.match(regex)?.[1] ?? null;
}

function resolveAbsoluteUrl(candidate: string | null, baseUrl: string): string | null {
  if (!candidate) return null;

  try {
    return new URL(candidate, baseUrl).toString();
  } catch {
    return null;
  }
}

function extractTitle(html: string): string | null {
  return html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() ?? null;
}

function extractFavicon(html: string, baseUrl: string): string | null {
  const iconMatch = html.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>/i);
  if (!iconMatch?.[1]) return null;

  try {
    return new URL(iconMatch[1], baseUrl).toString();
  } catch {
    return null;
  }
}

export async function fetchUrlMetadata(url: string): Promise<MetadataResult> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "ToolboxBot/1.0 (+https://toolbox.jdmarquez.dev)"
      }
    });

    if (!response.ok) {
      return { title: null, description: null, ogImageUrl: null, faviconUrl: null };
    }

    const html = await response.text();
    const ogImageRaw = extractMetaTag(html, "og:image");

    return {
      title: extractMetaTag(html, "og:title") ?? extractTitle(html),
      description: extractMetaTag(html, "og:description") ?? extractMetaTag(html, "description"),
      ogImageUrl: resolveAbsoluteUrl(ogImageRaw, url),
      faviconUrl: extractFavicon(html, url)
    };
  } catch {
    return { title: null, description: null, ogImageUrl: null, faviconUrl: null };
  }
}
