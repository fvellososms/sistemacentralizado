/**
 * Pure access rules: access levels, password policy, login lockout and user validation.
 */

import { normalizeEmail } from "./rules.ts";

export const ACCESS_LEVELS = {
  admin: "Administrador",
  usuario: "Usuário",
} as const;

export type AccessLevel = keyof typeof ACCESS_LEVELS;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;

const COMMON_PASSWORDS = new Set(["12345678", "123456789", "senha123", "password", "senha1234", "qwerty123", "abc12345"]);

/** Null when the password is acceptable; otherwise the reason. */
export function validatePasswordStrength(password: string, email?: string | null): string | null {
  if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH)
    return `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  if (password.length > PASSWORD_MAX_LENGTH) return `A senha deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`;
  if (!/[A-Za-zÀ-ÿ]/.test(password) || !/\d/.test(password)) return "A senha deve combinar letras e números.";
  if (COMMON_PASSWORDS.has(password.toLowerCase())) return "Esta senha é muito comum. Escolha outra.";
  const localPart = normalizeEmail(email ?? "").split("@")[0];
  if (localPart.length >= 4 && password.toLowerCase().includes(localPart))
    return "A senha não pode conter o seu e-mail.";
  return null;
}

/**
 * Passwords still stored in plain text (old system) were readable by anyone with database access.
 * After a correct login they must always be replaced; weak ones (e.g. the old default "123456")
 * are refused, since anyone could guess them. The main administrator is never locked out by this
 * rule (only forced to choose a new password), so there is always someone able to reset the others.
 */
export function legacyPasswordDecision(password: string, email: string, isMainAdmin: boolean): "trocar" | "recusar" {
  return validatePasswordStrength(password, email) && !isMainAdmin ? "recusar" : "trocar";
}

/** The main administrator (the system owner) can never be deactivated or demoted. */
export function isBootstrapAdmin(email: string | null | undefined, adminEmail: string): boolean {
  return Boolean(email) && normalizeEmail(email!) === normalizeEmail(adminEmail);
}

export function resolveAccessLevel(stored: string | null | undefined, email: string, adminEmail: string): AccessLevel {
  if (isBootstrapAdmin(email, adminEmail)) return "admin";
  return stored === "admin" ? "admin" : "usuario";
}

export function isLocked(lockedUntil: Date | string | null | undefined, now: Date): boolean {
  return Boolean(lockedUntil) && new Date(lockedUntil!).getTime() > now.getTime();
}

/** Minutes left in the lock (rounded up), for the message shown at login. */
export function minutesUntilUnlock(lockedUntil: Date | string, now: Date): number {
  return Math.max(1, Math.ceil((new Date(lockedUntil).getTime() - now.getTime()) / 60_000));
}

/** After a wrong password: counts the attempt and locks the account when the limit is reached. */
export function registerFailedLogin(failedAttempts: number, now: Date): { failedLoginAttempts: number; lockedUntil: Date | null } {
  const attempts = failedAttempts + 1;
  if (attempts >= MAX_FAILED_LOGINS) {
    return { failedLoginAttempts: 0, lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60_000) };
  }
  return { failedLoginAttempts: attempts, lockedUntil: null };
}

export interface UserAccountInput {
  name: string;
  email: string;
  role: string; // job title (cargo)
  department: string;
  accessLevel: AccessLevel;
  password?: string | null; // optional on creation: a temporary password is generated
}

export type UserAccountErrors = Partial<Record<keyof UserAccountInput, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateUserAccount(
  input: Partial<UserAccountInput>,
  { requirePassword = false }: { requirePassword?: boolean } = {}
): { isValid: boolean; errors: UserAccountErrors } {
  const errors: UserAccountErrors = {};
  if (!input.name?.trim() || input.name.trim().length > 255) errors.name = "Informe o nome completo.";
  if (!input.email?.trim() || !EMAIL_RE.test(input.email.trim())) errors.email = "Informe um e-mail válido.";
  if (!input.role?.trim()) errors.role = "Informe o cargo.";
  if (!input.department?.trim()) errors.department = "Informe o departamento.";
  if (!input.accessLevel || !(input.accessLevel in ACCESS_LEVELS)) errors.accessLevel = "Selecione o nível de acesso.";
  if (input.password || requirePassword) {
    const weak = validatePasswordStrength(input.password ?? "", input.email);
    if (weak) errors.password = weak;
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}
