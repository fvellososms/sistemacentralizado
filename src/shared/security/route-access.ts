/**
 * Pure route protection rules applied by the proxy (src/proxy.ts) to every request.
 */

import type { SessionClaims } from "./session-token.ts";

export type RouteDecision =
  | { type: "allow" }
  | { type: "redirect"; to: string }
  | { type: "deny"; status: 401 | 403; message: string };

const PUBLIC_PAGES = ["/login"];
// Cron routes check their own secret (CRON_SECRET).
const PUBLIC_API_PREFIXES = ["/api/auth/login", "/api/auth/logout", "/api/health", "/api/cron/"];
// Reachable while the user still has to replace a temporary password.
const PASSWORD_CHANGE_PATHS = ["/alterar-senha", "/api/auth/alterar-senha", "/api/auth/logout", "/api/profile"];
const ADMIN_PREFIXES = ["/admin", "/api/admin"];

const matches = (pathname: string, prefix: string) =>
  prefix.endsWith("/") ? pathname.startsWith(prefix) : pathname === prefix || pathname.startsWith(`${prefix}/`);

export function resolveRouteAccess(pathname: string, claims: SessionClaims | null): RouteDecision {
  const isApi = pathname.startsWith("/api/");

  if (PUBLIC_PAGES.some((p) => matches(pathname, p))) {
    return claims ? { type: "redirect", to: claims.mcp ? "/alterar-senha" : "/dashboard" } : { type: "allow" };
  }
  if (isApi && PUBLIC_API_PREFIXES.some((p) => matches(pathname, p))) return { type: "allow" };

  if (!claims) {
    return isApi
      ? { type: "deny", status: 401, message: "Sessão expirada. Entre novamente." }
      : { type: "redirect", to: "/login" };
  }

  if (claims.mcp && !PASSWORD_CHANGE_PATHS.some((p) => matches(pathname, p))) {
    return isApi
      ? { type: "deny", status: 403, message: "Defina uma nova senha antes de continuar." }
      : { type: "redirect", to: "/alterar-senha" };
  }

  if (ADMIN_PREFIXES.some((p) => matches(pathname, p)) && claims.lvl !== "admin") {
    return isApi
      ? { type: "deny", status: 403, message: "Acesso restrito ao administrador." }
      : { type: "redirect", to: "/dashboard" };
  }

  if (pathname === "/") return { type: "redirect", to: claims.mcp ? "/alterar-senha" : "/dashboard" };
  return { type: "allow" };
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Defense against CSRF on top of SameSite=Lax: API calls that change data must come from this site.
 * Browsers always send Origin on cross-site POST/PUT/PATCH/DELETE; requests without it (server tools,
 * Vercel Cron) are not browser forgeries and fall back to the session check.
 */
export function isCrossSiteMutation(method: string, pathname: string, origin: string | null, host: string): boolean {
  if (SAFE_METHODS.has(method.toUpperCase()) || !pathname.startsWith("/api/") || !origin) return false;
  try {
    return new URL(origin).host !== host;
  } catch {
    return true; // "null" (sandboxed frames, privacy redirects) or malformed
  }
}

/** Where to go after the login: only paths inside this site ("/\\evil.com" is read as "//evil.com"). */
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || /[\\\u0000-\u001f]/.test(next)) return fallback;
  return next;
}
