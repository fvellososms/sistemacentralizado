import type { DayStatus } from "./types";
import type { ShiftConditions } from "./rules";

/**
 * Calculates total headcount (own team + all contractors).
 */
export function calculateTotalWorkers(
  ownCount: number | string | undefined | null,
  contractors: Array<{ workerCount?: number | string }> = []
): number {
  const own = parseInt(String(ownCount ?? 0), 10) || 0;
  const contractorCount = contractors.reduce(
    (sum: number, c) => sum + (parseInt(String(c?.workerCount ?? 0), 10) || 0),
    0
  );
  return own + contractorCount;
}

/**
 * Returns standard working hours according to the day's status:
 * - trabalhando: 8 hours
 * - paralisado_chuva: 4 hours
 * - nao_trabalhando: 0 hours
 */
export function calculateStandardHours(dayStatus: DayStatus = "trabalhando"): number {
  if (dayStatus === "paralisado_chuva") return 4;
  if (dayStatus === "nao_trabalhando") return 0;
  return 8;
}

/** Standard hours by shift: 8h with both shifts practicable, 4h with one impracticable, 0h with both. */
export function calculateStandardHoursByShift(shifts: ShiftConditions): number {
  const impracticable = [shifts.workConditionMorning, shifts.workConditionAfternoon].filter(
    (c) => c === "impraticavel"
  ).length;
  return 8 - 4 * impracticable;
}

/**
 * Sums all overtime hours across activities flagged with hasOvertime.
 */
export function calculateTotalOvertime(
  activities: Array<{ hasOvertime?: boolean; overtimeHours?: number | string }> = []
): number {
  return activities.reduce((sum: number, act) => {
    if (act?.hasOvertime) {
      const hours = parseFloat(String(act.overtimeHours ?? 0)) || 0;
      return sum + hours;
    }
    return sum;
  }, 0);
}

/**
 * Computes Total HH (Homens-Hora):
 * HH = (totalWorkers * standardHours) + overtimeSum (if totalWorkers > 0)
 * Standard hours come from the shift conditions when given, otherwise from the day status.
 * Returns formatted as a fixed decimal string (e.g. "16.0")
 */
export function calculateTotalHh(params: ShiftConditions & {
  dayStatus?: DayStatus;
  ownTeamCount?: number | string;
  contractors?: Array<{ workerCount?: number | string }>;
  activities?: Array<{ hasOvertime?: boolean; overtimeHours?: number | string }>;
}): string {
  const totalWorkers = calculateTotalWorkers(params.ownTeamCount, params.contractors);
  const hasShifts = params.workConditionMorning != null || params.workConditionAfternoon != null;
  const standardHours = hasShifts ? calculateStandardHoursByShift(params) : calculateStandardHours(params.dayStatus);
  const overtimeSum = calculateTotalOvertime(params.activities);

  const totalHhNum = totalWorkers * standardHours + (totalWorkers > 0 ? overtimeSum : 0);
  return totalHhNum.toFixed(1);
}
