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
  ClipboardCheck,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { RdoDetailModal } from "@/components/RdoDetailModal";
import {
  calculateQualityScore,
  calculateChecklistCompliance,
  calculateOverdueInspections,
} from "@/modules/quality";
import {
  calculateOperationalEvolution,
  calculateTopNrs,
  type WeeklyEvolutionItem,
} from "@/modules/rdo";
import type { RiskCategoryDistribution } from "@/modules/apr";

export default function DashboardPage() {
  const { activeProject, openCreateModal } = useApp();
  const [rdosList, setRdosList] = useState<any[]>([]);
  const [riskDistribution, setRiskDistribution] = useState<RiskCategoryDistribution[]>([]);
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
      console.error("fetchDashboardData error:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRiskDistribution = async () => {
    if (!activeProject) return;
    try {
      const q = new URLSearchParams({
        obraId: String(activeProject.id),
        codigo: activeProject.code || "",
        nome: activeProject.name || "",
      });
      const res = await fetch(`/api/apr/riscos-distribuicao?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.distribution) {
          setRiskDistribution(data.distribution);
        }
      }
    } catch (e) {
      console.warn("fetchRiskDistribution error:", e);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchRiskDistribution();
  }, [activeProject]);

  useEffect(() => {
    const handleCreated = () => {
      fetchDashboardData();
      fetchRiskDistribution();
    };
    window.addEventListener("rdo-created", handleCreated);
    return () => window.removeEventListener("rdo-created", handleCreated);
  }, [activeProject]);

  // Existing KPIs calculations
  const totalRdos = rdosList.length;
  const totalHh = rdosList.reduce((acc, r) => acc + (parseFloat(r.totalHh) || 0), 0);
  const totalOccurrences = rdosList.filter((r) => r.hasOccurrences).length;
  const latestRdo = rdosList[0] || null;
  const todayHeadcount = latestRdo?.totalHeadcount || 0;
  const ownHeadcount = latestRdo?.ownTeamCount || 0;
  const contractorHeadcount = latestRdo?.contractorTeamCount || 0;
  const qualityScore = calculateQualityScore(totalOccurrences);

  // Incremental metrics calculations
  const allNonConfs = rdosList.flatMap((r) => r.nonConformitiesList || []);
  const topNrs = calculateTopNrs(allNonConfs);
  const evolutionData = calculateOperationalEvolution(rdosList);
  const checklistCompliance = calculateChecklistCompliance([]);
  const overdueInspections = calculateOverdueInspections([]);

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
            <Plus className="w-4 h-4" strokeWidth={2.2} />
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

        {/* Incremental Small Cards: Checklists, Inspeções Vencidas e Top 3 NRs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Card: Conformidade dos checklists */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <ClipboardCheck className="w-4 h-4 text-emerald-600" strokeWidth={2} />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Checklists
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-semibold text-slate-900 tracking-tight">
                {checklistCompliance.percentage !== null
                  ? `${checklistCompliance.percentage}%`
                  : "—"}
              </span>
            </div>
            <div className="text-[13px] font-semibold text-slate-900 tracking-tight mt-1">
              Conformidade dos checklists
            </div>
            <div className="text-[12px] text-slate-500 mt-0.5">
              {checklistCompliance.percentage !== null
                ? `${checklistCompliance.conformCount} de ${checklistCompliance.evaluatedCount} itens conformes`
                : "Sem checklists avaliados no período"}
            </div>
          </div>

          {/* Card: Inspeções vencidas */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  overdueInspections.overdueCount > 0
                    ? "bg-rose-50 text-rose-600"
                    : "bg-amber-50 text-amber-600"
                }`}
              >
                <AlertCircle className="w-4 h-4" strokeWidth={2} />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Inspeções
              </span>
            </div>
            <div
              className={`text-2xl font-semibold tracking-tight ${
                overdueInspections.overdueCount > 0 ? "text-rose-600" : "text-slate-900"
              }`}
            >
              {String(overdueInspections.overdueCount).padStart(2, "0")}
            </div>
            <div className="text-[13px] font-semibold text-slate-900 tracking-tight mt-1">
              Inspeções vencidas
            </div>
            <div className="text-[12px] text-slate-500 mt-0.5">
              {overdueInspections.overdueCount > 0
                ? "Inspeções pendentes com prazo expirado"
                : "Nenhuma inspeção em atraso"}
            </div>
          </div>

          {/* Card: Top 3 NRs com não conformidades */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4 text-slate-700" strokeWidth={2} />
                </div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  Ranking SST
                </span>
              </div>
              <div className="text-[13px] font-semibold text-slate-900 tracking-tight mb-2">
                Top 3 NRs com não conformidades
              </div>
            </div>

            {topNrs.length > 0 ? (
              <div className="space-y-1.5 mt-0.5">
                {topNrs.map((item) => (
                  <div key={item.nr} className="flex items-center justify-between text-[12px]">
                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                      <span className="w-4 text-[10px] font-bold text-slate-400">
                        {item.rank}º
                      </span>
                      <span>{item.nr}</span>
                    </span>
                    <span className="text-slate-500 font-semibold tabular-nums text-[11px]">
                      {item.count} {item.count === 1 ? "registro" : "registros"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[12px] text-slate-500 mt-0.5">
                Nenhuma não conformidade registrada no período
              </div>
            )}
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
                <Plus className="w-4.5 h-4.5 text-white" strokeWidth={2.2} />
              </div>
              <div className="flex-1">
                <div className="text-[13.5px] font-semibold text-slate-900">
                  Lançar RDO do dia
                </div>
                <div className="text-[11.5px] text-slate-500">
                  Preenchimento em 6 etapas
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
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

        {/* Incremental Charts Section: Evolução Operacional & Distribuição de Riscos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico: Evolução Operacional */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900 tracking-tight">
                  Evolução operacional
                </h2>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Mão de obra registrada por semana
                </p>
              </div>
              <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                Média diária (efetivo)
              </span>
            </div>

            <div className="p-6">
              <OperationalEvolutionChart data={evolutionData} />
            </div>
          </div>

          {/* Gráfico: Distribuição de Riscos Registrados */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900 tracking-tight">
                  Distribuição de riscos registrados
                </h2>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Classificação APR da obra
                </p>
              </div>
              <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                Matriz 3×3
              </span>
            </div>

            <RiskDistributionChart distribution={riskDistribution} />
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

/**
 * Gráfico de Linhas: Evolução Operacional
 * Sem bibliotecas pesadas, renderizado via SVG responsivo e Tailwind.
 */
function OperationalEvolutionChart({ data }: { data: WeeklyEvolutionItem[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs">
        <TrendingUp className="w-6 h-6 mb-1.5 text-slate-300 stroke-[1.5]" />
        <span>Nenhum dado semanal registrado no período</span>
      </div>
    );
  }

  const width = 540;
  const height = 180;
  const paddingX = 45;
  const paddingTop = 25;
  const paddingBottom = 35;

  const maxVal = Math.max(10, ...data.map((d) => d.averageHeadcount));
  const ceilMax = Math.ceil(maxVal * 1.25);

  const getX = (idx: number) => {
    if (data.length === 1) return width / 2;
    return paddingX + (idx / (data.length - 1)) * (width - paddingX * 2);
  };

  const getY = (val: number) => {
    const usableH = height - paddingTop - paddingBottom;
    return height - paddingBottom - (val / ceilMax) * usableH;
  };

  const points = data.map((d, i) => ({
    x: getX(i),
    y: getY(d.averageHeadcount),
    item: d,
  }));

  const pathD = points.reduce(
    (acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`,
    ""
  );

  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)},${height - paddingBottom} L ${points[0].x.toFixed(1)},${height - paddingBottom} Z`;

  // Horizontal grid lines
  const gridSteps = 3;
  const gridLines = Array.from({ length: gridSteps + 1 }, (_, i) => {
    const val = Math.round((ceilMax / gridSteps) * i);
    const y = getY(val);
    return { val, y };
  });

  const activeItem = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="relative">
      {/* Tooltip */}
      {activeItem && (
        <div
          className="absolute z-10 pointer-events-none -top-1 bg-slate-900 text-white text-[11px] rounded-lg px-2.5 py-1.5 shadow-lg transform -translate-x-1/2 transition-all flex flex-col items-center"
          style={{
            left: `${(activeItem.x / width) * 100}%`,
          }}
        >
          <span className="font-semibold">{activeItem.item.weekLabel}</span>
          <span className="text-slate-300">
            {activeItem.item.averageHeadcount.toFixed(1)} operários/dia
          </span>
          <span className="text-slate-400 text-[10px]">
            {activeItem.item.daysRecorded} {activeItem.item.daysRecorded === 1 ? "dia registrado" : "dias registrados"}
          </span>
        </div>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-44 overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0F172A" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line
              x1={paddingX}
              y1={g.y}
              x2={width - paddingX}
              y2={g.y}
              stroke="#F1F5F9"
              strokeDasharray={i === 0 ? "0" : "3 3"}
              strokeWidth="1"
            />
            <text
              x={paddingX - 10}
              y={g.y + 3.5}
              textAnchor="end"
              className="text-[10px] fill-slate-400 font-medium"
            >
              {g.val}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaD} fill="url(#areaGradient)" />

        {/* Line stroke */}
        <path
          d={pathD}
          fill="none"
          stroke="#0F172A"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points and labels */}
        {points.map((pt, i) => {
          const isHovered = hoveredIdx === i;
          return (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Invisible larger hover hit area */}
              <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />

              {/* Point circle */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? "5.5" : "3.5"}
                fill="#FFFFFF"
                stroke="#0F172A"
                strokeWidth={isHovered ? "2.5" : "2"}
                className="transition-all"
              />

              {/* X-axis label */}
              <text
                x={pt.x}
                y={height - 12}
                textAnchor="middle"
                className={`text-[11px] font-medium transition-colors ${
                  isHovered ? "fill-slate-900 font-semibold" : "fill-slate-500"
                }`}
              >
                {pt.item.weekLabel}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Gráfico de Barras Horizontais: Distribuição de riscos registrados
 * Segue à risca as regras:
 * - Exatamente 3 categorias: Baixo, Médio, Alto (sem Crítico)
 * - Cores obrigatórias: #57A98B, #D6AE58, #DF7953
 * - Rótulo ~52px, barra ~10px altura, rounded-full, fundo bg-slate-100, alinhamento à direita.
 */
function RiskDistributionChart({
  distribution,
}: {
  distribution: RiskCategoryDistribution[];
}) {
  const items =
    distribution && distribution.length > 0
      ? distribution
      : [
          { category: "Baixo" as const, count: 0, percentage: 0, color: "#57A98B" },
          { category: "Médio" as const, count: 0, percentage: 0, color: "#D6AE58" },
          { category: "Alto" as const, count: 0, percentage: 0, color: "#DF7953" },
        ];

  const totalRisks = items.reduce((acc, it) => acc + it.count, 0);

  return (
    <div className="p-6 flex flex-col justify-between h-[210px]">
      <div className="space-y-3 pt-2">
        {items.map((item) => (
          <div key={item.category} className="flex items-center gap-3">
            <span className="w-[52px] text-[12px] font-medium text-slate-600">
              {item.category}
            </span>
            <div className="flex-1 h-[10px] bg-slate-100 rounded-full overflow-hidden">
              <div
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.color,
                }}
                className="h-full rounded-full transition-all duration-500"
              />
            </div>
            <span className="w-8 text-right text-[12px] font-semibold text-slate-800 tabular-nums">
              {item.count}
            </span>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>{totalRisks} riscos mapeados em APR</span>
        <span>Proporção normalizada</span>
      </div>
    </div>
  );
}
