import { cookies } from "next/headers";
import { AppError } from "@/shared/errors/AppError";
import { isDatabaseUnavailableError } from "@/shared/errors/database-errors";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  getSessionSecret,
  passwordFingerprint,
  renewSessionClaims,
  sessionCookieOptions,
  signSession,
  verifySession,
  type SessionClaims,
} from "@/shared/security/session-token";
import { DEFAULT_PROFILE } from "../domain/constants";
import { resolveAccessLevel } from "../domain/access";
import { defaultUserRepository, type UserRepository } from "../infrastructure/user-repository";

export const MAIN_ADMIN_EMAIL = DEFAULT_PROFILE.email;

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  accessLevel: "admin" | "usuario";
  mustChangePassword: boolean;
}

/** Fingerprint of the user's current password, or undefined when the database cannot be read. */
async function currentPasswordFingerprint(userId: number, repo: UserRepository): Promise<string | undefined> {
  try {
    const row = await repo.findById(userId);
    return row ? await passwordFingerprint(row.passwordHash) : undefined;
  } catch {
    return undefined;
  }
}

export async function issueSession(user: SessionUser, repo: UserRepository = defaultUserRepository): Promise<void> {
  const pv = await currentPasswordFingerprint(user.id, repo);
  const claims: SessionClaims = {
    uid: user.id,
    name: user.name,
    email: user.email,
    lvl: user.accessLevel,
    ...(user.mustChangePassword ? { mcp: true } : {}),
    ...(pv ? { pv } : {}),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const store = await cookies();
  store.set(SESSION_COOKIE, await signSession(claims, await getSessionSecret()), sessionCookieOptions());
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", sessionCookieOptions(0));
}

/** Session from the signed cookie, without touching the database. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const claims = await verifySession(store.get(SESSION_COOKIE)?.value, await getSessionSecret());
  if (!claims) return null;
  return {
    id: claims.uid,
    name: claims.name,
    email: claims.email,
    accessLevel: claims.lvl,
    mustChangePassword: Boolean(claims.mcp),
  };
}

export async function requireSession(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw AppError.unauthorized("Sessão expirada. Entre novamente.");
  return user;
}

/**
 * Admin-only operations re-check the account in the database, so a user demoted or deactivated
 * after logging in loses access immediately (not only at the next hourly session check).
 */
export async function requireAdmin(repo: UserRepository = defaultUserRepository): Promise<SessionUser> {
  const user = await requireSession();
  let accessLevel = user.accessLevel;
  try {
    const row = await repo.findById(user.id);
    if (!row || !row.active) throw AppError.forbidden("Acesso restrito ao administrador.");
    accessLevel = resolveAccessLevel(row.accessLevel, row.email, MAIN_ADMIN_EMAIL);
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) throw error;
    // Without the database the signed session is the only source; admin data cannot be changed anyway.
  }
  if (accessLevel !== "admin") throw AppError.forbidden("Acesso restrito ao administrador.");
  return { ...user, accessLevel };
}

/**
 * Called by the proxy when a session is due for renewal. Returns the renewed claims with the access data
 * read again from the database, or null when the session must end: account removed or deactivated, or the
 * password changed since the login (`pv`). With the database unavailable the session is simply extended,
 * so a paused Supabase does not log everyone out.
 */
export async function revalidateSessionClaims(
  claims: SessionClaims,
  repo: UserRepository = defaultUserRepository
): Promise<SessionClaims | null> {
  let row;
  try {
    row = await repo.findById(claims.uid);
  } catch (error) {
    if (isDatabaseUnavailableError(error)) return renewSessionClaims(claims);
    throw error;
  }
  if (!row || !row.active) return null;
  const pv = await passwordFingerprint(row.passwordHash);
  if (claims.pv && claims.pv !== pv) return null;
  return renewSessionClaims({
    uid: row.id,
    name: row.name,
    email: row.email,
    lvl: resolveAccessLevel(row.accessLevel, row.email, MAIN_ADMIN_EMAIL),
    ...(row.mustChangePassword ? { mcp: true } : {}),
    pv,
    exp: claims.exp,
  });
}
