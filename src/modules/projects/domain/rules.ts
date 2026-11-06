/**
 * Pure validation of the projects (obras) managed on the admin screen.
 */

import type { Project } from "./types.ts";

export const PROJECT_STATUSES = ["Em andamento", "Paralisada", "Concluída"] as const;

export type ProjectInput = Partial<Omit<Project, "id" | "clientCompanyName">>;
export type ProjectErrors = Partial<Record<keyof ProjectInput, string>>;

export function validateProject(input: ProjectInput): { isValid: boolean; errors: ProjectErrors } {
  const errors: ProjectErrors = {};
  const filled = (v: unknown, max = 255) => typeof v === "string" && v.trim().length > 0 && v.trim().length <= max;
  if (!filled(input.name)) errors.name = "Informe o nome da obra.";
  if (!filled(input.code, 50)) errors.code = "Informe o código da obra (até 50 caracteres).";
  if (!filled(input.address, 500)) errors.address = "Informe o endereço.";
  if (!filled(input.companyName)) errors.companyName = "Informe a construtora / contratante.";
  if (!filled(input.managerName)) errors.managerName = "Informe o responsável técnico.";
  if (!input.status || !(PROJECT_STATUSES as readonly string[]).includes(input.status)) errors.status = "Selecione a situação da obra.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startDate ?? "")) errors.startDate = "Informe a data de início.";
  if (input.clientCompanyId != null && (!Number.isInteger(input.clientCompanyId) || input.clientCompanyId <= 0))
    errors.clientCompanyId = "Empresa cliente inválida.";
  return { isValid: Object.keys(errors).length === 0, errors };
}
