import { AppError } from "@/shared/errors/AppError";
import { DATABASE_UNAVAILABLE_MESSAGE, isDatabaseUnavailableError } from "@/shared/errors/database-errors";
import { burnPasswordCheck, hashPassword, isPasswordHash, verifyPassword } from "@/shared/security/password";
import { recordAudit } from "@/modules/audit/server";
import { isBootstrapAdmin, isLocked, legacyPasswordDecision, minutesUntilUnlock, registerFailedLogin } from "../domain/access";
import { normalizeEmail, validateLoginCredentialsInput } from "../domain/rules";
import type { UserProfile } from "../domain/types";
import { defaultUserRepository, type UserRepository, type UserRow } from "../infrastructure/user-repository";
import { getFallbackPasswords, getFallbackProfile } from "../infrastructure/profile-fallback-store";
import { MAIN_ADMIN_EMAIL } from "./session";
import { toUserProfile } from "./user-mapper";

export interface AuthenticateUserInput {
  email: string;
  password: string;
}

const INVALID_CREDENTIALS = "E-mail ou senha inválidos.";

/**
 * Local development only: lets the main administrator in while the database is down
 * (e.g. Supabase paused). Never active in production.
 */
function developmentFallbackLogin(email: string, password: string): UserProfile | null {
  if (process.env.NODE_ENV === "production") return null;
  if (email !== normalizeEmail(MAIN_ADMIN_EMAIL) || !getFallbackPasswords().includes(password)) return null;
  console.warn("authenticateUser: banco indisponível, login local de desenvolvimento do administrador.");
  return { ...getFallbackProfile(), email, accessLevel: "admin", mustChangePassword: false };
}

export async function authenticateUser(
  input: AuthenticateUserInput,
  repo: UserRepository = defaultUserRepository,
  now = new Date()
): Promise<UserProfile> {
  const validation = validateLoginCredentialsInput(input.email, input.password);
  if (!validation.valid) throw AppError.badRequest(validation.error || "Credenciais inválidas.");

  const email = normalizeEmail(input.email);
  let user: UserRow | null;
  try {
    user = await repo.findByEmail(email);
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) throw error;
    const fallback = developmentFallbackLogin(email, input.password);
    if (fallback) return fallback;
    throw AppError.serviceUnavailable(DATABASE_UNAVAILABLE_MESSAGE, "DATABASE_UNAVAILABLE");
  }

  if (!user) {
    await burnPasswordCheck(input.password);
    throw AppError.unauthorized(INVALID_CREDENTIALS);
  }

  if (isLocked(user.lockedUntil, now)) {
    throw new AppError(
      `Conta bloqueada por excesso de tentativas. Tente novamente em ${minutesUntilUnlock(user.lockedUntil!, now)} min ou peça o desbloqueio ao administrador.`,
      423,
      "ACCOUNT_LOCKED"
    );
  }

  const { valid, needsRehash } = await verifyPassword(user.passwordHash, input.password);
  if (!valid) {
    const next = registerFailedLogin(user.failedLoginAttempts, now);
    await repo.update(user.id, next);
    if (next.lockedUntil) {
      await recordAudit({ actorId: user.id, actorName: user.name, action: "login_locked", entity: "user", entityId: user.id });
      throw new AppError(
        "Muitas tentativas incorretas. A conta foi bloqueada por 15 minutos.",
        423,
        "ACCOUNT_LOCKED"
      );
    }
    throw AppError.unauthorized(INVALID_CREDENTIALS);
  }

  // Checked only after the right password, so the message does not reveal which e-mails exist.
  if (!user.active) throw AppError.forbidden("Usuário desativado. Fale com o administrador.");

  const legacyPlainText = !isPasswordHash(user.passwordHash);
  if (legacyPlainText && legacyPasswordDecision(input.password, user.email, isBootstrapAdmin(user.email, MAIN_ADMIN_EMAIL)) === "recusar") {
    await recordAudit({ actorId: user.id, actorName: user.name, action: "login_legacy_password_refused", entity: "user", entityId: user.id });
    throw AppError.forbidden("Esta senha antiga não é mais aceita. Peça ao administrador uma senha temporária.");
  }

  const updated = await repo.update(user.id, {
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: now,
    // Legacy plain-text passwords are replaced by their hash and must be changed right away.
    ...(needsRehash ? { passwordHash: await hashPassword(input.password) } : {}),
    ...(legacyPlainText ? { mustChangePassword: true } : {}),
  });

  return toUserProfile(updated ?? user);
}
