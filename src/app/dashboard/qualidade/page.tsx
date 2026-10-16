"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/AppLayout";
import {
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  Filter,
} from "lucide-react";

export default function QualidadePage() {
  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  const nonConformitiesList = [
    {
      id: 1,
      rdoNumber: 139,
      date: "02/09/2026",
      area: "Bloco A · 5º Pavimento",
      title: "Falta de guarda-corpo provisório na abertura do poço de ventilação",
      severity: "alta",
      action: "Instalado imediatamente guarda-corpo duplo em madeira compensada com altura de 1,20m e rodapé de 20cm conforme NR-18.",
      technician: "Téc. Marcos Vinicius",
    },
    {
      id: 2,
      rdoNumber: 137,
      date: "31/08/2026",
      area: "Bloco B · 3º Pavimento",
      title: "Espaçadores plásticos insuficientes na armadura do pilar P18",
      severity: "media",
      action: "Reposicionados espaçadores tipo roseta garantindo cobrimento mínimo de 2,5 cm antes da concretagem.",
      technician: "Alberto Martins",
    },
    {
      id: 3,
      rdoNumber: 135,
      date: "28/08/2026",
      area: "Subsolo 1 · Garagem",
      title: "Acúmulo pontual de água pluvial próximo ao quadro elétrico provisório",
      severity: "alta",
      action: "Instalada bomba submersível sapo para drenagem e elevado quadro provisório para 1,50m do piso.",
      technician: "Téc. Marcos Vinicius",
    },
    {
      id: 4,
      rdoNumber: 133,
      date: "26/08/2026",
      area: "Fachada Leste",
      title: "Linha de vida sem laudo atualizado de inspeção visual semanal",
      severity: "baixa",
      action: "Realizada inspeção e assinado checklist técnico com fita de aprovação verde.",
      technician: "Alberto Martins",
    },
  ];

  const filteredItems = nonConformitiesList.filter(
    (item) => filterSeverity === "all" || item.severity === filterSeverity
  );

  const filters = [
    { id: "all", label: "Todas" },
    { id: "alta", label: "Alta" },
    { id: "media", label: "Média" },
    { id: "baixa", label: "Baixa" },
  ];

  const severityStyle: Record<string, { dot: string; bg: string; text: string; border: string }> = {
    alta: { dot: "bg-red-500", bg: "bg-red-50/50", text: "text-red-700", border: "border-red-100" },
    media: { dot: "bg-amber-500", bg: "bg-amber-50/50", text: "text-amber-700", border: "border-amber-100" },
    baixa: { dot: "bg-slate-400", bg: "bg-slate-50/50", text: "text-slate-700", border: "border-slate-100" },
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-slate-900 mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao dashboard</span>
          </Link>
          <h1 className="text-[20px] md:text-[22px] font-semibold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" strokeWidth={2} />
            </div>
            <span>Gestão da Qualidade</span>
          </h1>
          <p className="text-[12.5px] text-slate-500 mt-1">
            Conformidades técnicas, normas de segurança NR-18 e auditorias de canteiro.
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80">
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
              Índice de Qualidade
            </span>
            <div className="text-[26px] font-semibold text-slate-900 mt-2 tracking-tight tabular-nums">
              96.8<span className="text-slate-400 text-lg">%</span>
            </div>
            <div className="text-[11.5px] text-emerald-600 font-medium mt-0.5">Meta: &gt; 92%</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80">
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
              Apontamentos
            </span>
            <div className="text-[26px] font-semibold text-slate-900 mt-2 tracking-tight tabular-nums">
              {nonConformitiesList.length}
            </div>
            <div className="text-[11.5px] text-slate-500 mt-0.5">No mês corrente</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80">
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
              Resolvidos
            </span>
            <div className="text-[26px] font-semibold text-emerald-600 mt-2 tracking-tight tabular-nums">
              {nonConformitiesList.length}
            </div>
            <div className="text-[11.5px] text-emerald-600 font-medium mt-0.5">100% tratados</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80">
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
              Tempo Médio
            </span>
            <div className="text-[26px] font-semibold text-slate-900 mt-2 tracking-tight tabular-nums">
              1.8<span className="text-slate-400 text-lg">h</span>
            </div>
            <div className="text-[11.5px] text-slate-500 mt-0.5">Resolução no turno</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-[12px] text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtrar:</span>
          </div>
          <div className="flex items-center gap-1 p-0.5 bg-white border border-slate-200/80 rounded-xl">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterSeverity(f.id)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition ${
                  filterSeverity === f.id
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="text-[11.5px] text-slate-500 ml-auto">
            {filteredItems.length} registro{filteredItems.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* List */}
        <div className="space-y-2.5">
          {filteredItems.map((item) => {
            const style = severityStyle[item.severity];
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold uppercase tracking-wider ${style.text} ${style.bg} ${style.border} border`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        {item.severity}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">RDO #{item.rdoNumber}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-[11.5px] text-slate-500 font-medium">{item.date}</span>
                    </div>

                    <h3 className="text-[14px] font-semibold text-slate-900">{item.title}</h3>
                    <div className="text-[12px] text-slate-500">
                      📍 {item.area}
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-[12px] text-emerald-900">
                      <span className="font-semibold">Ação corretiva: </span>
                      {item.action}
                    </div>
                  </div>

                  <div className="flex md:flex-col items-center md:items-end gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <CheckCircle2 className="w-3 h-3" strokeWidth={2.2} />
                      Resolvido
                    </span>
                    <span className="text-[11px] text-slate-500">{item.technician}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
