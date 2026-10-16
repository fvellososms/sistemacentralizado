import { AppError } from "@/shared/errors/AppError";
import { RdoRepository, defaultRdoRepository } from "../infrastructure/rdo-repository";

export async function deletePhoto(
  id: number,
  repo: RdoRepository = defaultRdoRepository
): Promise<boolean> {
  if (!id || id <= 0) {
    throw AppError.badRequest("ID inválido para exclusão da foto.");
  }
  const success = await repo.deletePhoto(id);
  if (!success) {
    throw AppError.internal("Falha ao excluir foto.");
  }
  return true;
}

