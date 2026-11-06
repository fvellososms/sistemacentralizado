import { AppError } from "@/shared/errors/AppError";
import { calculateTotalHh } from "../domain/calculations";
import { resolveDayConditions } from "../domain/rules";
import { RdoRepository, defaultRdoRepository } from "../infrastructure/rdo-repository";

export async function updateRdo(
  id: number,
  body: any,
  repo: RdoRepository = defaultRdoRepository
) {
  if (!id || isNaN(id)) {
    throw AppError.badRequest("ID do RDO inválido.");
  }

  const existing = await repo.findById(id);
  if (!existing) {
    throw AppError.notFound("RDO não encontrado.");
  }

  const ownCount =
    body.ownTeamCount !== undefined
      ? parseInt(String(body.ownTeamCount), 10) || 0
      : existing.ownTeamCount || 0;

  const contractors = Array.isArray(body.contractors) ? body.contractors : null;
  const contractorCount = contractors
    ? contractors.reduce(
        (sum: number, c: { workerCount?: number | string }) =>
          sum + (parseInt(String(c?.workerCount ?? 0), 10) || 0),
        0
      )
    : existing.contractorTeamCount || 0;

  const totalHeadcount = ownCount + contractorCount;
  const hasShifts =
    body.workConditionMorning !== undefined || body.workConditionAfternoon !== undefined;
  const conditions = hasShifts
    ? resolveDayConditions({
        workConditionMorning: body.workConditionMorning ?? existing.workConditionMorning,
        workConditionAfternoon: body.workConditionAfternoon ?? existing.workConditionAfternoon,
      })
    : {};

  const resolvedActivities = Array.isArray(body.activities)
    ? body.activities
    : existing.activities || [];

  const totalHh = body.totalHh
    ? String(body.totalHh)
    : calculateTotalHh({
        dayStatus: body.dayStatus ?? existing.dayStatus,
        workConditionMorning: body.workConditionMorning ?? existing.workConditionMorning,
        workConditionAfternoon: body.workConditionAfternoon ?? existing.workConditionAfternoon,
        ...conditions,
        ownTeamCount: ownCount,
        contractors: contractors ?? existing.contractors ?? [],
        activities: resolvedActivities,
      });

  const updated = await repo.update(id, {
    ...body,
    ...conditions,
    ownTeamCount: ownCount,
    contractorTeamCount: contractorCount,
    totalHeadcount,
    totalHh,
  });

  if (!updated) {
    throw AppError.notFound("RDO não encontrado.");
  }

  return updated;
}
