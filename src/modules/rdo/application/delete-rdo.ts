import { AppError } from "@/shared/errors/AppError";
import { RdoRepository, defaultRdoRepository } from "../infrastructure/rdo-repository";

export async function deleteRdo(
  id: number,
  repo: RdoRepository = defaultRdoRepository
): Promise<boolean> {
  if (!id || id <= 0) {
    throw AppError.badRequest("ID inválido para exclusão do RDO.");
  }
  const success = await repo.delete(id);
  if (!success) {
    throw AppError.internal("Falha ao excluir RDO.");
  }
  return true;
}

