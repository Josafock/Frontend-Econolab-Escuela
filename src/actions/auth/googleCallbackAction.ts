"use server";

import { cookies } from "next/headers";

const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export async function googleCallbackAction(token: string) {
  const cookieStore = await cookies();

  if (token) {
    cookieStore.set({
      name: "ECONOLAB_TOKEN",
      value: token,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: AUTH_COOKIE_MAX_AGE,
    });
  }

  return { ok: true };
}
