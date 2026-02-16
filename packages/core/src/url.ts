import type { SourceType } from "./types";

const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid"
];

export function normalizeUrl(rawUrl: string): string {
  const parsed = new URL(rawUrl.trim());

  for (const key of TRACKING_PARAMS) {
    parsed.searchParams.delete(key);
  }

  if (parsed.pathname.length > 1 && parsed.pathname.endsWith("/")) {
    parsed.pathname = parsed.pathname.slice(0, -1);
  }

  parsed.hash = "";
  parsed.hostname = parsed.hostname.toLowerCase();
  return parsed.toString();
}

export function detectSourceType(rawUrl: string): SourceType {
  const { hostname, pathname } = new URL(rawUrl);
  const host = hostname.toLowerCase();

  if (host.includes("github.com")) return "github";
  if (host.includes("youtube.com") || host.includes("youtu.be")) return "youtube";
  if (host === "x.com" || host.endsWith(".x.com") || host === "twitter.com" || host.endsWith(".twitter.com")) return "x";
  if (pathname.includes("/blog") || pathname.includes("/article")) return "article";
  return "website";
}
