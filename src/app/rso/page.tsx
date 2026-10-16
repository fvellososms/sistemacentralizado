"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useApp } from "@/context/AppContext";
import {
  CalendarDays,
  Printer,
  FileSpreadsheet,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Camera,
  Sparkles,
  Plus,
} from "lucide-react";
import { PhotoCard } from "@/components/PhotoCard";

export default function RsoPage() {
  const { activeProject } = useApp();

  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [manualModalOpen, setManualModalOpen] = useState(false);

  const [manualTitle, setManualTitle] = useState("");
  const [manualHh, setManualHh] = useState("240");
  const [manualHeadcount, setManualHeadcount] = useState("18");
  const [manualActivities, setManualActivities] = useState("");
  const [manualOccurrences, setManualOccurrences] = useState("");

  const getWeekDates = (offset: number) => {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1) + offset * 7;
    const monday = new Date(now.setDate(diffToMonday));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const formatYMD = (d: Date) => d.toISOString().split("T")[0];
    return {
      startDate: formatYMD(monday),
      endDate: formatYMD(sunday),
      startDisplay: monday.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }),
      endDisplay: sunday.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }),
    };
  };

  const weekInfo = getWeekDates(selectedWeekOffset);

  const fetchRsoData = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/rso?projectId=${activeProject.id}&startDate=${weekInfo.startDate}&endDate=${weekInfo.endDate}`
      );
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRsoData();
  }, [activeProject, selectedWeekOffset]);

  const handlePrint = () => {
    window.print();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Relatório Semanal Manual registrado para a obra!");
    setManualModalOpen(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Consolidação Periódica
            </span>
            <h1 className="text-[20px] md:text-[22px] font-semibold text-slate-900 tracking-tight flex items-center gap-2.5 mt-1">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <CalendarDays className="w-4.5 h-4.5 text-blue-600" strokeWidth={2} />
              </div>
              <span>Relatório Semanal</span>
            </h1>
            <p className="text-[12.5px] text-slate-500 mt-1.5">
              {weekInfo.startDisplay} → {weekInfo.endDisplay}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <div className="flex items-center gap-0.5 bg-white border border-slate-200/80 rounded-xl p-0.5">
              <button
                onClick={() => setSelectedWeekOffset(selectedWeekOffset - 1)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-600"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <span className="text-[12px] font-medium px-2 text-slate-700 whitespace-nowrap">
                {selectedWeekOffset === 0
                  ? "Esta semana"
                  : selectedWeekOffset === -1
                  ? "Semana anterior"
                  : `${Math.abs(selectedWeekOffset)} sem. atrás`}
              </span>
              <button
                onClick={() => setSelectedWeekOffset(selectedWeekOffset + 1)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-600"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            <button
              onClick={() => setManualModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-[12px] font-medium bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 transition"
            >
              Manual
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-7 py-4 rounded-xl text-[16px] font-medium text-white bg-slate-900 hover:bg-slate-800 transition active:scale-[0.98] shadow-sm"
            >
              <Printer className="w-6 h-6" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-slate-200/80 text-slate-400 text-[13px]">
            Carregando consolidação semanal...
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4 text-blue-600" strokeWidth={2} />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    RDOs
                  </span>
                </div>
                <div className="text-[24px] font-semibold text-slate-900 tabular-nums">
                  {data?.summary?.totalRdos || 0}
                </div>
                <div className="text-[11.5px] text-slate-500 mt-0.5">
                  {data?.summary?.totalDaysWorked || 0} trab · {data?.summary?.totalDaysHalted || 0} par
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/80">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-indigo-600" strokeWidth={2} />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    HH
                  </span>
                </div>
                <div className="text-[24px] font-semibold text-slate-900 tabular-nums">
                  {data?.summary?.totalHh || "0.0"}
                </div>
                <div className="text-[11.5px] text-slate-500 mt-0.5">
                  Homens-hora semanais
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/80">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                    <Users className="w-4 h-4 text-sky-600" strokeWidth={2} />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Média
                  </span>
                </div>
                <div className="text-[24px] font-semibold text-slate-900 tabular-nums">
                  {data?.summary?.avgHeadcount || 0}
                </div>
                <div className="text-[11.5px] text-slate-500 mt-0.5">Operários / dia</div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/80">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-amber-600" strokeWidth={2} />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Ocorrências
                  </span>
                </div>
                <div className="text-[24px] font-semibold text-slate-900 tabular-nums">
                  {data?.summary?.totalOccurrences || 0}
                </div>
                <div className="text-[11.5px] text-slate-500 mt-0.5">Desvios registrados</div>
              </div>
            </div>

            {/* Activities */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-[14.5px] font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                    Atividades da semana
                  </h2>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    Consolidação dos serviços executados no período
                  </p>
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {data?.activities?.length || 0}
                </span>
              </div>

              {data?.activities && data.activities.length > 0 ? (
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {data.activities.map((act: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-[13px] font-medium text-slate-900">
                          {act.description}
                        </div>
                        <div className="text-[11.5px] text-slate-500">📍 {act.location}</div>
                      </div>
                      <span
                        className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                          act.status === "concluido"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-blue-50 text-blue-700 border border-blue-100"
                        }`}
                      >
                        {act.status === "concluido" ? "Concluído" : "Andamento"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center text-slate-400 text-[12.5px]">
                  Nenhum registro nesta semana. Use o botão "Manual" para preencher.
                </div>
              )}
            </div>

            {/* Contractors */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-[14.5px] font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-500" strokeWidth={2} />
                  Frentes terceirizadas ativas
                </h2>
              </div>
              {data?.contractors && data.contractors.length > 0 ? (
                <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {Array.from(new Set(data.contractors.map((c: any) => c.companyName))).map(
                    (companyName: any, i) => {
                      const sample = data.contractors.find((c: any) => c.companyName === companyName);
                      return (
                        <div key={i} className="p-3.5 rounded-xl bg-slate-50/50 border border-slate-100">
                          <div className="text-[12.5px] font-semibold text-slate-900">
                            {companyName}
                          </div>
                          <div className="text-[11.5px] text-slate-500 mt-0.5">{sample?.trade}</div>
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 text-[12px] italic">
                  Sem empreiteiros registrados.
                </div>
              )}
            </div>

            {/* Occurrences */}
            {data?.occurrences && data.occurrences.length > 0 && (
              <div className="bg-white rounded-2xl border border-amber-200/80 overflow-hidden">
                <div className="px-5 py-4 border-b border-amber-100">
                  <h2 className="text-[14.5px] font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" strokeWidth={2} />
                    Ocorrências da semana
                  </h2>
                </div>
                <div className="p-5 space-y-2">
                  {data.occurrences.map((occ: any, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 text-[12.5px]">
                      <div className="font-semibold text-amber-950">
                        #{i + 1} {occ.title}{" "}
                        <span className="font-normal text-amber-700">({occ.category})</span>
                      </div>
                      <p className="text-slate-700 mt-1">{occ.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photos */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-[14.5px] font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                    <Camera className="w-4 h-4 text-slate-500" strokeWidth={2} />
                    Galeria semanal
                  </h2>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    Fotos georreferenciadas com carimbo técnico
                  </p>
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {data?.photos?.length || 0}
                </span>
              </div>

              {data?.photos && data.photos.length > 0 ? (
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {data.photos.map((photo: any) => (
                    <PhotoCard key={photo.id} photo={photo} canDelete={false} />
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center text-slate-400 text-[12.5px]">
                  Nenhuma foto anexada nesta semana.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manual Modal */}
        {manualModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-[15px] font-semibold text-slate-900">
                  RSO Manual
                </h3>
                <button
                  onClick={() => setManualModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11.5px] font-semibold text-slate-700 mb-1.5">
                    Título do período
                  </label>
                  <input
                    type="text"
                    required
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="Ex: Semana 36 — Fundação e Estrutura"
                    className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11.5px] font-semibold text-slate-700 mb-1.5">
                      HH Total
                    </label>
                    <input
                      type="number"
                      value={manualHh}
                      onChange={(e) => setManualHh(e.target.value)}
                      className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-semibold text-slate-700 mb-1.5">
                      Efetivo Médio
                    </label>
                    <input
                      type="number"
                      value={manualHeadcount}
                      onChange={(e) => setManualHeadcount(e.target.value)}
                      className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11.5px] font-semibold text-slate-700 mb-1.5">
                    Atividades
                  </label>
                  <textarea
                    rows={3}
                    value={manualActivities}
                    onChange={(e) => setManualActivities(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[11.5px] font-semibold text-slate-700 mb-1.5">
                    Ocorrências
                  </label>
                  <textarea
                    rows={2}
                    value={manualOccurrences}
                    onChange={(e) => setManualOccurrences(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setManualModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-[12.5px] font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-7 py-4 rounded-xl text-[14.5px] font-medium text-white bg-slate-900 hover:bg-slate-800 transition"
                  >
                    <Plus className="w-6 h-6" />
                    Salvar RSO
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
