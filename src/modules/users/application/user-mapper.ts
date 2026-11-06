import { resolveAccessLevel } from "../domain/access";
import type { UserProfile } from "../domain/types";
import type { UserRow } from "../infrastructure/user-repository";
import { MAIN_ADMIN_EMAIL, type SessionUser } from "./session";

/** Public profile (never exposes the password hash or lockout data). */
export function toUserProfile(row: UserRow): UserProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    cpf: row.cpf,
    phone: row.phone,
    birthDate: row.birthDate,
    address: row.address,
    department: row.department,
    avatarUrl: row.avatarUrl,
    accessLevel: resolveAccessLevel(row.accessLevel, row.email, MAIN_ADMIN_EMAIL),
    mustChangePassword: row.mustChangePassword,
  };
}

export function toSessionUser(profile: UserProfile): SessionUser {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    accessLevel: profile.accessLevel ?? "usuario",
    mustChangePassword: Boolean(profile.mustChangePassword),
  };
}
