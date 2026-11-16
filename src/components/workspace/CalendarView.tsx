"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Bell, ChevronLeft, ChevronRight, Pencil, Plus, SquareKanban, Trash2, X } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button, ConfirmDialog } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import {
  TASK_STAGES,
  addMonths,
  deadlineState,
  monthGrid,
  reminderState,
  sortReminders,
  summarizeReminders,
  todayInSaoPaulo,
  type Reminder,
  type Task,
} from "@/modules/workspace";
import { NO_REMINDERS, NO_TASKS, fetchReminders, fetchTasks, notifyRemindersChanged, setReminderDone, REMINDERS_CHANGED_EVENT } from "./api";
import { ReminderFormModal } from "./ReminderFormModal";
import { Notice, WorkspaceHeader, readApiError, useFetched, type NoticeState } from "./shared";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MAX_CHIPS = 3;

const asDate = (iso: string) => new Date(`${iso}T12:00:00Z`);
const monthTitle = (month: string) => {
  const text = asDate(`${month}-01`).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
  return text.charAt(0).toUpperCase() + text.slice(1);
};
const dayTitle = (iso: string) => {
  const text = asDate(iso).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  return text.charAt(0).toUpperCase() + text.slice(1);
};

type Tone = "lembrete" | "feito" | "atrasada" | "tarefa";
type Aberto = { tipo: "dia"; dia: string } | { tipo: "lembrete"; dia: string; id: number } | { tipo: "tarefa"; dia: string; id: number };
type Dia = { reminders: Reminder[]; tasks: Task[] };
const VAZIO: Dia = { reminders: [], tasks: [] };

function chipClass(tone: Tone) {
  return {
    lembrete: "bg-violet-50 text-violet-800 border-violet-200",
    tarefa: "bg-blue-50 text-blue-800 border-blue-200",
    atrasada: "bg-red-50 text-red-700 border-red-200",
    feito: "bg-slate-50 text-slate-400 border-slate-200 line-through",
  }[tone];
}

function taskTone(t: Task, today: string): Tone {
  return t.stage === "done" ? "feito" : deadlineState(t, today) === "late" ? "atrasada" : "tarefa";
}

function LembreteItem({
  r,
  today,
  onToggle,
  onEdit,
  onDelete,
}: {
  r: Reminder;
  today: string;
  onToggle: (r: Reminder) => void;
  onEdit: (r: Reminder) => void;
  onDelete: (r: Reminder) => void;
}) {
  return (
    <li className="py-2.5 flex items-start gap-2.5">
      <input
        type="checkbox"
        checked={r.done}
        onChange={() => onToggle(r)}
        aria-label={r.done ? `Reabrir: ${r.title}` : `Marcar como feito: ${r.title}`}
        className="mt-0.5 w-4 h-4 rounded accent-violet-600 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className={`text-[13px] font-medium ${r.done ? "text-slate-400 line-through" : "text-slate-900"}`}>
          <Bell className="inline w-3.5 h-3.5 mr-1 text-violet-500" />
          {r.time && <span className="tabular-nums mr-1">{r.time}</span>}
          {r.title}
        </p>
        {r.notes && <p className="text-[12px] text-slate-500 mt-0.5 whitespace-pre-line">{r.notes}</p>}
        {reminderState(r, today) === "atrasado" && <p className="text-[11.5px] font-medium text-red-600 mt-0.5">Atrasado</p>}
      </div>
      <button type="button" onClick={() => onEdit(r)} aria-label={`Editar ${r.title}`} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 shrink-0">
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button type="button" onClick={() => onDelete(r)} aria-label={`Excluir ${r.title}`} className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 shrink-0">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </li>
  );
}

function TarefaItem({ t, today }: { t: Task; today: string }) {
  const late = taskTone(t, today) === "atrasada";
  return (
    <li className="py-2.5 flex items-start gap-2.5">
      <SquareKanban className={`mt-0.5 w-4 h-4 shrink-0 ${late ? "text-red-500" : "text-blue-500"}`} />
      <div className="min-w-0 flex-1">
        <p className={`text-[13px] font-medium ${t.stage === "done" ? "text-slate-400 line-through" : "text-slate-900"}`}>{t.title}</p>
        <p className="text-[12px] text-slate-500 mt-0.5">
          Prazo da tarefa · {t.company} · {t.collaborator} · {TASK_STAGES[t.stage]}
          {late && <span className="text-red-600 font-medium"> · atrasada</span>}
        </p>
        <Link href="/espaco-trabalho/tarefas" className="inline-block mt-1 text-[12px] font-medium text-blue-700 hover:underline">Abrir no quadro</Link>
      </div>
    </li>
  );
}

type Acoes = { onToggle: (r: Reminder) => void; onEdit: (r: Reminder) => void; onDelete: (r: Reminder) => void };

function ItensDoDia({ dia, today, acoes }: { dia: Dia; today: string; acoes: Acoes }) {
  if (!dia.reminders.length && !dia.tasks.length) return <p className="py-3 text-[13px] text-slate-500">Nada marcado para este dia.</p>;
  return (
    <ul className="divide-y divide-slate-100">
      {dia.reminders.map((r) => <LembreteItem key={`r${r.id}`} r={r} today={today} {...acoes} />)}
      {dia.tasks.map((t) => <TarefaItem key={`t${t.id}`} t={t} today={today} />)}
    </ul>
  );
}

/** Small box anchored to a day of the grid (desktop). */
function Balao({ titulo, direita, acima, onClose, children }: { titulo: string; direita: boolean; acima: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <button type="button" aria-hidden tabIndex={-1} className="fixed inset-0 z-30 cursor-default" onClick={onClose} />
      <div
        role="dialog"
        aria-label={titulo}
        className={`absolute z-40 w-80 max-h-80 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl px-3.5 pt-2.5 pb-1 ${
          direita ? "right-0" : "left-0"
        } ${acima ? "bottom-full mb-1" : "top-full mt-1"}`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] font-semibold text-slate-700">{titulo}</span>
          <button type="button" onClick={onClose} aria-label="Fechar" className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {children}
      </div>
    </>
  );
}

/** Month calendar with the task deadlines of the board and the user's own reminders. */
export function CalendarView({ abrirNovo = false }: { abrirNovo?: boolean }) {
  const { profile } = useApp();
  const today = todayInSaoPaulo();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [onlyMine, setOnlyMine] = useState(false);
  const [aberto, setAberto] = useState<Aberto | null>(null); // box over the grid (desktop)
  const [gaveta, setGaveta] = useState<string | null>(null); // day sheet (phones)
  const [editing, setEditing] = useState<{ reminder: Reminder | null; date: string } | null>(abrirNovo ? { reminder: null, date: today } : null);
  const [deleting, setDeleting] = useState<Reminder | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);

  const { data: tasks } = useFetched(fetchTasks, NO_TASKS);
  const { data: reminders, setData: setReminders, error, reload } = useFetched(fetchReminders, NO_REMINDERS);

  // Badges and the home page refresh on this event; the calendar reloads with them.
  useEffect(() => {
    window.addEventListener(REMINDERS_CHANGED_EVENT, reload);
    return () => window.removeEventListener(REMINDERS_CHANGED_EVENT, reload);
  }, [reload]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setAberto(null);
      setGaveta(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const visibleTasks = useMemo(
    () => tasks.filter((t) => t.dueDate && (!onlyMine || t.collaboratorId === profile?.id)),
    [tasks, onlyMine, profile?.id]
  );

  const byDay = useMemo(() => {
    const map = new Map<string, Dia>();
    const slot = (d: string) => map.get(d) ?? (map.set(d, { reminders: [], tasks: [] }), map.get(d)!);
    for (const r of sortReminders(reminders)) slot(r.date).reminders.push(r);
    for (const t of visibleTasks) slot(t.dueDate!).tasks.push(t);
    return map;
  }, [reminders, visibleTasks]);

  const resumo = useMemo(() => summarizeReminders(reminders, today), [reminders, today]);
  const diaDe = useCallback((d: string) => byDay.get(d) ?? VAZIO, [byDay]);

  const fecharTudo = () => {
    setAberto(null);
    setGaveta(null);
  };
  const novoLembrete = (date: string) => {
    fecharTudo();
    setEditing({ reminder: null, date });
  };

  const acoes: Acoes = {
    onToggle: async (r) => {
      // The box changes right away; it goes back if the server refuses.
      const marcar = (done: boolean) => setReminders((lista) => lista.map((x) => (x.id === r.id ? { ...x, done } : x)));
      marcar(!r.done);
      try {
        await setReminderDone(r.id, !r.done);
      } catch (e) {
        marcar(r.done);
        setNotice({ ok: false, text: e instanceof Error ? e.message : "Não foi possível atualizar o lembrete." });
      }
    },
    onEdit: (r) => {
      fecharTudo();
      setEditing({ reminder: r, date: r.date });
    },
    onDelete: (r) => {
      setAberto(null);
      setDeleting(r);
    },
  };

  const irParaAtrasados = () => {
    const dia = resumo.alertas.find((r) => r.date < today)?.date;
    if (!dia) return;
    setMonth(dia.slice(0, 7));
    if (window.matchMedia("(min-width: 640px)").matches) setAberto({ tipo: "dia", dia });
    else setGaveta(dia);
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/espaco-trabalho/lembretes/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await readApiError(res, "Não foi possível excluir o lembrete."));
      notifyRemindersChanged();
      setNotice({ ok: true, text: "Lembrete excluído." });
    } catch (e) {
      setNotice({ ok: false, text: e instanceof Error ? e.message : "Não foi possível excluir o lembrete." });
    } finally {
      setBusy(false);
      setDeleting(null);
    }
  };

  const conteudoDoBalao = (a: Aberto) => {
    const dia = diaDe(a.dia);
    if (a.tipo === "dia") return <ItensDoDia dia={dia} today={today} acoes={acoes} />;
    if (a.tipo === "lembrete") {
      const r = dia.reminders.find((x) => x.id === a.id);
      return r ? <ul><LembreteItem r={r} today={today} {...acoes} /></ul> : null;
    }
    const t = dia.tasks.find((x) => x.id === a.id);
    return t ? <ul><TarefaItem t={t} today={today} /></ul> : null;
  };

  const weeks = monthGrid(month);

  return (
    <AppLayout>
      <div className="space-y-6">
        <WorkspaceHeader
          title="Calendário"
          description="Prazos das tarefas do quadro e os seus lembretes. Só você vê os seus lembretes."
          actions={
            <Button onClick={() => novoLembrete(today)}>
              <Plus className="w-4 h-4" />
              Novo lembrete
            </Button>
          }
        />
        <Notice notice={notice} onClose={() => setNotice(null)} />
        {error && <p role="alert" className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-[13px] text-red-800">{error}</p>}

        <section className="bg-white rounded-2xl border border-slate-200/80">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setMonth(addMonths(month, -1))} aria-label="Mês anterior" className="p-2 rounded-lg text-slate-600 hover:bg-slate-100">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-[15px] font-semibold text-slate-900 min-w-[150px] text-center" aria-live="polite">{monthTitle(month)}</h2>
              <button type="button" onClick={() => setMonth(addMonths(month, 1))} aria-label="Próximo mês" className="p-2 rounded-lg text-slate-600 hover:bg-slate-100">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11.5px] text-slate-500">
              {resumo.atrasados > 0 && (
                <button
                  type="button"
                  onClick={irParaAtrasados}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-red-200 bg-red-50 text-[12px] font-semibold text-red-700 hover:bg-red-100"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {resumo.atrasados} lembrete(s) atrasado(s)
                </button>
              )}
              <label className="inline-flex items-center gap-1.5 font-medium text-slate-700 cursor-pointer">
                <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} className="rounded" />
                Só as minhas tarefas
              </label>
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-violet-400" />Lembrete</span>
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400" />Prazo de tarefa</span>
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-400" />Atrasada</span>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-100 text-center text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
            {WEEKDAYS.map((w) => <div key={w} className="py-2">{w}</div>)}
          </div>
          <div role="grid" aria-label={monthTitle(month)}>
            {weeks.map((week, row) => (
              <div key={week[0]} role="row" className="grid grid-cols-7 border-b border-slate-100 last:border-b-0">
                {week.map((d, col) => {
                  const dia = diaDe(d);
                  const total = dia.reminders.length + dia.tasks.length;
                  const outside = !d.startsWith(month);
                  const ultimaLinha = row === weeks.length - 1;
                  const chips = [
                    ...dia.reminders.map((r) => (
                      <span key={`r${r.id}`} className={`group/chip flex items-center gap-1 px-1 py-0.5 rounded border text-[10.5px] font-medium ${chipClass(r.done ? "feito" : "lembrete")}`}>
                        <input
                          type="checkbox"
                          checked={r.done}
                          onChange={() => void acoes.onToggle(r)}
                          aria-label={r.done ? `Reabrir: ${r.title}` : `Marcar como feito: ${r.title}`}
                          className={`h-3 shrink-0 accent-violet-600 transition-all ${r.done ? "w-3" : "w-0 opacity-0 group-hover/chip:w-3 group-hover/chip:opacity-100 focus:w-3 focus:opacity-100"}`}
                        />
                        <button type="button" onClick={() => setAberto({ tipo: "lembrete", dia: d, id: r.id })} className="min-w-0 flex-1 truncate text-left">
                          {r.time ? `${r.time} ` : ""}
                          {r.title}
                        </button>
                      </span>
                    )),
                    ...dia.tasks.map((t) => (
                      <button
                        key={`t${t.id}`}
                        type="button"
                        onClick={() => setAberto({ tipo: "tarefa", dia: d, id: t.id })}
                        className={`block w-full truncate text-left px-1.5 py-0.5 rounded border text-[10.5px] font-medium ${chipClass(taskTone(t, today))}`}
                      >
                        {t.title}
                      </button>
                    )),
                  ];
                  const dots = [
                    ...dia.reminders.map((r) => (r.done ? "bg-slate-300" : "bg-violet-500")),
                    ...dia.tasks.map((t) => ({ feito: "bg-slate-300", atrasada: "bg-red-500", tarefa: "bg-blue-500", lembrete: "bg-violet-500" })[taskTone(t, today)]),
                  ];
                  return (
                    <div
                      key={d}
                      role="gridcell"
                      aria-label={`${dayTitle(d)}${total ? `, ${total} item(ns)` : ""}`}
                      className={`group relative min-h-[64px] sm:min-h-[108px] p-1 sm:p-1.5 flex flex-col border-r border-slate-100 last:border-r-0 ${
                        outside ? "bg-slate-50/60" : ""
                      } ${ultimaLinha && col === 0 ? "rounded-bl-2xl" : ""} ${ultimaLinha && col === 6 ? "rounded-br-2xl" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-[12px] font-semibold ${
                            d === today ? "bg-slate-900 text-white" : outside ? "text-slate-300" : "text-slate-700"
                          }`}
                        >
                          {Number(d.slice(8))}
                        </span>
                        <button
                          type="button"
                          onClick={() => novoLembrete(d)}
                          aria-label={`Novo lembrete em ${dayTitle(d)}`}
                          title="Novo lembrete neste dia"
                          className="hidden sm:flex w-6 h-6 items-center justify-center rounded-md text-slate-400 hover:text-violet-700 hover:bg-violet-50 opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
                        >
                          <Bell className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="hidden sm:block mt-0.5 space-y-0.5">
                        {chips.slice(0, MAX_CHIPS)}
                        {chips.length > MAX_CHIPS && (
                          <button type="button" onClick={() => setAberto({ tipo: "dia", dia: d })} className="block px-1.5 text-[10.5px] font-semibold text-slate-600 hover:text-slate-900">
                            +{chips.length - MAX_CHIPS} mais
                          </button>
                        )}
                      </div>
                      {dots.length > 0 && (
                        <span className="sm:hidden flex flex-wrap gap-0.5 mt-1 px-0.5" aria-hidden>
                          {dots.slice(0, 4).map((c, i) => <span key={i} className={`w-1.5 h-1.5 rounded-full ${c}`} />)}
                        </span>
                      )}
                      <button type="button" onClick={() => setGaveta(d)} aria-label={`Ver ${dayTitle(d)}`} className="sm:hidden absolute inset-0" />
                      {aberto?.dia === d && (
                        <div className="hidden sm:block">
                          <Balao titulo={dayTitle(d)} direita={col >= 4} acima={row >= weeks.length - 2} onClose={() => setAberto(null)}>
                            {conteudoDoBalao(aberto)}
                          </Balao>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      </div>

      {gaveta && (
        <div className="sm:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={dayTitle(gaveta)}>
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setGaveta(null)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto bg-white rounded-t-3xl shadow-2xl p-4 pb-8">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-[15px] font-semibold text-slate-900">{dayTitle(gaveta)}</h2>
              <button type="button" onClick={() => setGaveta(null)} aria-label="Fechar" className="p-2 rounded-xl text-slate-500 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ItensDoDia dia={diaDe(gaveta)} today={today} acoes={acoes} />
            <Button className="w-full mt-3" variant="secondary" onClick={() => novoLembrete(gaveta)}>
              <Bell className="w-4 h-4" />
              Novo lembrete neste dia
            </Button>
          </div>
        </div>
      )}

      {editing && (
        <ReminderFormModal
          reminder={editing.reminder}
          initialDate={editing.date}
          onClose={() => setEditing(null)}
          onSaved={(text) => {
            setEditing(null);
            setNotice({ ok: true, text });
          }}
        />
      )}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Excluir lembrete?"
        description={deleting ? `“${deleting.title}” será excluído.` : undefined}
        confirmLabel="Excluir"
        tone="danger"
        loading={busy}
        onConfirm={() => void remove()}
        onCancel={() => setDeleting(null)}
      />
    </AppLayout>
  );
}
