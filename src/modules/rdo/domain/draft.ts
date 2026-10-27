/**
 * Pure domain rules for the local RDO draft (persisted in the browser under RDO_DRAFT_KEY).
 */

export const RDO_DRAFT_KEY = "rdo_draft_v1";

export interface RdoDraftLike {
  projectId?: number | null;
  date?: string | null;
  ownTeamCount?: number | string | null;
  observations?: string | null;
  contractors?: unknown[] | null;
  activities?: Array<{ description?: string | null; location?: string | null } | null> | null;
  nonConformities?: unknown[] | null;
  occurrences?: unknown[] | null;
  photos?: unknown[] | null;
}

const nonEmpty = (v: unknown) => Array.isArray(v) && v.length > 0;

/**
 * A draft is worth keeping only if the user actually filled something in.
 * Untouched defaults (date, weather, work condition, one blank activity) do not count.
 */
export function hasDraftContent(draft: RdoDraftLike | null | undefined): boolean {
  if (!draft || typeof draft !== "object") return false;
  return (
    Boolean(draft.observations?.trim()) ||
    (parseInt(String(draft.ownTeamCount ?? 0), 10) || 0) > 0 ||
    nonEmpty(draft.contractors) ||
    (Array.isArray(draft.activities) &&
      draft.activities.some((a) => Boolean(a?.description?.trim()) || Boolean(a?.location?.trim()))) ||
    nonEmpty(draft.nonConformities) ||
    nonEmpty(draft.occurrences) ||
    nonEmpty(draft.photos)
  );
}

/** Legacy drafts saved without projectId are treated as belonging to any project. */
export function isDraftForProject(draft: RdoDraftLike | null | undefined, projectId: number | null | undefined): boolean {
  if (!draft) return false;
  if (draft.projectId == null || projectId == null) return true;
  return Number(draft.projectId) === Number(projectId);
}

export type DraftConflict = "none" | "other_project" | "other_date";

/**
 * Decides whether opening a new RDO would collide with an existing draft.
 * Since only one draft slot exists, starting a different RDO would overwrite it,
 * so the user must choose between resuming and discarding.
 */
export function getDraftConflict(
  draft: RdoDraftLike | null | undefined,
  context: { projectId?: number | null; initialDate?: string | null }
): DraftConflict {
  if (!hasDraftContent(draft)) return "none";
  if (!isDraftForProject(draft, context.projectId)) return "other_project";
  if (context.initialDate && draft!.date && draft!.date !== context.initialDate) return "other_date";
  return "none";
}

/** Parses the raw localStorage value, returning null for missing or corrupt data. */
export function parseDraft(raw: string | null | undefined): RdoDraftLike | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}
