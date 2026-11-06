import { AppError } from "@/shared/errors/AppError";
import { withDatabase } from "@/shared/errors/with-database";
import { recordAudit } from "@/modules/audit/server";
import type { SessionUser } from "@/modules/users/application/session";
import { validateProject, type ProjectInput } from "../domain/rules";
import { defaultProjectRepository, type ProjectRepository } from "../infrastructure/project-repository";
import { invalidateProjectsCache } from "./get-projects";

export async function listProjectsForAdmin(repo: ProjectRepository = defaultProjectRepository) {
  return withDatabase(() => repo.list());
}

function normalize(input: ProjectInput) {
  const { isValid, errors } = validateProject(input);
  if (!isValid) throw new AppError(Object.values(errors).join(" "), 422, "OBRA_INVALIDA");
  return {
    name: input.name!.trim(),
    code: input.code!.trim().toUpperCase(),
    address: input.address!.trim(),
    companyName: input.companyName!.trim(),
    managerName: input.managerName!.trim(),
    status: input.status!,
    startDate: input.startDate!,
    clientCompanyId: input.clientCompanyId ?? null,
  };
}

export async function createProject(admin: SessionUser, input: ProjectInput, repo: ProjectRepository = defaultProjectRepository) {
  const data = normalize(input);
  return withDatabase(async () => {
    const project = await repo.create(data);
    invalidateProjectsCache();
    await recordAudit({
      actorId: admin.id,
      actorName: admin.name,
      action: "project_created",
      entity: "project",
      entityId: project.id,
      details: `${project.code} · ${project.name}${project.clientCompanyName ? ` · ${project.clientCompanyName}` : ""}`,
    });
    return project;
  });
}

export async function updateProject(
  admin: SessionUser,
  id: number,
  input: ProjectInput,
  repo: ProjectRepository = defaultProjectRepository
) {
  return withDatabase(async () => {
    const existing = await repo.findById(id);
    if (!existing) throw AppError.notFound("Obra não encontrada.");
    const project = await repo.update(id, normalize({ ...existing, ...input }));
    if (!project) throw AppError.internal("Não foi possível atualizar a obra.");
    const clientChanged = existing.clientCompanyId !== project.clientCompanyId;
    invalidateProjectsCache();
    await recordAudit({
      actorId: admin.id,
      actorName: admin.name,
      action: "project_updated",
      entity: "project",
      entityId: id,
      details: clientChanged
        ? `${project.code} · empresa cliente: ${existing.clientCompanyName ?? "nenhuma"} → ${project.clientCompanyName ?? "nenhuma"}`
        : `${project.code} · ${project.name}`,
    });
    return project;
  });
}
