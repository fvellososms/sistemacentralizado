"use client";

/** Ends the server session (cookie) and the local session (localStorage), then goes to the login. */
export async function logout(router: { replace: (href: string) => void }) {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // Even offline, the local session is cleared below.
  }
  try {
    localStorage.removeItem("rdo_user_session");
  } catch {
    // ignore storage errors
  }
  router.replace("/login");
}
