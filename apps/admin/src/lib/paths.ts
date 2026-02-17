export const ADMIN_BASE_PATH = "/admin";

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
