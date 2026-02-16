import { createSessionToken } from "@toolbox/core/auth";
import { env } from "@toolbox/core/env";
import { redirect } from "@sveltejs/kit";

export async function POST({ request, cookies }) {
  const data = await request.formData();
  const email = String(data.get("email") ?? "");
  const password = String(data.get("password") ?? "");

  if (email !== env.OWNER_EMAIL || password !== env.OWNER_PASSWORD) {
    throw redirect(302, "/login");
  }

  cookies.set("toolbox_session", createSessionToken(email), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 60 * 60 * 24 * 14
  });

  throw redirect(302, "/");
}
