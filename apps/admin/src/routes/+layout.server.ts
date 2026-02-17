import type { LayoutServerLoad } from "./$types";

const TOAST_MESSAGES: Record<string, string> = {
  "tool-created": "Herramienta guardada.",
  "tool-updated": "Cambios guardados.",
  "tool-deleted": "Herramienta eliminada.",
  "state-updated": "Estado actualizado.",
  "collection-created": "Colección guardada.",
  "collection-updated": "Colección actualizada.",
  "collection-deleted": "Colección eliminada.",
  "capture-created": "Enlace capturado en inbox.",
  "capture-deduped": "Ya existía: se incrementó seenCount.",
  "capture-invalid": "No se pudo capturar esa URL.",
  "capture-missing": "Falta la URL para capturar."
};

export const load: LayoutServerLoad = async ({ cookies, url }) => {
  const section = url.searchParams.get("section") === "collections" ? "collections" : "tools";
  const pathname = url.pathname;
  const toastKey = url.searchParams.get("toast") ?? "";
  const toastMessage = TOAST_MESSAGES[toastKey] ?? null;

  return {
    isAuthed: Boolean(cookies.get("toolbox_session")),
    pathname,
    section,
    toastMessage
  };
};
