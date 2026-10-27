/**
 * Pure domain rules for calculating Top 3 NRs with non-conformities.
 */

export interface NonConformityRecord {
  id?: number | string;
  nr?: string | null;
  description?: string;
}

export interface TopNrItem {
  rank: number;
  nr: string;
  count: number;
}

/**
 * Normalizes an NR string like "NR 18", "nr-18", "NR-18 - Construção Civil" into canonical "NR-18".
 */
export function normalizeNr(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/^NR[- ]?(\d+)/i);
  if (match) {
    return `NR-${match[1]}`;
  }
  return trimmed;
}

/**
 * Calculates top 3 NRs with non-conformities.
 * Rules:
 * - Only consider non-conformities with an explicit, non-empty NR field.
 * - Split multiple NRs if separated by comma or slash (e.g. "NR-18, NR-35").
 * - Do not double-count the same NR for a single non-conformity.
 * - Sort by count descending, then alphabetically by NR code for stable tie-breaking.
 * - Return at most the top 3 items.
 */
export function calculateTopNrs(
  records: NonConformityRecord[]
): TopNrItem[] {
  if (!records || records.length === 0) {
    return [];
  }

  const nrCountMap = new Map<string, number>();

  for (const item of records) {
    if (!item.nr || !item.nr.trim() || item.nr === "Outra") continue;

    // Split multiple NRs if comma-separated, e.g. "NR-18, NR-35"
    const parts = item.nr.split(/[,;/]+/);
    const uniqueNrsForRecord = new Set<string>();

    for (const part of parts) {
      const canonical = normalizeNr(part);
      if (canonical && canonical.toUpperCase().startsWith("NR")) {
        uniqueNrsForRecord.add(canonical.toUpperCase());
      }
    }

    for (const nr of uniqueNrsForRecord) {
      nrCountMap.set(nr, (nrCountMap.get(nr) ?? 0) + 1);
    }
  }

  // Sort: count descending, then alphabetical for ties
  const sorted = Array.from(nrCountMap.entries()).sort((a, b) => {
    if (b[1] !== a[1]) {
      return b[1] - a[1];
    }
    return a[0].localeCompare(b[0]);
  });

  return sorted.slice(0, 3).map(([nr, count], idx) => ({
    rank: idx + 1,
    nr,
    count,
  }));
}

