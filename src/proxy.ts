import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/middleware";
import {
  SESSION_COOKIE,
  getSessionSecret,
  sessionCookieOptions,
  shouldRenewSession,
  signSession,
  verifySession,
  type SessionClaims,
} from "@/shared/security/session-token";
import { isCrossSiteMutation, resolveRouteAccess, type RouteDecision } from "@/shared/security/route-access";
import { revalidateSessionClaims } from "@/modules/users/application/session";

/**
 * Next 16 proxy (formerly middleware, runs on Node.js): protects every page and API route.
 * The session is renewed at most once an hour, and each renewal re-checks the account in the database.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isCrossSiteMutation(request.method, pathname, request.headers.get("origin"), request.nextUrl.host)) {
    return NextResponse.json({ error: "Requisição de outro site bloqueada." }, { status: 403 });
  }

  const secret = await getSessionSecret();
  let claims = await verifySession(request.cookies.get(SESSION_COOKIE)?.value, secret);
  let renewed: SessionClaims | null = null;
  let ended = false;

  if (claims && shouldRenewSession(claims)) {
    renewed = await revalidateSessionClaims(claims).catch((error: unknown) => {
      console.error("proxy: falha ao revalidar a sessão.", error);
      return claims; // unexpected failure: keep the current (still valid) session
    });
    if (!renewed) ended = true; // deactivated, removed or password changed
    claims = renewed;
  }

  const response = await respond(request, resolveRouteAccess(pathname, claims), pathname + search);
  if (ended) response.cookies.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  else if (renewed) response.cookies.set(SESSION_COOKIE, await signSession(renewed, secret), sessionCookieOptions());
  return response;
}

async function respond(request: NextRequest, decision: RouteDecision, path: string): Promise<NextResponse> {
  if (decision.type === "redirect") {
    const url = request.nextUrl.clone();
    url.pathname = decision.to;
    url.search = decision.to === "/login" && path !== "/" ? `?next=${encodeURIComponent(path)}` : "";
    return NextResponse.redirect(url);
  }
  if (decision.type === "deny") {
    return NextResponse.json({ error: decision.message }, { status: decision.status });
  }
  return createClient(request);
}

export const config = {
  matcher: [
    // Every API route, whatever the path ends with ("/api/rdos/5.png" must not skip the login check).
    "/api/:path*",
    /*
     * Pages: every path except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, icons, etc.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
