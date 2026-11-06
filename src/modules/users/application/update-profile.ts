import { AppError } from "@/shared/errors/AppError";
import { withDatabase } from "@/shared/errors/with-database";
import { hashPassword, verifyPassword } from "@/shared/security/password";
import { recordAudit } from "@/modules/audit/server";
import { isBootstrapAdmin, validatePasswordStrength } from "../domain/access";
import { isValidAvatarUrl, normalizeEmail } from "../domain/rules";
import type { UserProfile } from "../domain/types";
import { defaultUserRepository, type UserRepository } from "../infrastructure/user-repository";
import { saveFallbackProfile } from "../infrastructure/profile-fallback-store";
import { MAIN_ADMIN_EMAIL, type SessionUser } from "./session";
import { toUserProfile } from "./user-mapper";

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  role?: string;
  cpf?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  address?: string | null;
  department?: string;
  avatarUrl?: string | null;
  currentPassword?: string | null;
  newPassword?: string | null;
}

/**
 * Changes the user's own password. The current password is always required,
 * and the new one must follow the password policy.
 */
export async function changeOwnPassword(
  session: SessionUser,
  currentPassword: string,
  newPassword: string,
  repo: UserRepository = defaultUserRepository
): Promise<UserProfile> {
  return withDatabase(async () => {
    const row = await repo.findById(session.id);
    if (!row) throw AppError.unauthorized("Usuário não encontrado. Entre novamente.");
    if (!(await verifyPassword(row.passwordHash, currentPassword ?? "")).valid)
      throw AppError.badRequest("A senha atual não confere.");
    const weak = validatePasswordStrength(newPassword, row.email);
    if (weak) throw AppError.badRequest(weak);
    if ((await verifyPassword(row.passwordHash, newPassword)).valid)
      throw AppError.badRequest("A nova senha deve ser diferente da atual.");

    const updated = await repo.update(row.id, { passwordHash: await hashPassword(newPassword), mustChangePassword: false });
    await recordAudit({ actorId: row.id, actorName: row.name, action: "password_changed", entity: "user", entityId: row.id });
    return toUserProfile(updated ?? row);
  });
}

/** Updates the logged-in user's own data. Access level and account status are only changed by the admin. */
export async function updateProfile(
  session: SessionUser,
  input: UpdateProfileInput,
  repo: UserRepository = defaultUserRepository
): Promise<UserProfile> {
  if (input.avatarUrl !== undefined && !isValidAvatarUrl(input.avatarUrl))
    throw AppError.badRequest("A foto de perfil deve ser uma imagem (JPEG, PNG, WebP…) de até 6 MB.");

  if (input.newPassword?.trim()) {
    await changeOwnPassword(session, input.currentPassword ?? "", input.newPassword, repo);
  }

  return withDatabase(async () => {
    const row = await repo.findById(session.id);
    if (!row) throw AppError.unauthorized("Usuário não encontrado. Entre novamente.");

    const email = input.email ? normalizeEmail(input.email) : row.email;
    if (email !== row.email) {
      if (isBootstrapAdmin(row.email, MAIN_ADMIN_EMAIL))
        throw AppError.badRequest("O e-mail do administrador principal não pode ser alterado.");
      const other = await repo.findByEmail(email);
      if (other && other.id !== row.id) throw AppError.badRequest("Este e-mail já está em uso por outro usuário.");
    }

    const updated = await repo.update(row.id, {
      name: input.name?.trim() || row.name,
      email,
      role: input.role?.trim() || row.role,
      cpf: input.cpf !== undefined ? input.cpf : row.cpf,
      phone: input.phone !== undefined ? input.phone : row.phone,
      birthDate: input.birthDate !== undefined ? input.birthDate : row.birthDate,
      address: input.address !== undefined ? input.address : row.address,
      department: input.department?.trim() || row.department,
      avatarUrl: input.avatarUrl !== undefined ? input.avatarUrl : row.avatarUrl,
    });
    const profile = toUserProfile(updated ?? row);
    if (isBootstrapAdmin(profile.email, MAIN_ADMIN_EMAIL)) saveFallbackProfile(profile);
    return profile;
  });
}
