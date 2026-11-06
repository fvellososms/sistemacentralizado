/**
 * Client companies offered as suggestions in the Workspace (task and activity forms, filters).
 * Companies typed in records are still accepted and added to the suggestions.
 */

export const WORKSPACE_CLIENT_COMPANIES: readonly string[] = [
  "PETMAX",
  "Hotel Marina",
  "Grupo CTV",
  "Tetris",
  "SUM Engenharia",
  "LSMG",
  "Origem ATTO",
  "ENGEPAR",
  "ECO Solution",
];

/**
 * Merges name lists into one alphabetical list without blanks or duplicates.
 * Names that differ only in case, accents or spacing count as the same; the first spelling wins.
 */
export function mergeNames(...lists: readonly (readonly string[])[]): string[] {
  const byKey = new Map<string, string>();
  for (const name of lists.flat()) {
    const clean = name.trim().replace(/\s+/g, " ");
    if (!clean) continue;
    const key = clean.normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase("pt-BR");
    if (!byKey.has(key)) byKey.set(key, clean);
  }
  return [...byKey.values()].sort((a, b) => a.localeCompare(b, "pt-BR"));
}
