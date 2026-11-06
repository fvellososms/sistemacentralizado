"use client";

import React, { useMemo, useState } from "react";
import { Activity as ActivityIcon, ArrowDownToLine, Building2, CalendarClock, CheckCircle2, ClipboardList, MapPin, Plus, RefreshCw, SlidersHorizontal, Users, X } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Button } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import {
  WORKSPACE_CLIENT_COMPANIES,
  activitiesToCsv,
  distinctValues,
  filterActivities,
  mergeNames,
  summarizeActivities,
  todayInSaoPaulo,
  upcomingVisits,
  type Activity,
  type ActivityFilters,
  type ActivitySource,
} from "@/modules/workspace";
import { ActivityFormModal } from "./ActivityFormModal";
import { VisitFormModal } from "./VisitFormModal";
import { ActivityTable } from "./ActivityTable";
import { QuantityBars, SendStatusDonut, TeamDeliveries, WeeklyTrendChart } from "./charts";
import { SectionLabel } from "./TaskBoardSection";
import { TaskBoardSummaryPanel } from "./TaskBoardView";
import { NO_ACTIVITIES, NO_TEAM, fetchActivities, fetchClientCompanyNames, fetchTeam } from "./api";
import {
  Avatar,
  EmptyPanel,
  MetricCard,
  Notice,
  Panel,
  SourceBadge,
  WorkspaceHeader,
  downloadFile,
  formatNumber,
  formatShortDate,
  readApiError,
  useFetched,
  type NoticeState,
} from "./shared";

type Variant = "overview" | ActivitySource;

const COPY: Record<Variant, { title: string; description: string; table: string; slug: string }> = {
  overview: {
    title: "Visão geral",
    description: "Acompanhe as entregas e a produtividade do setor técnico.",
    table: "Detalhamento das atividades",
    slug: "visao-geral",
  },
  visita: {
    title: "Visitas",
    description: "Agende e registre as visitas da equipe às obras e empresas clientes.",
    table: "Visitas registradas",
    slug: "visitas",
  },
  eso: {
    title: "Eventos ESO",
    description: "Acompanhe os eventos informados e os envios registrados.",
    table: "Eventos recebidos do ESO",
    slug: "eventos-eso",
  },
  manual: {
    title: "Atividades manuais",
    description: "Revisões, programas, treinamentos e outras entregas do setor técnico.",
    table: "Registros manuais",
    slug: "atividades-manuais",
  },
};

const EMPTY_FILTERS: ActivityFilters = { from: "", to: "", company: "", collaborator: "" };
const filterClass =
  "w-full px-3 py-2 text-[12.5px] rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-300 transition";
const filterLabelClass = "block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1";

export function WorkspaceActivitiesView({ variant }: { variant: Variant }) {
  const { profile } = useApp();
  const { data: activities, loading, error: loadError, reload } = useFetched(fetchActivities, NO_ACTIVITIES);
  const { data: clientCompanies } = useFetched(fetchClientCompanyNames, WORKSPACE_CLIENT_COMPANIES);
  const { data: team } = useFetched(fetchTeam, NO_TEAM);
  const [filters, setFilters] = useState<ActivityFilters>(EMPTY_FILTERS);
  // kind decides the form: visits and manual activities have different fields
  const [editing, setEditing] = useState<{ kind: "visita" | "manual"; activity: Activity | null } | null>(null);
  const [deleting, setDeleting] = useState<Activity | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);
  const copy = COPY[variant];
  const source = variant === "overview" ? undefined : variant;

  const filtered = useMemo(() => filterActivities(activities, { ...filters, source }), [activities, filters, source]);
  const summary = useMemo(() => summarizeActivities(filtered), [filtered]);
  const people = useMemo(() => distinctValues(activities, "collaborator"), [activities]);
  const companies = useMemo(() => mergeNames(clientCompanies, distinctValues(activities, "company")), [clientCompanies, activities]);
  const manual = useMemo(() => filtered.filter((r) => r.source === "manual"), [filtered]);
  const hasFilters = Boolean(filters.from || filters.to || filters.company || filters.collaborator);
  const invalidRange = Boolean(filters.from && filters.to && filters.from > filters.to);
  const today = todayInSaoPaulo();
  const upcoming = useMemo(() => upcomingVisits(activities, today), [activities, today]);
  const canCreateVisit = variant === "overview" || variant === "visita";
  const canCreateManual = variant === "overview" || variant === "manual";

  const exportCsv = () => {
    downloadFile(activitiesToCsv(filtered), `espaco-trabalho-${copy.slug}-${todayInSaoPaulo()}.csv`);
    setNotice({ ok: true, text: "Exportação preparada com os registros filtrados." });
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      const res = await fetch(`/api/espaco-trabalho/atividades/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await readApiError(res, "Não foi possível excluir o registro."));
      setNotice({ ok: true, text: deleting.source === "visita" ? "Visita excluída." : "Atividade excluída." });
      reload();
    } catch (e) {
      setNotice({ ok: false, text: e instanceof Error ? e.message : "Não foi possível excluir o registro." });
    } finally {
      setDeletingBusy(false);
      setDeleting(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <WorkspaceHeader
          title={copy.title}
          description={copy.description}
          actions={
            <>
              <Button variant="secondary" disabled={loading || !filtered.length} onClick={exportCsv}>
                <ArrowDownToLine className="w-4 h-4" />
                Exportar
              </Button>
              {canCreateManual && (
                <Button variant={canCreateVisit ? "secondary" : "primary"} onClick={() => setEditing({ kind: "manual", activity: null })}>
                  <Plus className="w-4 h-4" />
                  Nova atividade
                </Button>
              )}
              {canCreateVisit && (
                <Button onClick={() => setEditing({ kind: "visita", activity: null })}>
                  <Plus className="w-4 h-4" />
                  Nova visita
                </Button>
              )}
            </>
          }
        />

        <Notice notice={notice} onClose={() => setNotice(null)} />

        <section aria-label="Filtros do painel" className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col lg:flex-row lg:items-end gap-3">
          <div className="hidden lg:flex w-9 h-9 rounded-xl bg-slate-100 items-center justify-center shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-slate-600" />
          </div>
          <div className="grid grid-cols-2 gap-2 lg:w-[300px]">
            <div>
              <label htmlFor="filtro-de" className={filterLabelClass}>De</label>
              <input id="filtro-de" type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} className={filterClass} />
            </div>
            <div>
              <label htmlFor="filtro-ate" className={filterLabelClass}>Até</label>
              <input id="filtro-ate" type="date" min={filters.from || undefined} value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} className={filterClass} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <label htmlFor="filtro-colaborador" className={filterLabelClass}>Colaborador</label>
            <select id="filtro-colaborador" value={filters.collaborator} onChange={(e) => setFilters({ ...filters, collaborator: e.target.value })} className={filterClass}>
              <option value="">Todos os colaboradores</option>
              {people.map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-0">
            <label htmlFor="filtro-empresa" className={filterLabelClass}>Empresa</label>
            <select id="filtro-empresa" value={filters.company} onChange={(e) => setFilters({ ...filters, company: e.target.value })} className={filterClass}>
              <option value="">Todas as empresas</option>
              {companies.map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
          <Button variant="ghost" size="sm" disabled={!hasFilters} onClick={() => setFilters(EMPTY_FILTERS)} className="self-start lg:self-end">
            Limpar
            <X className="w-3.5 h-3.5" />
          </Button>
        </section>
        {invalidRange && (
          <p role="alert" className="text-[12px] text-red-600 -mt-3">A data inicial deve ser anterior à data final.</p>
        )}

        {loadError && (
          <div role="alert" className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-[13px] text-red-800 flex items-center justify-between gap-3">
            <span>{loadError}</span>
            <Button variant="secondary" size="sm" onClick={reload}>Tentar novamente</Button>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-10 flex items-center justify-center gap-2 text-[13px] text-slate-500">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Carregando registros…
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard
                icon={MapPin}
                iconClass="bg-blue-50 text-blue-600"
                tag={<SourceBadge source="visita" />}
                value={formatNumber(summary.visits)}
                label={`Visitas realizadas · ${formatNumber(summary.scheduledVisits)} agendada(s)`}
              />
              <MetricCard icon={ActivityIcon} iconClass="bg-teal-50 text-teal-600" tag={<SourceBadge source="eso" />} value={formatNumber(summary.informed)} label="Eventos informados" />
              <MetricCard icon={ClipboardList} iconClass="bg-violet-50 text-violet-600" tag={<SourceBadge source="manual" />} value={formatNumber(summary.manual)} label="Atividades manuais" />
              <MetricCard
                icon={CheckCircle2}
                iconClass="bg-emerald-50 text-emerald-600"
                tag={<SourceBadge source="eso" />}
                value={formatNumber(summary.submitted)}
                label={summary.sendRate === null ? "Eventos enviados · sem eventos no período" : `Eventos enviados · ${summary.sendRate}% dos informados`}
              />
            </div>

            {(variant === "visita" || variant === "overview") && (
              <Panel
                title="Próximas visitas"
                description="Visitas agendadas a partir de hoje · independente dos filtros acima"
                action={<CalendarClock className="w-4 h-4 text-slate-400" />}
              >
                {upcoming.length === 0 ? (
                  <EmptyPanel title="Nenhuma visita agendada." description="Use “Nova visita” com a situação “Agendada” para planejar a semana." />
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {upcoming.map((v) => (
                      <li key={v.id}>
                        <button
                          type="button"
                          onClick={() => setEditing({ kind: "visita", activity: v })}
                          className="w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-slate-50 transition"
                        >
                          <span className={`w-14 shrink-0 text-[12px] font-semibold ${v.occurredOn === today ? "text-blue-700" : "text-slate-900"}`}>
                            {v.occurredOn === today ? "Hoje" : formatShortDate(v.occurredOn)}
                          </span>
                          <Avatar name={v.collaborator} />
                          <span className="flex-1 min-w-0">
                            <span className="block text-[13px] font-medium text-slate-900 truncate">{v.category} · {v.company}{v.projectName ? ` · ${v.projectName}` : ""}</span>
                            <span className="block text-[12px] text-slate-500 truncate">{v.collaborator} — {v.objective}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            )}

            {variant === "overview" && (
              <>
                <SectionLabel title="Produtividade do setor" hint={hasFilters ? "Visão filtrada" : "Todos os registros disponíveis"} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Panel
                    className="lg:col-span-2"
                    title="Evolução da produtividade"
                    description="Volume por semana e origem"
                    action={<span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">Semanal</span>}
                  >
                    <div className="p-6"><WeeklyTrendChart rows={filtered} /></div>
                  </Panel>
                  <Panel title="Situação dos envios" description="Eventos eSocial">
                    <SendStatusDonut summary={summary} />
                  </Panel>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Panel title="Atividades por categoria" description="Produção registrada manualmente" action={<ClipboardList className="w-4 h-4 text-slate-400" />}>
                    <QuantityBars rows={manual} field="category" />
                  </Panel>
                  <Panel title="Empresas mais atendidas" description="Visitas e atividades manuais" action={<Building2 className="w-4 h-4 text-slate-400" />}>
                    <QuantityBars rows={filtered.filter((r) => r.source !== "eso")} field="company" limit={5} />
                  </Panel>
                  <Panel title="Entregas da equipe" description="Atividades manuais" action={<Users className="w-4 h-4 text-slate-400" />}>
                    <TeamDeliveries rows={manual} />
                  </Panel>
                </div>
                <TaskBoardSummaryPanel />
              </>
            )}

            <ActivityTable
              rows={filtered}
              title={copy.table}
              onEdit={(activity) => setEditing({ kind: activity.source === "visita" ? "visita" : "manual", activity })}
              onDelete={setDeleting}
            />
          </>
        )}
      </div>

      {editing?.kind === "visita" && (
        <VisitFormModal
          visit={editing.activity}
          team={team}
          companies={companies}
          defaultCollaboratorId={profile?.id}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            setNotice({ ok: true, text: message });
            reload();
          }}
        />
      )}
      {editing?.kind === "manual" && (
        <ActivityFormModal
          activity={editing.activity}
          team={team}
          companies={companies}
          defaultCollaboratorId={profile?.id}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            setNotice({ ok: true, text: message });
            reload();
          }}
        />
      )}

      <ConfirmModal
        isOpen={Boolean(deleting)}
        title={deleting?.source === "visita" ? "Excluir visita" : "Excluir atividade"}
        description={`Excluir “${deleting?.category ?? ""}” de ${deleting?.company ?? ""} (${deleting ? formatShortDate(deleting.occurredOn) : ""})? Esta ação não pode ser desfeita.`}
        isLoading={deletingBusy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </AppLayout>
  );
}
