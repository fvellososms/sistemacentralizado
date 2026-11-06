"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, Clock3, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { ConfirmModal } from "@/components/ConfirmModal";
import {
  STALLED_TASK_DAYS,
  TASK_STAGES,
  TASK_STAGE_ORDER,
  deadlineState,
  distinctValues,
  kanbanLanes,
  mergeNames,
  stalledTasks,
  summarizeTaskBoard,
  taskStats,
  todayInSaoPaulo,
  type Task,
  type TaskBoardSummary,
  type TaskStage,
} from "@/modules/workspace";
import { NO_TASKS, NO_TEAM, fetchTasks, fetchTeam, notifyTasksChanged } from "./api";
import { useApp } from "@/context/AppContext";
import { TaskFormModal } from "./TaskFormModal";
import { Avatar, EmptyPanel, MetricCard, Notice, Panel, formatNumber, formatShortDate, readApiError, useFetched, type NoticeState } from "./shared";

const STAGE_STYLE: Record<TaskStage, { header: string; card: string }> = {
  todo: { header: "text-slate-600", card: "border-l-slate-400" },
  doing: { header: "text-blue-700", card: "border-l-blue-500" },
  done: { header: "text-emerald-700", card: "border-l-emerald-500" },
};

const STAT_GROUPS = [
  ["collaborator", "Colaborador"],
  ["company", "Empresa"],
  ["category", "Tipo de serviço"],
] as const;

const selectClass =
  "px-3 py-2 text-[12.5px] rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-100";

/**
 * Kanban per collaborator plus task statistics. Independent of the activity filters of the page.
 */
export function TaskBoardSection({ activityCompanies }: { activityCompanies: string[] }) {
  const { profile } = useApp();
  const { data: team } = useFetched(fetchTeam, NO_TEAM);
  const { data: tasks, setData: setTasks, loading, error, reload } = useFetched(fetchTasks, NO_TASKS);
  const [editing, setEditing] = useState<{ task: Task | null; company?: string } | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);
  const today = todayInSaoPaulo();

  const summary = useMemo(() => summarizeTaskBoard(tasks, today), [tasks, today]);
  const refresh = () => {
    reload();
    notifyTasksChanged();
  };

  const companies = useMemo(() => mergeNames(activityCompanies, distinctValues(tasks, "company")), [activityCompanies, tasks]);

  const move = async (task: Task, stage: TaskStage) => {
    setTasks((all) => all.map((t) => (t.id === task.id ? { ...t, stage } : t)));
    try {
      const res = await fetch(`/api/espaco-trabalho/tarefas/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...task, stage }),
      });
      if (!res.ok) throw new Error(await readApiError(res, "Não foi possível mover a tarefa."));
    } catch (e) {
      setNotice({ ok: false, text: e instanceof Error ? e.message : "Não foi possível mover a tarefa." });
    }
    refresh();
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      const res = await fetch(`/api/espaco-trabalho/tarefas/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await readApiError(res, "Não foi possível excluir a tarefa."));
      setNotice({ ok: true, text: "Tarefa excluída." });
      refresh();
    } catch (e) {
      setNotice({ ok: false, text: e instanceof Error ? e.message : "Não foi possível excluir a tarefa." });
    } finally {
      setDeletingBusy(false);
      setDeleting(null);
    }
  };

  return (
    <>
      {!loading && !error && <TaskSummaryCards summary={summary} />}
      <Notice notice={notice} onClose={() => setNotice(null)} />
      <KanbanBoard
        tasks={tasks}
        loading={loading}
        error={error}
        companies={companies}
        today={today}
        onAdd={(company) => setEditing({ task: null, company })}
        onEdit={(task) => setEditing({ task })}
        onDelete={setDeleting}
        onMove={(task, stage) => void move(task, stage)}
      />

      <SectionLabel title="Estatísticas das tarefas" hint="Por colaborador, empresa ou tipo de serviço" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TaskStatsPanel tasks={tasks} today={today} />
        <StalledTasksPanel tasks={tasks} today={today} />
      </div>

      {editing && (
        <TaskFormModal
          task={editing.task}
          initialCompany={editing.company}
          team={team}
          defaultCollaboratorId={profile?.id}
          companies={companies}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            setNotice({ ok: true, text: message });
            refresh();
          }}
        />
      )}

      <ConfirmModal
        isOpen={Boolean(deleting)}
        title="Excluir tarefa"
        description={`Excluir a tarefa “${deleting?.title ?? ""}”? Esta ação não pode ser desfeita.`}
        isLoading={deletingBusy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

const tagClass = "text-[10px] font-medium uppercase tracking-wider text-slate-400";

/** Open, late, stalled and done counters (task page and Workspace overview). */
export function TaskSummaryCards({ summary }: { summary: TaskBoardSummary }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MetricCard icon={ClipboardList} iconClass="bg-blue-50 text-blue-600" tag={<span className={tagClass}>Em aberto</span>} value={formatNumber(summary.open)} label="A fazer e fazendo" />
      <MetricCard
        icon={AlertTriangle}
        iconClass={summary.late ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"}
        tag={<span className={tagClass}>Atrasadas</span>}
        value={formatNumber(summary.late)}
        label={summary.late ? "Prazo vencido sem conclusão" : "Nenhuma tarefa atrasada"}
      />
      <MetricCard
        icon={Clock3}
        iconClass={summary.stalled ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"}
        tag={<span className={tagClass}>Paradas</span>}
        value={formatNumber(summary.stalled)}
        label={`Sem mudar de etapa há ${STALLED_TASK_DAYS}+ dias`}
      />
      <MetricCard icon={CheckCircle2} iconClass="bg-emerald-50 text-emerald-600" tag={<span className={tagClass}>Feito!</span>} value={formatNumber(summary.done)} label={`de ${formatNumber(summary.total)} tarefas`} />
    </div>
  );
}

export function SectionLabel({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 pt-2">
      <h2 className="text-[15px] font-semibold text-slate-900 tracking-tight">{title}</h2>
      <span className="text-[12px] text-slate-500">{hint}</span>
    </div>
  );
}

function KanbanBoard({
  tasks,
  loading,
  error,
  companies,
  today,
  onAdd,
  onEdit,
  onDelete,
  onMove,
}: {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  companies: string[];
  today: string;
  onAdd: (company: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onMove: (task: Task, stage: TaskStage) => void;
}) {
  const [company, setCompany] = useState("");
  const [dragging, setDragging] = useState<Task | null>(null);
  const [over, setOver] = useState("");
  const lanes = kanbanLanes(tasks, company || undefined);

  const drop = (collaborator: string, stage: TaskStage) => {
    setOver("");
    if (dragging && dragging.collaborator === collaborator && dragging.stage !== stage) onMove(dragging, stage);
    setDragging(null);
  };

  return (
    <Panel
      title="Quadro de tarefas"
      description="Tarefas por colaborador · independente dos filtros acima"
      action={
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Empresa do quadro de tarefas" value={company} onChange={(e) => setCompany(e.target.value)} className={selectClass}>
            <option value="">Todas as empresas</option>
            {companies.map((n) => <option key={n}>{n}</option>)}
          </select>
          <Button variant="secondary" size="sm" onClick={() => onAdd(company)}>
            <Plus className="w-3.5 h-3.5" />
            Nova tarefa
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="p-10 text-center text-[13px] text-slate-500">Carregando tarefas…</div>
      ) : error ? (
        <p role="alert" className="m-6 p-3.5 rounded-xl border border-red-200 bg-red-50 text-[13px] text-red-800">{error}</p>
      ) : lanes.length === 0 ? (
        <EmptyPanel
          title="Nenhuma tarefa no quadro."
          description={company ? "Esta empresa não tem tarefas no quadro." : "Use “Nova tarefa” para começar."}
        />
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[180px_repeat(3,minmax(0,1fr))] gap-3 px-6 py-3 border-b border-slate-100 text-[11px] font-medium uppercase tracking-wider text-slate-500">
              <span>Colaborador</span>
              {TASK_STAGE_ORDER.map((s) => <span key={s} className={STAGE_STYLE[s].header}>{TASK_STAGES[s]}</span>)}
            </div>
            {lanes.map((lane) => (
              <div key={lane.collaborator} className="grid grid-cols-[180px_repeat(3,minmax(0,1fr))] gap-3 px-6 py-4 border-b border-slate-100 last:border-b-0">
                <div className="flex items-start gap-2.5 pt-1">
                  <Avatar name={lane.collaborator} />
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-slate-900 truncate">{lane.collaborator}</div>
                    <div className="text-[11px] text-slate-500">
                      {formatNumber(TASK_STAGE_ORDER.reduce((n, s) => n + lane.stages[s].length, 0))} tarefas
                    </div>
                  </div>
                </div>
                {TASK_STAGE_ORDER.map((stage, i) => {
                  const key = `${lane.collaborator}:${stage}`;
                  return (
                    <div
                      key={stage}
                      className={`min-h-[72px] rounded-xl p-1.5 space-y-2 transition ${over === key ? "bg-blue-50 ring-2 ring-blue-200" : "bg-slate-50/70"}`}
                      onDragOver={(e) => {
                        if (dragging?.collaborator === lane.collaborator) {
                          e.preventDefault();
                          setOver(key);
                        }
                      }}
                      onDragLeave={() => setOver("")}
                      onDrop={(e) => {
                        e.preventDefault();
                        drop(lane.collaborator, stage);
                      }}
                    >
                      {lane.stages[stage].map((t) => (
                        <article
                          key={t.id}
                          draggable
                          onDragStart={() => setDragging(t)}
                          onDragEnd={() => {
                            setDragging(null);
                            setOver("");
                          }}
                          className={`bg-white rounded-lg border border-slate-200/80 border-l-[3px] ${STAGE_STYLE[stage].card} p-2.5 shadow-sm cursor-grab active:cursor-grabbing`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <strong className="text-[12.5px] font-semibold text-slate-900 leading-snug">{t.title}</strong>
                            {t.dueDate && <DeadlineChip task={t} today={today} />}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{t.company} · {t.category}</div>
                          {t.notes && <p className="text-[11.5px] text-slate-600 mt-1 line-clamp-2">{t.notes}</p>}
                          <div className="flex items-center justify-between mt-2 -mx-1">
                            <CardButton
                              disabled={i === 0}
                              label={`Mover “${t.title}” para ${i > 0 ? TASK_STAGES[TASK_STAGE_ORDER[i - 1]] : "a coluna anterior"}`}
                              onClick={() => onMove(t, TASK_STAGE_ORDER[i - 1])}
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </CardButton>
                            <div className="flex items-center">
                              <CardButton label={`Editar “${t.title}”`} onClick={() => onEdit(t)}>
                                <Pencil className="w-3 h-3" />
                              </CardButton>
                              <CardButton label={`Excluir “${t.title}”`} danger onClick={() => onDelete(t)}>
                                <Trash2 className="w-3 h-3" />
                              </CardButton>
                            </div>
                            <CardButton
                              disabled={i === TASK_STAGE_ORDER.length - 1}
                              label={`Mover “${t.title}” para ${i < TASK_STAGE_ORDER.length - 1 ? TASK_STAGES[TASK_STAGE_ORDER[i + 1]] : "a próxima coluna"}`}
                              onClick={() => onMove(t, TASK_STAGE_ORDER[i + 1])}
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </CardButton>
                          </div>
                        </article>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}

function CardButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`p-1 rounded-md text-slate-400 transition disabled:opacity-30 disabled:cursor-not-allowed ${
        danger ? "hover:text-red-600 hover:bg-red-50" : "hover:text-slate-900 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

function DeadlineChip({ task, today }: { task: Task; today: string }) {
  const state = deadlineState(task, today);
  const style =
    state === "late" ? "bg-red-50 text-red-700 border-red-100" : state === "met" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-600 border-slate-200";
  const title = state === "late" ? "Prazo vencido sem conclusão" : state === "met" ? "Prazo vencido, tarefa concluída" : "Prazo da tarefa";
  return (
    <span title={title} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-semibold whitespace-nowrap ${style}`}>
      <Clock3 className="w-2.5 h-2.5" />
      {formatShortDate(task.dueDate)}
    </span>
  );
}

function TaskStatsPanel({ tasks, today }: { tasks: Task[]; today: string }) {
  const [groupBy, setGroupBy] = useState<(typeof STAT_GROUPS)[number][0]>("collaborator");
  const stats = taskStats(tasks, groupBy, today);

  return (
    <Panel
      className="lg:col-span-2"
      title="Visão das tarefas"
      description="Distribuição por etapa e prazos vencidos"
      action={
        <div role="group" aria-label="Agrupar tarefas por" className="inline-flex p-1 rounded-xl bg-slate-100">
          {STAT_GROUPS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={groupBy === key}
              onClick={() => setGroupBy(key)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition ${
                groupBy === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      }
    >
      {stats.length === 0 ? (
        <EmptyPanel title="Nenhuma tarefa cadastrada." description="As estatísticas aparecem quando houver tarefas no quadro." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500">
                <th className="py-3 px-6 font-medium text-[11px] uppercase tracking-wider">
                  {STAT_GROUPS.find(([k]) => k === groupBy)![1]}
                </th>
                {TASK_STAGE_ORDER.map((s) => (
                  <th key={s} className="py-3 px-3 font-medium text-[11px] uppercase tracking-wider">{TASK_STAGES[s]}</th>
                ))}
                <th className="py-3 px-3 font-medium text-[11px] uppercase tracking-wider">Atrasadas</th>
                <th className="py-3 px-3 font-medium text-[11px] uppercase tracking-wider">Total</th>
                <th className="py-3 px-6 font-medium text-[11px] uppercase tracking-wider">Concluído</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.map((g) => (
                <tr key={g.name} className="hover:bg-slate-50/50 transition">
                  <td className="py-3 px-6 font-medium text-slate-900">{g.name}</td>
                  {TASK_STAGE_ORDER.map((s) => (
                    <td key={s} className="py-3 px-3 text-slate-600 tabular-nums">{formatNumber(g[s])}</td>
                  ))}
                  <td className={`py-3 px-3 tabular-nums ${g.late ? "text-red-600 font-semibold" : "text-slate-600"}`}>{formatNumber(g.late)}</td>
                  <td className="py-3 px-3 text-slate-900 font-semibold tabular-nums">{formatNumber(g.total)}</td>
                  <td className="py-3 px-6">
                    <div className="flex items-center gap-2 min-w-[110px]">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${g.donePercent}%` }} />
                      </div>
                      <span className="text-[12px] text-slate-600 tabular-nums w-9 text-right">{g.donePercent}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function StalledTasksPanel({ tasks, today }: { tasks: Task[]; today: string }) {
  const [minDays, setMinDays] = useState(STALLED_TASK_DAYS);
  const stalled = stalledTasks(tasks, minDays, today);
  const open = tasks.filter((t) => t.stage !== "done").length;

  return (
    <Panel
      title="Tarefas paradas"
      description="Sem mudança de etapa e ainda não concluídas"
      action={
        <select aria-label="Dias sem mudança de etapa" value={minDays} onChange={(e) => setMinDays(Number(e.target.value))} className={selectClass}>
          {[3, 7, 15, 30].map((n) => <option key={n} value={n}>Há {n}+ dias</option>)}
        </select>
      }
    >
      <div className="p-6 space-y-4">
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${stalled.length ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-100"}`}>
          <span className={`text-2xl font-semibold tracking-tight ${stalled.length ? "text-amber-700" : "text-slate-900"}`}>
            {formatNumber(stalled.length)}
          </span>
          <div className="text-[12px]">
            <div className="font-medium text-slate-900">{stalled.length === 1 ? "tarefa parada" : "tarefas paradas"}</div>
            <div className="text-slate-500">de {formatNumber(open)} em aberto</div>
          </div>
        </div>
        {stalled.length ? (
          <ul className="space-y-2">
            {stalled.slice(0, 6).map((t) => (
              <li key={t.id} className="flex items-start justify-between gap-3 text-[12px]">
                <div className="min-w-0">
                  <div className="font-medium text-slate-900 truncate">{t.title}</div>
                  <div className="text-slate-500 truncate">{t.collaborator} · {t.company} · {TASK_STAGES[t.stage]}</div>
                </div>
                <span className="font-semibold text-amber-700 whitespace-nowrap tabular-nums">
                  {formatNumber(t.idleDays)} {t.idleDays === 1 ? "dia" : "dias"}
                </span>
              </li>
            ))}
            {stalled.length > 6 && <li className="text-[12px] text-slate-500">+{formatNumber(stalled.length - 6)} outras</li>}
          </ul>
        ) : (
          <p className="flex items-center gap-1.5 text-[12px] text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
            Nenhuma tarefa parada há {minDays} dias ou mais.
          </p>
        )}
      </div>
    </Panel>
  );
}
