export const ADMIN_BASE_PATH = "/admin";

export function adminPath(path: string) {
  if (!path.startsWith("/")) {
    return `${ADMIN_BASE_PATH}/${path}`;
  }

  return `${ADMIN_BASE_PATH}${path}`;
}
