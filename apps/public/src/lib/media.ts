export function toAbsoluteAssetUrl(assetUrl: string | null | undefined, pageUrl: string): string | null {
  if (!assetUrl) return null;

  try {
    return new URL(assetUrl, pageUrl).toString();
  } catch {
    return null;
  }
}

export function resolveToolMediaUrl(tool: {
  screenshotUrl?: string | null;
  ogImageUrl?: string | null;
  url: string;
}): string | null {
  return toAbsoluteAssetUrl(tool.screenshotUrl ?? tool.ogImageUrl ?? null, tool.url);
}
