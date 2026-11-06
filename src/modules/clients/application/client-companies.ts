import { AppError } from "@/shared/errors/AppError";
import { withDatabase } from "@/shared/errors/with-database";
import { recordAudit } from "@/modules/audit/server";
import { WORKSPACE_CLIENT_COMPANIES } from "@/modules/workspace/domain/companies";
import type { SessionUser } from "@/modules/users/application/session";
import { normalizeClientCompany, validateClientCompany, type ClientCompanyInput } from "../domain/client-companies";
import { defaultClientCompanyRepository, type ClientCompanyRepository } from "../infrastructure/client-company-repository";

export async function listClientCompanies(repo: ClientCompanyRepository = defaultClientCompanyRepository) {
  return withDatabase(() => repo.list());
}

/** Names offered as suggestions in forms. Falls back to the fixed list when the database is unavailable. */
export async function listActiveClientCompanyNames(repo: ClientCompanyRepository = defaultClientCompanyRepository): Promise<string[]> {
  try {
    const names = (await repo.list()).filter((c) => c.active).map((c) => c.name);
    return names.length ? names : [...WORKSPACE_CLIENT_COMPANIES];
  } catch (error) {
    console.warn("listActiveClientCompanyNames: banco indisponível, usando a lista fixa.", error);
    return [...WORKSPACE_CLIENT_COMPANIES];
  }
}

function assertValid(input: ClientCompanyInput) {
  const { isValid, errors } = validateClientCompany(input);
  if (!isValid) throw new AppError(Object.values(errors).join(" "), 422, "EMPRESA_INVALIDA");
}

export async function createClientCompany(
  admin: SessionUser,
  input: ClientCompanyInput,
  repo: ClientCompanyRepository = defaultClientCompanyRepository
) {
  assertValid(input);
  const data = normalizeClientCompany(input);
  return withDatabase(async () => {
    if (await repo.findByName(data.name)) throw AppError.badRequest("Já existe uma empresa com este nome.");
    const company = await repo.create(data);
    await recordAudit({ actorId: admin.id, actorName: admin.name, action: "company_created", entity: "company", entityId: company.id, details: company.name });
    return company;
  });
}

export async function updateClientCompany(
  admin: SessionUser,
  id: number,
  input: ClientCompanyInput,
  repo: ClientCompanyRepository = defaultClientCompanyRepository
) {
  return withDatabase(async () => {
    const existing = await repo.findById(id);
    if (!existing) throw AppError.notFound("Empresa não encontrada.");
    const merged = { ...existing, ...input };
    assertValid(merged);
    const data = normalizeClientCompany(merged);
    const sameName = await repo.findByName(data.name);
    if (sameName && sameName.id !== id) throw AppError.badRequest("Já existe uma empresa com este nome.");
    const company = await repo.update(id, data);
    if (!company) throw AppError.internal("Não foi possível atualizar a empresa.");
    await recordAudit({
      actorId: admin.id,
      actorName: admin.name,
      action: "company_updated",
      entity: "company",
      entityId: id,
      details: existing.active !== company.active ? `${company.name} · ${company.active ? "reativada" : "desativada"}` : company.name,
    });
    return company;
  });
}
