import { AppError } from "@/shared/errors/AppError";
import { validateNaoConformidade, type NaoConformidadeInput } from "../domain/non-conformities";
import {
  defaultNaoConformidadeRepository,
  type NaoConformidadeRepository,
} from "../infrastructure/nc-repository";

const hojeIso = () => new Date().toISOString().slice(0, 10);

export async function listNaoConformidades(
  filter: { projectId?: number } = {},
  repo: NaoConformidadeRepository = defaultNaoConformidadeRepository
) {
  return repo.findMany(filter);
}

export async function createNaoConformidade(
  input: Partial<NaoConformidadeInput>,
  repo: NaoConformidadeRepository = defaultNaoConformidadeRepository
) {
  const { isValid, errors } = validateNaoConformidade(input, hojeIso());
  if (!isValid) {
    throw new AppError(Object.values(errors).join(" "), 422, "NC_INVALIDA");
  }
  return repo.create(input as NaoConformidadeInput);
}

export async function resolveNaoConformidade(
  id: number,
  repo: NaoConformidadeRepository = defaultNaoConformidadeRepository
) {
  const existing = await repo.findById(id);
  if (!existing) throw AppError.notFound("Não conformidade não encontrada.");
  if (existing.status === "resolvida") return existing;
  const updated = await repo.markResolved(id);
  if (!updated) throw AppError.internal("Não foi possível atualizar a não conformidade.");
  return updated;
}
