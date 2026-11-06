"use client";

import { useEffect, useState } from "react";
import { WORKSPACE_CLIENT_COMPANIES, summarizeTaskBoard, todayInSaoPaulo, type Activity, type Task, type TaskBoardSummary } from "@/modules/workspace";
import { readApiError } from "./shared";

export const NO_ACTIVITIES: Activity[] = [];
export const NO_TASKS: Task[] = [];

export async function fetchActivities(): Promise<Activity[]> {
  const res = await fetch("/api/espaco-trabalho/atividades");
  if (!res.ok) throw new Error(await readApiError(res, "Não foi possível carregar os registros."));
  const data = await res.json();
  return Array.isArray(data.activities) ? data.activities : [];
}

/** Client companies registered by the admin (the fixed list is the fallback when the request fails). */
export async function fetchClientCompanyNames(): Promise<readonly string[]> {
  const res = await fetch("/api/empresas-clientes");
  if (!res.ok) return WORKSPACE_CLIENT_COMPANIES;
  const data = await res.json();
  return Array.isArray(data.companies) && data.companies.length ? data.companies : WORKSPACE_CLIENT_COMPANIES;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
}

export const NO_TEAM: TeamMember[] = [];

/** Active system users, offered in the "colaborador" selectors. */
export async function fetchTeam(): Promise<TeamMember[]> {
  const res = await fetch("/api/usuarios/ativos");
  if (!res.ok) throw new Error(await readApiError(res, "Não foi possível carregar a equipe."));
  const data = await res.json();
  return Array.isArray(data.users) ? data.users : [];
}

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch("/api/espaco-trabalho/tarefas");
  if (!res.ok) throw new Error(await readApiError(res, "Não foi possível carregar o quadro de tarefas."));
  const data = await res.json();
  return Array.isArray(data.tasks) ? data.tasks : [];
}

/** Fired after a task is created, edited, moved or deleted, so badges and summaries refresh. */
export const TASKS_CHANGED_EVENT = "workspace-tasks-changed";

export function notifyTasksChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(TASKS_CHANGED_EVENT));
}

const SUMMARY_TTL_MS = 60_000;
let cachedSummary: { at: number; value: TaskBoardSummary } | null = null;

async function loadSummary(force: boolean): Promise<TaskBoardSummary> {
  if (!force && cachedSummary && Date.now() - cachedSummary.at < SUMMARY_TTL_MS) return cachedSummary.value;
  const value = summarizeTaskBoard(await fetchTasks(), todayInSaoPaulo());
  cachedSummary = { at: Date.now(), value };
  return value;
}

/**
 * Task board summary for the sidebar badge. Cached for a minute across page changes
 * (the sidebar remounts on every page) and refreshed when tasks change.
 */
export function useTaskBoardSummary(): TaskBoardSummary | null {
  const [summary, setSummary] = useState<TaskBoardSummary | null>(cachedSummary?.value ?? null);

  useEffect(() => {
    let active = true;
    const refresh = (force: boolean) =>
      loadSummary(force)
        .then((value) => {
          if (active) setSummary(value);
        })
        .catch(() => {
          // The badge is optional; without data it simply stays hidden.
        });
    void refresh(false);
    const onChange = () => void refresh(true);
    window.addEventListener(TASKS_CHANGED_EVENT, onChange);
    return () => {
      active = false;
      window.removeEventListener(TASKS_CHANGED_EVENT, onChange);
    };
  }, []);

  return summary;
}
