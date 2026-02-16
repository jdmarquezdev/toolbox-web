import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const redirectToRaw = String(formData.get("redirectTo") ?? "/").trim();
  const redirectTo = redirectToRaw.startsWith("/") ? redirectToRaw : "/";

  cookies.set("toolbox_cookie_consent", "1", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: false,
    secure: import.meta.env.PROD
  });

  return redirect(redirectTo, 303);
};
