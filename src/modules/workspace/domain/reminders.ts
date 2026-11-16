/**
 * Personal reminders of the Workspace calendar, and the month grid that also shows the task deadlines.
 * Pure rules: no database, no React.
 */

import { NOTES_MAX_LENGTH, TEXT_MAX_LENGTH, isIsoDate } from "./activities.ts";

export interface ReminderInput {
  title: string;
  date: string; // YYYY-MM-DD
  time?: string | null; // HH:MM, optional
  notes?: string | null;
}

export interface Reminder {
  id: number;
  title: string;
  date: string;
  time: string | null;
  notes: string | null;
  done: boolean;
  doneAt: string | null;
  createdAt: string;
}

export type ReminderRecord = Pick<Reminder, "title" | "date" | "time" | "notes">;
export type ReminderErrors = Partial<Record<keyof ReminderInput, string>>;
export type ReminderState = "feito" | "atrasado" | "hoje" | "proximo";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validateReminder(input: Partial<ReminderInput>): { isValid: boolean; errors: ReminderErrors } {
  const errors: ReminderErrors = {};
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!title || title.length > TEXT_MAX_LENGTH) errors.title = `Informe o lembrete (até ${TEXT_MAX_LENGTH} caracteres).`;
  if (!isIsoDate(input.date)) errors.date = "Informe uma data válida.";
  if (input.time && (typeof input.time !== "string" || !TIME_RE.test(input.time))) errors.time = "Informe um horário válido.";
  if (input.notes !== undefined && input.notes !== null && (typeof input.notes !== "string" || input.notes.length > NOTES_MAX_LENGTH))
    errors.notes = `A observação deve ter até ${NOTES_MAX_LENGTH} caracteres.`;
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function normalizeReminder(input: ReminderInput): ReminderRecord {
  return {
    title: input.title.trim(),
    date: input.date,
    time: input.time || null,
    notes: input.notes?.trim() || null,
  };
}

export function reminderState(reminder: Pick<Reminder, "date" | "done">, today: string): ReminderState {
  if (reminder.done) return "feito";
  if (reminder.date < today) return "atrasado";
  return reminder.date === today ? "hoje" : "proximo";
}

/** By date, then time (reminders without time first, as they stand for the whole day). */
export function sortReminders<T extends Pick<Reminder, "date" | "time" | "id">>(reminders: T[]): T[] {
  return [...reminders].sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? "") || a.id - b.id);
}

export interface ReminderSummary {
  atrasados: number;
  hoje: number;
  /** Late and today's open reminders, the ones the site points out. */
  alertas: Reminder[];
}

export function summarizeReminders(reminders: Reminder[], today: string): ReminderSummary {
  const alertas = sortReminders(reminders.filter((r) => ["atrasado", "hoje"].includes(reminderState(r, today))));
  const atrasados = alertas.filter((r) => r.date < today).length;
  return { atrasados, hoje: alertas.length - atrasados, alertas };
}

/** "2026-11" + n months. */
export function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

/**
 * Weeks (Sunday first) covering the month, as ISO dates. Days of the neighbor months complete
 * the first and last weeks, as in a printed calendar.
 */
export function monthGrid(month: string): string[][] {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const start = new Date(first);
  start.setUTCDate(1 - first.getUTCDay());
  const lastDay = new Date(Date.UTC(y, m, 0));
  const weeks: string[][] = [];
  for (const d = new Date(start); d <= lastDay || weeks.length === 0 || weeks[weeks.length - 1].length < 7; ) {
    if (!weeks.length || weeks[weeks.length - 1].length === 7) weeks.push([]);
    weeks[weeks.length - 1].push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return weeks;
}
