/**
 * Signed session token (HMAC-SHA256 via Web Crypto), usable in the proxy and in route handlers.
 * Format: base64url(JSON claims) + "." + base64url(signature).
 */

export const SESSION_COOKIE = "fv_sessao";
/** The login stays saved for 7 days without use; using the system extends it (see shouldRenewSession). */
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
/**
 * Every renewal re-checks the account in the database (active, access level, password not changed),
 * so this is also the longest time a deactivated user or a session from before a password change survives.
 */
export const SESSION_RENEW_AFTER_SECONDS = 60 * 60;

export type AccessLevel = "admin" | "usuario";

export interface SessionClaims {
  uid: number;
  name: string;
  email: string;
  lvl: AccessLevel;
  mcp?: boolean; // must change password before using the system
  pv?: string; // fingerprint of the password hash: changing the password ends the other sessions
  exp: number; // unix seconds
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(base64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function signSession(claims: SessionClaims, secret: string): Promise<string> {
  const payload = toBase64Url(encoder.encode(JSON.stringify(claims)));
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(payload)));
  return `${payload}.${toBase64Url(signature)}`;
}

/** Returns the claims when the signature is valid and the token has not expired; otherwise null. */
export async function verifySession(
  token: string | null | undefined,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000)
): Promise<SessionClaims | null> {
  if (!token) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return null;
  try {
    const ok = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret),
      fromBase64Url(signature) as BufferSource,
      encoder.encode(payload)
    );
    if (!ok) return null;
    const claims = JSON.parse(decoder.decode(fromBase64Url(payload))) as SessionClaims;
    if (typeof claims.uid !== "number" || typeof claims.exp !== "number" || claims.exp <= nowSeconds) return null;
    if (claims.lvl !== "admin" && claims.lvl !== "usuario") return null;
    return claims;
  } catch {
    return null;
  }
}

/**
 * Sliding expiration: a session issued more than an hour ago is renewed (after the account check)
 * for another full period, so whoever uses the system at least once a week stays logged in.
 */
export function shouldRenewSession(claims: SessionClaims, nowSeconds = Math.floor(Date.now() / 1000)): boolean {
  return claims.exp - nowSeconds < SESSION_TTL_SECONDS - SESSION_RENEW_AFTER_SECONDS;
}

export function renewSessionClaims(claims: SessionClaims, nowSeconds = Math.floor(Date.now() / 1000)): SessionClaims {
  return { ...claims, exp: nowSeconds + SESSION_TTL_SECONDS };
}

/** Short, non-reversible fingerprint of the stored password hash (goes in the `pv` claim). */
export async function passwordFingerprint(passwordHash: string | null | undefined): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(`fv-pv:${passwordHash ?? ""}`)));
  return toBase64Url(digest).slice(0, 16);
}

const DEV_SECRET = "fvelloso-sms-dev-secret-nao-usar-em-producao";

/**
 * SESSION_SECRET signs the sessions. When it is not configured, a secret derived from DATABASE_URL
 * (already private) is used so the deploy keeps working; set SESSION_SECRET to rotate sessions independently.
 */
export async function getSessionSecret(): Promise<string> {
  const configured = process.env.SESSION_SECRET;
  if (configured && configured.length >= 32) return configured;
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(`fv-session:${databaseUrl}`)));
    return toBase64Url(digest);
  }
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET não configurado.");
  return DEV_SECRET;
}

export function sessionCookieOptions(maxAge = SESSION_TTL_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
