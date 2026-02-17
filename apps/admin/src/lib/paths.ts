const rawBasePath = (process.env.ADMIN_BASE_PATH ?? "").trim();

function normalizeBasePath(value: string) {
  if (!value) return "";

  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  return withLeadingSlash.replace(/\/+$/, "");
}

export const ADMIN_BASE_PATH = normalizeBasePath(rawBasePath);

export function adminPath(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!ADMIN_BASE_PATH) {
    return normalizedPath;
  }

  if (!path.startsWith("/")) {
    return `${ADMIN_BASE_PATH}/${path}`;
  }

  return `${ADMIN_BASE_PATH}${normalizedPath}`;
}
