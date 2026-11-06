import { AppError } from "@/shared/errors/AppError";
import { withDatabase } from "@/shared/errors/with-database";
import { normalizeEmail } from "../domain/rules";
import { defaultUserRepository, type UserRepository } from "../infrastructure/user-repository";

/** Active system user shown as "colaborador" in visits, activities and tasks. */
export interface TeamMember {
  id: number;
  name: string;
  role: string;
}

export async function listTeamMembers(repo: UserRepository = defaultUserRepository): Promise<TeamMember[]> {
  return withDatabase(async () =>
    (await repo.list()).filter((u) => u.active).map((u) => ({ id: u.id, name: u.name, role: u.role }))
  );
}

/** The selected collaborator must be an active user; returns the name to store with the record. */
export async function resolveTeamMember(id: unknown, repo: UserRepository = defaultUserRepository): Promise<TeamMember> {
  if (!Number.isInteger(id) || (id as number) <= 0) throw new AppError("Selecione o colaborador.", 422, "COLABORADOR_INVALIDO");
  const row = await withDatabase(() => repo.findById(id as number));
  if (!row || !row.active) throw new AppError("Colaborador não encontrado ou desativado.", 422, "COLABORADOR_INVALIDO");
  return { id: row.id, name: row.name, role: row.role };
}

/** Key used to match names typed in files (ESO) with users: no accents, case or extra spaces. */
export const teamNameKey = (name: string) =>
  normalizeEmail(name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " "));
