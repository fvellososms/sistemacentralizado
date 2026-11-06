import { AppError } from "@/shared/errors/AppError";

/** Parses the numeric [id] of a dynamic route. Only plain digits are accepted ("5.png" or "5abc" are not 5). */
export async function parseIdParam(params: Promise<{ id: string }>): Promise<number> {
  const raw = (await params).id;
  const id = /^\d{1,9}$/.test(raw) ? Number(raw) : NaN;
  if (!Number.isSafeInteger(id) || id <= 0) throw AppError.badRequest("Requisição inválida.");
  return id;
}
