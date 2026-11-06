/**
 * Pure rules for the activities shown in the Workspace (Espaço de trabalho):
 * visits registered in the system, eSocial events imported from ESO and manual deliveries of the team.
 */

export const ACTIVITY_SOURCES = {
  visita: "Visita",
  eso: "ESO",
  manual: "Manual",
} as const;

/** Status of manual activities and ESO records. */
export const ACTIVITY_STATUS = {
  completed: "Concluído",
  pending: "Pendente",
  overdue: "Em atraso",
} as const;

/** Status of visits. */
export const VISIT_STATUS = {
  agendada: "Agendada",
  realizada: "Realizada",
  cancelada: "Cancelada",
} as const;

export const VISIT_TYPES = {
  tecnica: "Visita técnica",
  inspecao: "Inspeção de segurança",
  auditoria: "Auditoria",
  reuniao: "Reunião com cliente",
  treinamento: "Treinamento / DDS",
} as const;

export const ACTIVITY_CATEGORIES = [
  "Visita técnica",
  "Programas gerados",
  "Revisões",
  "Envios",
  "Documentação técnica",
  "Treinamentos",
  "Outras atividades",
] as const;

export const ESO_EVENT_CODES = ["S-2210", "S-2220", "S-2240"] as const;

export type ActivitySource = keyof typeof ACTIVITY_SOURCES;
export type VisitStatus = keyof typeof VISIT_STATUS;
export type VisitType = keyof typeof VISIT_TYPES;
export type ActivityStatus = keyof typeof ACTIVITY_STATUS | VisitStatus;

export const TEXT_MAX_LENGTH = 180;
export const NOTES_MAX_LENGTH = 2000;
export const QUANTITY_MAX = 1_000_000;
export const VISIT_PHOTOS_MAX = 4;

/** Sources registered inside the system (ESO is imported). */
export const isSystemSource = (source: ActivitySource) => source !== "eso";

export const statusLabel = (status: string) =>
  (ACTIVITY_STATUS as Record<string, string>)[status] ?? (VISIT_STATUS as Record<string, string>)[status] ?? status;

export interface ActivityInput {
  occurredOn: string; // YYYY-MM-DD
  company: string;
  collaboratorId?: number | null; // system user (visits and manual activities)
  collaborator?: string; // name; for ESO it comes from the file, otherwise from the user record
  category?: string;
  quantity?: number;
  submittedQuantity?: number; // ESO only: events already submitted
  status: ActivityStatus;
  notes?: string | null; // manual: observação · visita: resultado
  eventCode?: string | null; // ESO only
  externalId?: string | null; // ESO only: identifier in the source file
  projectId?: number | null; // visita: obra (optional)
  projectName?: string | null;
  visitType?: VisitType | null;
  objective?: string | null;
}

export interface Activity {
  id: number;
  source: ActivitySource;
  externalId: string | null;
  occurredOn: string;
  company: string;
  collaboratorId: number | null;
  collaborator: string;
  category: string;
  eventCode: string | null;
  quantity: number;
  submittedQuantity: number;
  status: ActivityStatus;
  notes: string | null;
  projectId: number | null;
  projectName: string | null;
  visitType: VisitType | null;
  objective: string | null;
  photoCount: number;
}

/** Normalized activity, ready to be persisted. */
export type ActivityRecord = Omit<Activity, "id" | "photoCount">;

export type ActivityErrors = Partial<Record<keyof ActivityInput | "photos", string>>;

export interface ActivityFilters {
  from?: string;
  to?: string;
  company?: string;
  collaborator?: string;
  source?: ActivitySource;
  search?: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const d = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Current date (YYYY-MM-DD) in the team's time zone. */
export function todayInSaoPaulo(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

const shortText = (v: unknown) =>
  typeof v === "string" && v.trim().length > 0 && v.trim().length <= TEXT_MAX_LENGTH;

/**
 * Validates an activity for the given source.
 * - visita: system user, visit type, objective and visit status; a visit cannot be "realizada" in the future.
 * - manual: system user, one of the known categories and a quantity.
 * - eso: collaborator name, event code, submitted total and the file identifier.
 * `today` (YYYY-MM-DD) enables the date rule of visits.
 */
export function validateActivity(
  input: Partial<ActivityInput>,
  source: ActivitySource,
  today?: string
): { isValid: boolean; errors: ActivityErrors } {
  const errors: ActivityErrors = {};
  const textError = `Até ${TEXT_MAX_LENGTH} caracteres.`;

  if (!isIsoDate(input.occurredOn)) errors.occurredOn = "Informe uma data válida.";
  if (!shortText(input.company)) errors.company = `Informe a empresa. ${textError}`;

  if (isSystemSource(source)) {
    if (!Number.isInteger(input.collaboratorId) || input.collaboratorId! <= 0) errors.collaboratorId = "Selecione o colaborador.";
  } else if (!shortText(input.collaborator)) {
    errors.collaborator = `Informe o colaborador. ${textError}`;
  }

  if (source === "visita") {
    if (!input.visitType || !(input.visitType in VISIT_TYPES)) errors.visitType = "Selecione o tipo de visita.";
    if (typeof input.objective !== "string" || input.objective.trim().length < 5) errors.objective = "Descreva o objetivo da visita.";
    else if (input.objective.length > NOTES_MAX_LENGTH) errors.objective = "O objetivo deve ter até 2.000 caracteres.";
    if (!input.status || !(input.status in VISIT_STATUS)) errors.status = "Situação inválida.";
    else if (today && input.status === "realizada" && isIsoDate(input.occurredOn) && input.occurredOn > today)
      errors.status = "Uma visita futura não pode estar realizada.";
    if (input.projectId != null && (!Number.isInteger(input.projectId) || input.projectId <= 0)) errors.projectId = "Obra inválida.";
  } else {
    if (!shortText(input.category)) errors.category = "Selecione a categoria.";
    else if (source === "manual" && !(ACTIVITY_CATEGORIES as readonly string[]).includes(input.category!.trim()))
      errors.category = "Selecione uma categoria de atividade.";

    const quantity = Number(input.quantity);
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > QUANTITY_MAX)
      errors.quantity = "A quantidade deve ser um inteiro entre 1 e 1.000.000.";

    if (!input.status || !(input.status in ACTIVITY_STATUS)) errors.status = "Situação inválida.";
  }

  if (source === "eso") {
    const quantity = Number(input.quantity);
    const submitted = Number(input.submittedQuantity);
    if (!Number.isSafeInteger(submitted) || submitted < 0 || (!errors.quantity && submitted > quantity))
      errors.submittedQuantity = "Eventos enviados devem estar entre zero e o total informado.";
    if (!(ESO_EVENT_CODES as readonly string[]).includes(input.eventCode ?? ""))
      errors.eventCode = `O evento deve ser ${ESO_EVENT_CODES.join(", ")}.`;
    if (!shortText(input.externalId)) errors.externalId = "Informe o identificador do registro na origem.";
  }

  if ((input.notes ?? "").length > NOTES_MAX_LENGTH) errors.notes = "O texto deve ter até 2.000 caracteres.";

  return { isValid: Object.keys(errors).length === 0, errors };
}

/**
 * Trims texts and keeps only the fields that belong to the source. Call after `validateActivity`;
 * for visits and manual activities `input.collaborator` must hold the name of the selected user.
 */
export function normalizeActivity(input: ActivityInput, source: ActivitySource): ActivityRecord {
  const visit = source === "visita";
  return {
    source,
    externalId: source === "eso" ? input.externalId!.trim() : null,
    occurredOn: input.occurredOn,
    company: input.company.trim(),
    collaboratorId: input.collaboratorId ?? null,
    collaborator: (input.collaborator ?? "").trim(),
    category: visit ? VISIT_TYPES[input.visitType!] : input.category!.trim(),
    eventCode: source === "eso" ? input.eventCode! : null,
    quantity: visit ? 1 : Number(input.quantity),
    submittedQuantity: source === "eso" ? Number(input.submittedQuantity) : 0,
    status: input.status,
    notes: input.notes?.trim() || null,
    projectId: visit ? input.projectId ?? null : null,
    projectName: visit ? input.projectName?.trim() || null : null,
    visitType: visit ? input.visitType! : null,
    objective: visit ? input.objective!.trim() : null,
  };
}

/** Counts only what was actually done: visits "realizada", manual/ESO records of any status. */
const counts = (r: ActivityRecord) => r.source !== "visita" || r.status === "realizada";

export function filterActivities<T extends ActivityRecord>(rows: T[], f: ActivityFilters): T[] {
  const search = f.search?.trim().toLocaleLowerCase("pt-BR");
  return rows.filter(
    (r) =>
      (!f.from || r.occurredOn >= f.from) &&
      (!f.to || r.occurredOn <= f.to) &&
      (!f.company || r.company === f.company) &&
      (!f.collaborator || r.collaborator === f.collaborator) &&
      (!f.source || r.source === f.source) &&
      (!search ||
        `${r.company} ${r.collaborator} ${r.category} ${r.eventCode ?? ""} ${r.notes ?? ""} ${r.objective ?? ""} ${r.projectName ?? ""}`
          .toLocaleLowerCase("pt-BR")
          .includes(search))
  );
}

export interface ActivitySummary {
  visits: number; // visits carried out
  scheduledVisits: number; // visits still scheduled
  informed: number; // ESO events informed
  submitted: number; // ESO events submitted
  manual: number; // units registered manually
  sendRate: number | null; // % of informed ESO events already submitted
}

export function summarizeActivities(rows: ActivityRecord[]): ActivitySummary {
  let visits = 0, scheduledVisits = 0, informed = 0, submitted = 0, manual = 0;
  for (const r of rows) {
    if (r.source === "visita") {
      if (r.status === "realizada") visits += r.quantity;
      else if (r.status === "agendada") scheduledVisits += r.quantity;
    } else if (r.source === "eso") {
      informed += r.quantity;
      submitted += r.submittedQuantity;
    } else if (r.source === "manual") manual += r.quantity;
  }
  return {
    visits,
    scheduledVisits,
    informed,
    submitted,
    manual,
    sendRate: informed ? Math.round((submitted / informed) * 100) : null,
  };
}

/** Sum of quantities per value of `key`, largest first (scheduled/cancelled visits are not counted). */
export function groupQuantities(
  rows: ActivityRecord[],
  key: "category" | "company" | "collaborator"
): { name: string; quantity: number }[] {
  const totals = new Map<string, number>();
  for (const r of rows) if (counts(r)) totals.set(r[key], (totals.get(r[key]) ?? 0) + r.quantity);
  return [...totals]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name, "pt-BR"));
}

export function distinctValues<T, K extends keyof T>(rows: T[], key: K): string[] {
  return [...new Set(rows.map((r) => String(r[key])))].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export type WeeklyTrendPoint = { weekStart: string } & Record<ActivitySource, number>;

/** Quantities per ISO week (starting on Monday) and source, oldest first. */
export function weeklyTrend(rows: ActivityRecord[]): WeeklyTrendPoint[] {
  const weeks = new Map<string, WeeklyTrendPoint>();
  for (const r of rows) {
    if (!counts(r)) continue;
    const d = new Date(`${r.occurredOn}T12:00:00Z`);
    const day = d.getUTCDay();
    d.setUTCDate(d.getUTCDate() - (day === 0 ? 6 : day - 1));
    const weekStart = d.toISOString().slice(0, 10);
    const point = weeks.get(weekStart) ?? { weekStart, visita: 0, eso: 0, manual: 0 };
    point[r.source] += r.quantity;
    weeks.set(weekStart, point);
  }
  return [...weeks.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

/** Scheduled visits from `today` on, soonest first. */
export function upcomingVisits<T extends ActivityRecord>(rows: T[], today: string, limit = 8): T[] {
  return rows
    .filter((r) => r.source === "visita" && r.status === "agendada" && r.occurredOn >= today)
    .sort((a, b) => a.occurredOn.localeCompare(b.occurredOn) || a.collaborator.localeCompare(b.collaborator, "pt-BR"))
    .slice(0, limit);
}

/** CSV (semicolon, UTF-8 BOM) of the given activities. Cells starting with = + - @ are escaped. */
export function activitiesToCsv(rows: ActivityRecord[]): string {
  const cell = (v: unknown) => {
    let s = String(v ?? "");
    if (/^\s*[=+@-]/.test(s)) s = `'${s}`;
    return `"${s.replaceAll('"', '""')}"`;
  };
  const header = ["Data", "Empresa", "Obra", "Colaborador", "Categoria", "Evento", "Quantidade", "Eventos enviados", "Situação", "Origem", "Objetivo", "Observação / resultado"];
  const lines = rows.map((r) => [
    r.occurredOn,
    r.company,
    r.projectName,
    r.collaborator,
    r.category,
    r.eventCode,
    r.quantity,
    r.submittedQuantity,
    statusLabel(r.status),
    ACTIVITY_SOURCES[r.source],
    r.objective,
    r.notes,
  ]);
  return "﻿" + [header, ...lines].map((line) => line.map(cell).join(";")).join("\r\n");
}
