import { AppError } from "@/shared/errors/AppError";
import { withDatabase } from "@/shared/errors/with-database";
import { generateTemporaryPassword, hashPassword } from "@/shared/security/password";
import { recordAudit } from "@/modules/audit/server";
import { ACCESS_LEVELS, isBootstrapAdmin, isLocked, resolveAccessLevel, validateUserAccount, type UserAccountInput } from "../domain/access";
import { normalizeEmail } from "../domain/rules";
import { defaultUserRepository, type UserRepository, type UserRow } from "../infrastructure/user-repository";
import { MAIN_ADMIN_EMAIL, type SessionUser } from "./session";

/** User as shown on the admin screen. */
export interface AdminUserView {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  accessLevel: "admin" | "usuario";
  active: boolean;
  locked: boolean;
  mustChangePassword: boolean;
  isMainAdmin: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

function toAdminView(row: UserRow, now = new Date()): AdminUserView {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    department: row.department,
    accessLevel: resolveAccessLevel(row.accessLevel, row.email, MAIN_ADMIN_EMAIL),
    active: row.active,
    locked: isLocked(row.lockedUntil, now),
    mustChangePassword: row.mustChangePassword,
    isMainAdmin: isBootstrapAdmin(row.email, MAIN_ADMIN_EMAIL),
    lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

const actorOf = (admin: SessionUser) => ({ actorId: admin.id, actorName: admin.name });

function assertValid(input: Partial<UserAccountInput>, requirePassword = false) {
  const { isValid, errors } = validateUserAccount(input, { requirePassword });
  if (!isValid) throw new AppError(Object.values(errors).join(" "), 422, "USUARIO_INVALIDO");
}

async function findOrFail(id: number, repo: UserRepository): Promise<UserRow> {
  const row = await repo.findById(id);
  if (!row) throw AppError.notFound("Usuário não encontrado.");
  return row;
}

export async function listUsers(repo: UserRepository = defaultUserRepository): Promise<AdminUserView[]> {
  return withDatabase(async () => (await repo.list()).map((row) => toAdminView(row)));
}

/**
 * Creates a login. Without a password, a temporary one is generated and returned only in this response;
 * either way the user must choose a new password on the first login.
 */
export async function createUser(
  admin: SessionUser,
  input: Partial<UserAccountInput>,
  repo: UserRepository = defaultUserRepository
): Promise<{ user: AdminUserView; temporaryPassword: string }> {
  assertValid(input);
  return withDatabase(async () => {
    const email = normalizeEmail(input.email!);
    if (await repo.findByEmail(email)) throw AppError.badRequest("Já existe um usuário com este e-mail.");
    const temporaryPassword = input.password?.trim() || generateTemporaryPassword();
    const row = await repo.create({
      name: input.name!.trim(),
      email,
      role: input.role!.trim(),
      department: input.department!.trim(),
      accessLevel: input.accessLevel,
      passwordHash: await hashPassword(temporaryPassword),
      mustChangePassword: true,
      active: true,
    });
    await recordAudit({
      ...actorOf(admin),
      action: "user_created",
      entity: "user",
      entityId: row.id,
      details: `${row.name} <${row.email}> · ${ACCESS_LEVELS[input.accessLevel!]}`,
    });
    return { user: toAdminView(row), temporaryPassword };
  });
}

export interface UpdateUserInput extends Partial<Omit<UserAccountInput, "password">> {
  active?: boolean;
}

export async function updateUser(
  admin: SessionUser,
  id: number,
  input: UpdateUserInput,
  repo: UserRepository = defaultUserRepository
): Promise<AdminUserView> {
  return withDatabase(async () => {
    const row = await findOrFail(id, repo);
    const next = {
      name: input.name ?? row.name,
      email: input.email ?? row.email,
      role: input.role ?? row.role,
      department: input.department ?? row.department,
      accessLevel: input.accessLevel ?? resolveAccessLevel(row.accessLevel, row.email, MAIN_ADMIN_EMAIL),
    };
    assertValid(next);
    const email = normalizeEmail(next.email);
    const mainAdmin = isBootstrapAdmin(row.email, MAIN_ADMIN_EMAIL);
    const active = input.active ?? row.active;

    if (mainAdmin && (next.accessLevel !== "admin" || !active || email !== row.email))
      throw AppError.forbidden("O administrador principal não pode ser rebaixado, desativado nem ter o e-mail alterado.");
    if (row.id === admin.id && (!active || next.accessLevel !== "admin"))
      throw AppError.forbidden("Você não pode desativar nem rebaixar o seu próprio acesso.");
    if (email !== row.email) {
      const other = await repo.findByEmail(email);
      if (other && other.id !== row.id) throw AppError.badRequest("Já existe um usuário com este e-mail.");
    }

    const updated = await repo.update(id, {
      name: next.name.trim(),
      email,
      role: next.role.trim(),
      department: next.department.trim(),
      accessLevel: next.accessLevel,
      active,
    });
    if (!updated) throw AppError.internal("Não foi possível atualizar o usuário.");

    const action = active !== row.active ? (active ? "user_activated" : "user_deactivated") : "user_updated";
    await recordAudit({ ...actorOf(admin), action, entity: "user", entityId: id, details: `${updated.name} <${updated.email}>` });
    return toAdminView(updated);
  });
}

/** Generates a new temporary password; the user must change it on the next login. */
export async function resetUserPassword(
  admin: SessionUser,
  id: number,
  repo: UserRepository = defaultUserRepository
): Promise<{ user: AdminUserView; temporaryPassword: string }> {
  return withDatabase(async () => {
    const row = await findOrFail(id, repo);
    const temporaryPassword = generateTemporaryPassword();
    const updated = await repo.update(id, {
      passwordHash: await hashPassword(temporaryPassword),
      mustChangePassword: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
    await recordAudit({ ...actorOf(admin), action: "user_password_reset", entity: "user", entityId: id, details: `${row.name} <${row.email}>` });
    return { user: toAdminView(updated ?? row), temporaryPassword };
  });
}

export async function unlockUser(admin: SessionUser, id: number, repo: UserRepository = defaultUserRepository): Promise<AdminUserView> {
  return withDatabase(async () => {
    const row = await findOrFail(id, repo);
    const updated = await repo.update(id, { failedLoginAttempts: 0, lockedUntil: null });
    await recordAudit({ ...actorOf(admin), action: "user_unlocked", entity: "user", entityId: id, details: `${row.name} <${row.email}>` });
    return toAdminView(updated ?? row);
  });
}
