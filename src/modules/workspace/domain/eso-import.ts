/**
 * Pure parsing of the ESO CSV export (one row per company/event, identified by `external_id`).
 */

import { validateActivity, type ActivityInput, type ActivityStatus } from "./activities.ts";

export const ESO_CSV_MAX_BYTES = 1_000_000;
export const ESO_IMPORT_MAX_ROWS = 5000;

export const ESO_CSV_COLUMNS = [
  "external_id",
  "occurred_on",
  "company",
  "collaborator",
  "category",
  "event_code",
  "quantity",
  "submitted_quantity",
  "status",
  "notes",
] as const;

const REQUIRED_COLUMNS = ESO_CSV_COLUMNS.filter((c) => c !== "notes");

export const ESO_CSV_TEMPLATE =
  `${ESO_CSV_COLUMNS.join(";")}\n` +
  "exemplo-001;2026-09-01;Empresa exemplo;Responsável exemplo;Eventos eSocial;S-2240;10;8;pending;Exemplo fictício\n";

/**
 * Minimal RFC 4180 parser: quoted cells, escaped quotes, CRLF/LF. The delimiter (";" or ",")
 * is detected from the header line. Blank lines are skipped.
 */
export function parseCsv(text: string): string[][] {
  const source = text.replace(/^﻿/, "");
  const headerLine = source.slice(0, source.search(/\r?\n|$/));
  const delimiter = headerLine.includes(";") ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"' && source[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === "") quoted = true;
    else if (ch === delimiter) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && source[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}

/** Converts the ESO CSV into activity inputs. Every invalid row is reported as "Linha N: ...". */
export function parseEsoCsv(text: string): { records: ActivityInput[]; errors: string[] } {
  const [header, ...lines] = parseCsv(text);
  if (!header) return { records: [], errors: ["O arquivo está vazio."] };

  const columns = header.map((h) => h.trim().toLowerCase());
  const missing = REQUIRED_COLUMNS.filter((c) => !columns.includes(c));
  if (missing.length) return { records: [], errors: [`Colunas ausentes: ${missing.join(", ")}. Confira o modelo.`] };
  if (lines.length > ESO_IMPORT_MAX_ROWS)
    return { records: [], errors: [`O arquivo deve ter até ${ESO_IMPORT_MAX_ROWS} registros por importação.`] };

  const records: ActivityInput[] = [];
  const errors: string[] = [];
  lines.forEach((cells, index) => {
    const get = (column: (typeof ESO_CSV_COLUMNS)[number]) => (cells[columns.indexOf(column)] ?? "").trim();
    const record: ActivityInput = {
      externalId: get("external_id"),
      occurredOn: get("occurred_on"),
      company: get("company"),
      collaborator: get("collaborator"),
      category: get("category"),
      eventCode: get("event_code"),
      quantity: Number(get("quantity")),
      submittedQuantity: Number(get("submitted_quantity")),
      status: get("status") as ActivityStatus,
      notes: get("notes"),
    };
    const { isValid, errors: rowErrors } = validateActivity(record, "eso");
    if (isValid) records.push(record);
    else errors.push(`Linha ${index + 2}: ${Object.values(rowErrors).join(" ")}`);
  });
  return { records, errors };
}
