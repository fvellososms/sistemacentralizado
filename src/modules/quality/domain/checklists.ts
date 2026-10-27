/**
 * Pure domain rules for checklist compliance and overdue inspection calculations.
 */

export type ChecklistItemStatus = "conforme" | "nao_conforme" | "nao_se_aplica" | "pendente" | string;

export interface ChecklistItemRecord {
  id?: number | string;
  checklistId?: number | string;
  status: ChecklistItemStatus;
}

export interface ChecklistComplianceResult {
  percentage: number | null;
  conformCount: number;
  nonConformCount: number;
  evaluatedCount: number;
}

/**
 * Calculates Checklist Compliance percentage (RN):
 * Conformidade (%) = (Itens conformes / Total de itens avaliados) × 100
 * Only items explicitly 'conforme' or 'nao_conforme' are considered evaluated.
 * 'nao_se_aplica' and unanswered/pending are excluded.
 * Returns null if no items were evaluated (to avoid showing fake/fictitious 0% or 100%).
 */
export function calculateChecklistCompliance(
  items: ChecklistItemRecord[]
): ChecklistComplianceResult {
  if (!items || items.length === 0) {
    return {
      percentage: null,
      conformCount: 0,
      nonConformCount: 0,
      evaluatedCount: 0,
    };
  }

  // Deduplicate by item id or unique checklistId+id if present
  const seenIds = new Set<string>();
  let conformCount = 0;
  let nonConformCount = 0;

  for (const item of items) {
    if (item.id != null) {
      const key = `${item.checklistId ?? ""}_${item.id}`;
      if (seenIds.has(key)) continue;
      seenIds.add(key);
    }

    const s = String(item.status || "").trim().toLowerCase();
    if (s === "conforme" || s === "c" || s === "confort") {
      conformCount++;
    } else if (s === "nao_conforme" || s === "não conforme" || s === "nc") {
      nonConformCount++;
    }
    // "nao_se_aplica", "na", null, undefined, "pendente" are strictly ignored
  }

  const evaluatedCount = conformCount + nonConformCount;
  if (evaluatedCount === 0) {
    return {
      percentage: null,
      conformCount: 0,
      nonConformCount: 0,
      evaluatedCount: 0,
    };
  }

  const rawPercent = (conformCount / evaluatedCount) * 100;
  return {
    percentage: Math.round(rawPercent),
    conformCount,
    nonConformCount,
    evaluatedCount,
  };
}

export interface InspectionScheduleRecord {
  id: number | string;
  dataLimite: string | Date;
  concluidaEm?: string | Date | null;
  status?: "concluida" | "pendente" | "cancelada" | string;
}

/**
 * Calculates overdue inspections:
 * An inspection is overdue if:
 * 1. Has a scheduled deadline (dataLimite).
 * 2. Deadline is strictly before referenceDate.
 * 3. Inspection is not concluded (concluidaEm is null and status is not "concluida").
 */
export function calculateOverdueInspections(
  inspections: InspectionScheduleRecord[],
  referenceDate: Date = new Date()
): { overdueCount: number; totalPending: number } {
  if (!inspections || inspections.length === 0) {
    return { overdueCount: 0, totalPending: 0 };
  }

  const refTime = referenceDate.getTime();
  let overdueCount = 0;
  let totalPending = 0;

  for (const insp of inspections) {
    const isCompleted =
      Boolean(insp.concluidaEm) ||
      insp.status?.toLowerCase() === "concluida" ||
      insp.status?.toLowerCase() === "cancelada";

    if (isCompleted) continue;

    totalPending++;

    if (insp.dataLimite) {
      const limit = new Date(insp.dataLimite).getTime();
      if (!Number.isNaN(limit) && limit < refTime) {
        overdueCount++;
      }
    }
  }

  return { overdueCount, totalPending };
}

