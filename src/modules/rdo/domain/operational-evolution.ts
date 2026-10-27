/**
 * Pure domain rules for calculating weekly operational workforce evolution (Evolução Operacional).
 */

export interface DailyHeadcountRecord {
  date: string; // YYYY-MM-DD
  totalHeadcount: number;
}

export interface WeeklyEvolutionItem {
  weekKey: string;
  weekLabel: string; // "Sem. 1", "Sem. 2", etc.
  startDate: string; // YYYY-MM-DD (Monday)
  endDate: string; // YYYY-MM-DD (Sunday)
  averageHeadcount: number;
  daysRecorded: number;
}

/**
 * Returns the Monday UTC Date for a given YYYY-MM-DD string.
 */
export function getMondayOfWeek(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const day = date.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = (day === 0 ? -6 : 1) - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return date;
}

function formatDateUtc(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Consolidates daily headcount records into chronologically sorted weekly averages.
 * Rules:
 * - Weeks start on Monday.
 * - Days without records are excluded from the divisor (not counted as 0).
 * - Multiple records on the exact same date are deduplicated by taking the daily average.
 * - Chronological ordering.
 */
export function calculateOperationalEvolution(
  records: DailyHeadcountRecord[]
): WeeklyEvolutionItem[] {
  if (!records || records.length === 0) {
    return [];
  }

  // 1. Deduplicate by date (average if multiple records on same day)
  const dailyMap = new Map<string, { sum: number; count: number }>();
  for (const r of records) {
    if (!r.date) continue;
    const count = Number(r.totalHeadcount) || 0;
    const current = dailyMap.get(r.date) ?? { sum: 0, count: 0 };
    dailyMap.set(r.date, {
      sum: current.sum + count,
      count: current.count + 1,
    });
  }

  // 2. Group deduplicated daily averages into weeks (Monday to Sunday)
  const weeksMap = new Map<
    string,
    { mondayStr: string; sundayStr: string; headcounts: number[] }
  >();

  for (const [dateStr, val] of dailyMap.entries()) {
    const dailyAvg = val.sum / val.count;
    const monday = getMondayOfWeek(dateStr);
    const mondayStr = formatDateUtc(monday);

    const sunday = new Date(monday);
    sunday.setUTCDate(sunday.getUTCDate() + 6);
    const sundayStr = formatDateUtc(sunday);

    const currentWeek = weeksMap.get(mondayStr) ?? {
      mondayStr,
      sundayStr,
      headcounts: [],
    };
    currentWeek.headcounts.push(dailyAvg);
    weeksMap.set(mondayStr, currentWeek);
  }

  // 3. Sort weeks chronologically
  const sortedMondays = Array.from(weeksMap.keys()).sort();

  return sortedMondays.map((mondayStr, index) => {
    const item = weeksMap.get(mondayStr)!;
    const total = item.headcounts.reduce((acc, h) => acc + h, 0);
    const daysRecorded = item.headcounts.length;
    const avg = daysRecorded > 0 ? Math.round((total / daysRecorded) * 10) / 10 : 0;

    return {
      weekKey: mondayStr,
      weekLabel: `Sem. ${index + 1}`,
      startDate: item.mondayStr,
      endDate: item.sundayStr,
      averageHeadcount: avg,
      daysRecorded,
    };
  });
}

