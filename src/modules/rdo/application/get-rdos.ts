import { RdoRepository, defaultRdoRepository } from "../infrastructure/rdo-repository";

export async function getRdos(
  filter?: { projectId?: number; month?: string },
  repo: RdoRepository = defaultRdoRepository
) {
  return repo.findMany(filter);
}

export async function getRdoById(
  id: number,
  repo: RdoRepository = defaultRdoRepository
) {
  return repo.findById(id);
}

