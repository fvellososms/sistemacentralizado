import { AppError } from "@/shared/errors/AppError";
import { calculateTotalHh, calculateTotalWorkers } from "../domain/calculations";
import { computeDayOfWeek, validateRdoCreation } from "../domain/rules";
import type { CreateRdoInput } from "../domain/types";
import { RdoRepository, defaultRdoRepository } from "../infrastructure/rdo-repository";

export async function createRdo(
  input: CreateRdoInput,
  repo: RdoRepository = defaultRdoRepository
) {
  const validation = validateRdoCreation(input);
  if (!validation.isValid) {
    throw AppError.badRequest(validation.errors.join("; "));
  }

  const dayOfWeek = computeDayOfWeek(input.date);
  const ownCount = parseInt(String(input.ownTeamCount ?? 0), 10) || 0;
  const contractors = Array.isArray(input.contractors) ? input.contractors : [];
  const contractorCount = contractors.reduce(
    (sum: number, c) => sum + (parseInt(String(c?.workerCount ?? 0), 10) || 0),
    0
  );
  const totalHeadcount = ownCount + contractorCount;

  const totalHh = input.totalHh
    ? String(input.totalHh)
    : calculateTotalHh({
        dayStatus: input.dayStatus,
        ownTeamCount: ownCount,
        contractors,
        activities: input.activities,
      });

  const nextRdoNumber = await repo.getNextRdoNumber(input.projectId);

  const created = await repo.create({
    ...input,
    rdoNumber: nextRdoNumber,
    dayOfWeek,
    totalHh,
    totalHeadcount,
    contractorTeamCount: contractorCount,
    ownTeamCount: ownCount,
  });

  return created;
}

