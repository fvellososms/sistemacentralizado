"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { WORKSPACE_CLIENT_COMPANIES, distinctValues, mergeNames, summarizeTaskBoard, todayInSaoPaulo } from "@/modules/workspace";
import { NO_ACTIVITIES, NO_TASKS, fetchActivities, fetchClientCompanyNames, fetchTasks } from "./api";
import { SectionLabel, TaskBoardSection, TaskSummaryCards } from "./TaskBoardSection";
import { Panel, WorkspaceHeader, useFetched } from "./shared";

/** Full-page task board (/espaco-trabalho/tarefas). */
export function TaskBoardView() {
  // Activities only feed the company suggestions of the task form (collaborators are the system users).
  const { data: activities } = useFetched(fetchActivities, NO_ACTIVITIES);
  const { data: clientCompanies } = useFetched(fetchClientCompanyNames, WORKSPACE_CLIENT_COMPANIES);
  const companies = useMemo(() => mergeNames(clientCompanies, distinctValues(activities, "company")), [clientCompanies, activities]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <WorkspaceHeader
          title="Quadro de tarefas"
          description="Organize o que está por vir, em andamento e entregue, por colaborador. Arraste os cartões entre as colunas."
        />
        <TaskBoardSection activityCompanies={companies} />
      </div>
    </AppLayout>
  );
}

/** Compact board summary for the Workspace overview, linking to the full board. */
export function TaskBoardSummaryPanel() {
  const { data: tasks, loading, error } = useFetched(fetchTasks, NO_TASKS);
  const summary = useMemo(() => summarizeTaskBoard(tasks, todayInSaoPaulo()), [tasks]);

  return (
    <>
      <SectionLabel title="Andamento das tarefas" hint="A fazer, fazendo e feito" />
      <Panel
        title="Quadro de tarefas"
        description="Tarefas da equipe por colaborador · independente dos filtros acima"
        action={
          <Link
            href="/espaco-trabalho/tarefas"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-medium bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition"
          >
            Abrir quadro
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        <div className="p-6">
          {loading ? (
            <p className="text-center text-[13px] text-slate-500">Carregando tarefas…</p>
          ) : error ? (
            <p role="alert" className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-[13px] text-red-800">{error}</p>
          ) : (
            <TaskSummaryCards summary={summary} />
          )}
        </div>
      </Panel>
    </>
  );
}
