/**
 * Pure helpers shared by every generated document (RDO, RSO, APR, NC): codes, file names and dates.
 */

/** Removes accents and anything that is not safe in a file name or document code. */
export function toCodeSegment(value: string | number | null | undefined): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "")
    .toUpperCase();
}

/** "RDO", "HM-01", 139 → "RDO-HM01-0139". Empty segments are skipped. */
export function buildDocumentCode(prefix: string, projectCode?: string | null, number?: number | string | null): string {
  const numberPart =
    typeof number === "number" || /^\d+$/.test(String(number ?? "")) ? String(number).padStart(4, "0") : toCodeSegment(number);
  return [toCodeSegment(prefix), toCodeSegment(projectCode), numberPart].filter(Boolean).join("-");
}

/** "RDO-HM01-0139", "2026-10-20" → "RDO-HM01-0139_2026-10-20.pdf" */
export function buildDocumentFileName(code: string, date?: string | null): string {
  const safeCode = code.replace(/[^A-Za-z0-9-]+/g, "") || "DOCUMENTO";
  const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(date ?? "") ? `_${date}` : "";
  return `${safeCode}${safeDate}.pdf`;
}

/** "2026-10-20" (or an ISO timestamp) → "20/10/2026"; empty values → "—". */
export function formatDocumentDate(value: string | null | undefined): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? "");
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "—";
}

/** Date and time in the team's time zone, e.g. "20/10/2026 14:05". */
export function formatDocumentDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(date)
    .replace(",", "");
}
