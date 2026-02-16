import { redirect } from "@sveltejs/kit";

export async function POST({ cookies }) {
  cookies.delete("toolbox_session", { path: "/" });
  throw redirect(302, "/login");
}
