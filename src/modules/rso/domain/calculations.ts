import type { RsoSummary } from "./types";

export interface RdoForSummary {
  dayStatus?: string | null;
  totalHh?: string | number | null;
  totalHeadcount?: number | null;
}

/**
 * Calculates weekly consolidated metrics (RN02/RN14):
 * - totalRdos
 * - totalDaysWorked (dayStatus === 'trabalhando')
 * - totalDaysHalted (dayStatus === 'paralisado_chuva')
 * - totalHh (sum of all daily totalHh, fixed to 1 decimal)
 * - totalOccurrences
 * - avgHeadcount (rounded mean of daily totalHeadcount)
 */
export function calculateRsoSummary(
  rdos: RdoForSummary[] = [],
  occurrencesCount = 0
): RsoSummary {
  const totalRdos = rdos.length;
  const totalDaysWorked = rdos.filter((r) => r.dayStatus === "trabalhando").length;
  const totalDaysHalted = rdos.filter((r) => r.dayStatus === "paralisado_chuva").length;
  const totalHhNum = rdos.reduce((acc, r) => acc + (parseFloat(String(r.totalHh ?? 0)) || 0), 0);
  const avgHeadcount =
    totalRdos > 0
      ? Math.round(
          rdos.reduce((acc, r) => acc + (r.totalHeadcount || 0), 0) / totalRdos
        )
      : 0;

  return {
    totalRdos,
    totalDaysWorked,
    totalDaysHalted,
    totalHh: totalHhNum.toFixed(1),
    totalOccurrences: occurrencesCount,
    avgHeadcount,
  };
}

