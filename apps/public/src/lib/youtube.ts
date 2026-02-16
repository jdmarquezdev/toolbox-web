export function extractYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host.includes("youtu.be")) {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ?? null;
    }

    if (host.includes("youtube.com")) {
      const watchId = parsed.searchParams.get("v");
      if (watchId) return watchId;

      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts[0] === "shorts" || parts[0] === "embed") {
        return parts[1] ?? null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function youtubeEmbedUrl(url: string): string | null {
  const id = extractYoutubeId(url);
  if (!id) return null;

  const embed = new URL(`https://www.youtube-nocookie.com/embed/${id}`);
  embed.searchParams.set("rel", "0");
  embed.searchParams.set("modestbranding", "1");
  embed.searchParams.set("playsinline", "1");
  return embed.toString();
}

export function youtubeThumbnailUrl(url: string): string | null {
  const id = extractYoutubeId(url);
  if (!id) return null;
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
