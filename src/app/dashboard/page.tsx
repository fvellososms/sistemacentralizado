"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/AppLayout";
import { useApp } from "@/context/AppContext";
import {
  FileSpreadsheet,
  Clock,
  Users,
  AlertTriangle,
  ShieldCheck,
  CloudSun,
  Plus,
  ArrowRight,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { RdoDetailModal } from "@/components/RdoDetailModal";
import { calculateQualityScore } from "@/modules/quality";

export default function DashboardPage() {
  const { activeProject, openCreateModal } = useApp();
  const [rdosList, setRdosList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRdoId, setSelectedRdoId] = useState<number | null>(null);

  const fetchDashboardData = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/rdos?projectId=${activeProject.id}`);
      const data = await res.json();
      if (data.rdos) setRdosList(data.rdos);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeProject]);

  useEffect(() => {
    const handleCreated = () => fetchDashboardData();
    window.addEventListener("rdo-created", handleCreated);
    return () => window.removeEventListener("rdo-created", handleCreated);
  }, [activeProject]);

  const totalRdos = rdosList.length;
  const totalHh = rdosList.reduce((acc, r) => acc + (parseFloat(r.totalHh) || 0), 0);
  const totalOccurrences = rdosList.filter((r) => r.hasOccurrences).length;
  const latestRdo = rdosList[0] || null;
  const todayHeadcount = latestRdo?.totalHeadcount || 0;
  const ownHeadcount = latestRdo?.ownTeamCount || 0;
  const contractorHeadcount = latestRdo?.contractorTeamCount || 0;
  const qualityScore = calculateQualityScore(totalOccurrences);

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
                Visão geral
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-[12px] text-slate-500 font-medium">
                {activeProject?.code}
              </span>
            </div>
            <h1 className="text-[22px] md:text-[26px] font-semibold text-slate-900 tracking-tight leading-tight">
              {activeProject?.name || "Edifício Residencial Horizonte Azul"}
            </h1>
            <p className="text-[13px] text-slate-500 mt-1">
              Acompanhe a produção, efetivo e qualidade do canteiro em tempo real.
            </p>
          </div>

          <button
            onClick={() => openCreateModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium text-white bg-slate-900 hover:bg-slate-800 transition active:scale-[0.98] shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-6 h-6" strokeWidth={2.2} />
            <span>Novo RDO</span>
          </button>
        </div>

        {/* Hero KPI row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Big HH card */}
          <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 text-white">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-blue-500/30 blur-3xl" />
              <div className="absolute -bottom-8 right-32 w-32 h-32 rounded-full bg-emerald-500/20 blur-3xl" />
            </div>

            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
                  Homens-Hora acumulados
                </span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  No mês
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-[40px] md:text-[48px] font-semibold tracking-tight leading-none">
                  {totalHh.toFixed(0)}
                </span>
                <span className="text-base font-medium text-slate-400">HH</span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-4 max-w-md">
                <div>
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
                    Próprios
                  </div>
                  <div className="text-lg font-semibold mt-0.5">{ownHeadcount}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
                    Terceiros
                  </div>
                  <div className="text-lg font-semibold mt-0.5">{contractorHeadcount}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
                    Operações
                  </div>
                  <div className="text-lg font-semibold mt-0.5">{totalRdos}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quality card */}
          <Link
            href="/dashboard/qualidade"
            className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-6 hover:border-slate-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
                Índice de Qualidade
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition">
                <ShieldCheck className="w-4 h-4 text-emerald-600" strokeWidth={2} />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-3">
              <span className="text-[40px] font-semibold tracking-tight text-slate-900 leading-none">
                {qualityScore.toFixed(0)}
              </span>
              <span className="text-2xl font-semibold text-slate-400">%</span>
            </div>
            <div className="mt-2 text-[12px] text-slate-500 font-medium">
              Conforme as normas NR-18 e especificações técnicas
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[12px]">
              <span className="text-emerald-600 font-medium">Ver detalhes</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>
        </div>

        {/* Secondary KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" strokeWidth={2} />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Registrados
              </span>
            </div>
            <div className="text-2xl font-semibold text-slate-900 tracking-tight">
              {totalRdos}
            </div>
            <div className="text-[12px] text-slate-500 mt-0.5">RDOs no mês</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Users className="w-4 h-4 text-indigo-600" strokeWidth={2} />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Hoje
              </span>
            </div>
            <div className="text-2xl font-semibold text-slate-900 tracking-tight">
              {todayHeadcount}
            </div>
            <div className="text-[12px] text-slate-500 mt-0.5">
              {ownHeadcount} próp + {contractorHeadcount} terc
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-600" strokeWidth={2} />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Ocorrências
              </span>
            </div>
            <div className="text-2xl font-semibold text-slate-900 tracking-tight">
              {totalOccurrences}
            </div>
            <div className="text-[12px] text-slate-500 mt-0.5">
              {totalOccurrences === 0 ? "Nenhuma no período" : "Tratadas e arquivadas"}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                <CloudSun className="w-4 h-4 text-sky-600" strokeWidth={2} />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Condição
              </span>
            </div>
            <div className="text-[15px] font-semibold text-slate-900 tracking-tight leading-tight">
              {latestRdo?.weatherMorning === "chuva" ? "🌧️ Chuva" : "☀️ Estável"}
            </div>
            <div className="text-[12px] text-emerald-600 font-medium mt-0.5">
              {latestRdo?.workCondition === "impraticavel"
                ? "Impraticável"
                : "Canteiro praticável"}
            </div>
          </div>
        </div>

        {/* Main grid: chart + side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Histogram chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900 tracking-tight">
                  Efetivo recente
                </h2>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Distribuição diária de operários próprios e terceirizados
                </p>
              </div>
              <Link
                href="/rdo?view=histograma"
                className="text-[12px] font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 transition"
              >
                Ver completo
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-6 space-y-3.5">
              {rdosList.slice(0, 6).map((rdo) => {
                const maxCap = 30;
                const ownPct = Math.min(100, ((rdo.ownTeamCount || 0) / maxCap) * 100);
                const contPct = Math.min(100, ((rdo.contractorTeamCount || 0) / maxCap) * 100);
                const formattedDate = `${rdo.dayOfWeek}, ${rdo.date.split("-").reverse().slice(0, 2).join("/")}`;

                return (
                  <div key={rdo.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="font-medium text-slate-700 capitalize">
                        {formattedDate}
                      </span>
                      <span className="text-slate-500 font-medium tabular-nums">
                        {rdo.totalHeadcount} op · {rdo.totalHh} HH
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${ownPct}%`, backgroundColor: "#0F172A" }}
                        className="h-full transition-all"
                      />
                      <div
                        style={{ width: `${contPct}%`, backgroundColor: "#93C5FD" }}
                        className="h-full transition-all"
                      />
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center gap-5 pt-4 mt-2 border-t border-slate-100 text-[12px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-slate-900" />
                  <span>Próprios</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-blue-300" />
                  <span>Terceiros</span>
                </div>
              </div>
            </div>
          </div>

          {/* Side shortcuts */}
          <div className="space-y-3">
            <button
              onClick={() => openCreateModal()}
              className="w-full group flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-900 group-hover:scale-105 flex items-center justify-center transition">
                <Plus className="w-6 h-6 text-white" strokeWidth={2.2} />
              </div>
              <div className="flex-1">
                <div className="text-[13.5px] font-semibold text-slate-900">
                  Lançar RDO do dia
                </div>
                <div className="text-[11.5px] text-slate-500">
                  Preenchimento em 6 etapas
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
            </button>

            <Link
              href="/rdo?view=calendario"
              className="w-full group flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 group-hover:scale-105 flex items-center justify-center transition">
                <Calendar className="w-4.5 h-4.5 text-emerald-600" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="text-[13.5px] font-semibold text-slate-900">
                  Calendário
                </div>
                <div className="text-[11.5px] text-slate-500">Visão mensal</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/rso"
              className="w-full group flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:scale-105 flex items-center justify-center transition">
                <FileSpreadsheet className="w-4.5 h-4.5 text-blue-600" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="text-[13.5px] font-semibold text-slate-900">
                  Relatório Semanal
                </div>
                <div className="text-[11.5px] text-slate-500">Consolidação automática</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-[12px]">
              <div className="font-semibold text-slate-900 mb-0.5">
                Responsável técnico
              </div>
              <div className="text-slate-600">
                {activeProject?.managerName || "Eng. Roberto Albuquerque"}
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                {activeProject?.companyName}
              </div>
            </div>
          </div>
        </div>

        {/* Recent RDOs table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900 tracking-tight">
                Atividade recente
              </h2>
              <p className="text-[12px] text-slate-500 mt-0.5">
                Últimos RDOs registrados no canteiro
              </p>
            </div>
            <Link
              href="/rdo"
              className="text-[12px] font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 transition"
            >
              Ver todos
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">Carregando...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500">
                    <th className="py-3 px-6 font-medium text-[11px] uppercase tracking-wider">
                      Data
                    </th>
                    <th className="py-3 px-3 font-medium text-[11px] uppercase tracking-wider">
                      Nº
                    </th>
                    <th className="py-3 px-3 font-medium text-[11px] uppercase tracking-wider">
                      Clima
                    </th>
                    <th className="py-3 px-3 font-medium text-[11px] uppercase tracking-wider">
                      Efetivo
                    </th>
                    <th className="py-3 px-3 font-medium text-[11px] uppercase tracking-wider">
                      Atividade
                    </th>
                    <th className="py-3 px-3 font-medium text-[11px] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="py-3 px-6 font-medium text-[11px] uppercase tracking-wider text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rdosList.slice(0, 5).map((rdo) => (
                    <tr key={rdo.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-6 font-medium text-slate-900 whitespace-nowrap">
                        {rdo.dayOfWeek}, {rdo.date.split("-").reverse().join("/")}
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 font-mono text-[12px]">
                        #{rdo.rdoNumber}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap text-[12px] capitalize">
                        {rdo.weatherMorning} / {rdo.weatherAfternoon}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap text-[12px]">
                        <span className="font-semibold text-slate-900">
                          {rdo.totalHeadcount}
                        </span>
                        <span className="text-slate-500 ml-1">
                          ({rdo.ownTeamCount}+{rdo.contractorTeamCount})
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 max-w-xs truncate text-[12px]">
                        {rdo.activitiesSummary || "—"}
                      </td>
                      <td className="py-3.5 px-3">
                        {rdo.hasOccurrences ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Ocorrência
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => setSelectedRdoId(rdo.id)}
                          className="text-[12px] font-medium text-slate-700 hover:text-slate-900 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition"
                        >
                          Detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <RdoDetailModal
        rdoId={selectedRdoId}
        isOpen={Boolean(selectedRdoId)}
        onClose={() => setSelectedRdoId(null)}
        onRefresh={() => fetchDashboardData()}
      />
    </AppLayout>
  );
}
