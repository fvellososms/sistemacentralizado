/**
 * Pure rules for the Workspace task board (kanban per collaborator).
 */

import { ACTIVITY_CATEGORIES, NOTES_MAX_LENGTH, TEXT_MAX_LENGTH, isIsoDate } from "./activities.ts";

export const TASK_STAGES = {
  todo: "A fazer",
  doing: "Fazendo",
  done: "Feito!",
} as const;

export type TaskStage = keyof typeof TASK_STAGES;

export const TASK_STAGE_ORDER = Object.keys(TASK_STAGES) as TaskStage[];
export const DEFAULT_TASK_CATEGORY = "Outras atividades";

export interface TaskInput {
  title: string;
  company: string;
  collaboratorId: number; // system user responsible for the task
  collaborator?: string; // name, filled by the server from the user record
  category?: string;
  stage: TaskStage;
  dueDate?: string | null; // YYYY-MM-DD
  notes?: string | null;
}

export interface Task {
  id: number;
  title: string;
  company: string;
  collaboratorId: number | null;
  collaborator: string;
  category: string;
  stage: TaskStage;
  dueDate: string | null;
  notes: string | null;
  stageChangedAt: string; // ISO timestamp of the last stage change
  createdAt: string;
}

export type TaskRecord = Pick<Task, "title" | "company" | "collaboratorId" | "collaborator" | "category" | "stage" | "dueDate" | "notes">;
export type TaskErrors = Partial<Record<keyof TaskInput, string>>;

const shortText = (v: unknown) =>
  typeof v === "string" && v.trim().length > 0 && v.trim().length <= TEXT_MAX_LENGTH;

export function validateTask(input: Partial<TaskInput>): { isValid: boolean; errors: TaskErrors } {
  const errors: TaskErrors = {};
  const textError = `Até ${TEXT_MAX_LENGTH} caracteres.`;

  if (!shortText(input.title)) errors.title = `Informe a tarefa. ${textError}`;
  if (!shortText(input.company)) errors.company = `Informe a empresa. ${textError}`;
  if (!Number.isInteger(input.collaboratorId) || input.collaboratorId! <= 0) errors.collaboratorId = "Selecione o colaborador.";
  if (!input.stage || !(input.stage in TASK_STAGES)) errors.stage = "Etapa inválida.";
  if (!(ACTIVITY_CATEGORIES as readonly string[]).includes(input.category || DEFAULT_TASK_CATEGORY))
    errors.category = "Selecione um tipo de serviço.";
  if (input.dueDate && !isIsoDate(input.dueDate)) errors.dueDate = "Informe um prazo válido.";
  if ((input.notes ?? "").length > NOTES_MAX_LENGTH)
    errors.notes = "A observação deve ter até 2.000 caracteres.";

  return { isValid: Object.keys(errors).length === 0, errors };
}

/** Trims texts and fills defaults. Call after `validateTask`, with the name of the selected user. */
export function normalizeTask(input: TaskInput, collaboratorName: string): TaskRecord {
  return {
    title: input.title.trim(),
    company: input.company.trim(),
    collaboratorId: input.collaboratorId,
    collaborator: collaboratorName.trim(),
    category: input.category || DEFAULT_TASK_CATEGORY,
    stage: input.stage,
    dueDate: input.dueDate || null,
    notes: input.notes?.trim() || null,
  };
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);
}

/** "late" when the deadline passed and the task is not done; "met" when it passed already done. */
export function deadlineState(task: Pick<Task, "dueDate" | "stage">, today: string): "late" | "met" | null {
  if (!task.dueDate || task.dueDate >= today) return null;
  return task.stage === "done" ? "met" : "late";
}

export interface TaskStatsRow extends Record<TaskStage, number> {
  name: string;
  late: number;
  total: number;
  donePercent: number;
}

/** Tasks per stage grouped by `key`, with late count and completion rate; largest groups first. */
export function taskStats(
  tasks: Task[],
  key: "collaborator" | "company" | "category",
  today: string
): TaskStatsRow[] {
  const groups = new Map<string, TaskStatsRow>();
  for (const t of tasks) {
    if (!(t.stage in TASK_STAGES)) continue;
    const name = t[key] || DEFAULT_TASK_CATEGORY;
    const g = groups.get(name) ?? { name, todo: 0, doing: 0, done: 0, late: 0, total: 0, donePercent: 0 };
    g[t.stage]++;
    g.total++;
    if (deadlineState(t, today) === "late") g.late++;
    groups.set(name, g);
  }
  return [...groups.values()]
    .map((g) => ({ ...g, donePercent: Math.round((g.done / g.total) * 100) }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "pt-BR"));
}

/** Open tasks whose stage has not changed for at least `minDays`, longest idle first. */
export function stalledTasks(tasks: Task[], minDays: number, today: string): (Task & { idleDays: number })[] {
  return tasks
    .filter((t) => t.stage !== "done")
    .map((t) => ({ ...t, idleDays: daysBetween((t.stageChangedAt || t.createdAt || today).slice(0, 10), today) }))
    .filter((t) => t.idleDays >= minDays)
    .sort((a, b) => b.idleDays - a.idleDays);
}

export interface KanbanLane {
  collaborator: string;
  stages: Record<TaskStage, Task[]>;
}

/** One lane per collaborator (alphabetical), optionally restricted to one company. */
export function kanbanLanes(tasks: Task[], company?: string): KanbanLane[] {
  const lanes = new Map<string, KanbanLane>();
  for (const t of tasks) {
    if (company && t.company !== company) continue;
    if (!(t.stage in TASK_STAGES)) continue;
    const lane = lanes.get(t.collaborator) ?? { collaborator: t.collaborator, stages: { todo: [], doing: [], done: [] } };
    lane.stages[t.stage].push(t);
    lanes.set(t.collaborator, lane);
  }
  return [...lanes.values()].sort((a, b) => a.collaborator.localeCompare(b.collaborator, "pt-BR"));
}

/** Default idle time (days) for a task to count as stalled. */
export const STALLED_TASK_DAYS = 7;

export interface TaskBoardSummary {
  total: number;
  open: number; // not done
  late: number; // deadline passed and not done
  stalled: number; // open and idle for at least `stalledDays`
  done: number;
}

export function summarizeTaskBoard(tasks: Task[], today: string, stalledDays = STALLED_TASK_DAYS): TaskBoardSummary {
  const open = tasks.filter((t) => t.stage !== "done");
  return {
    total: tasks.length,
    open: open.length,
    late: open.filter((t) => deadlineState(t, today) === "late").length,
    stalled: stalledTasks(open, stalledDays, today).length,
    done: tasks.length - open.length,
  };
}
