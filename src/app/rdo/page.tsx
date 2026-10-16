"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import { useApp } from "@/context/AppContext";
import {
  List,
  Calendar as CalendarIcon,
  BarChart3,
  Plus,
  Eye,
  Printer,
  Edit3,
  Trash2,
  CloudSun,
  Users,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  Search,
  HardHat,
} from "lucide-react";
import { RdoDetailModal } from "@/components/RdoDetailModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { RdoModal } from "@/components/RdoModal";

function RdoContent() {
  const searchParams = useSearchParams();
  const initialView = searchParams.get("view") || "lista";
  const {
    activeProject,
    openCreateModal,
    hasLocalDraft,
    setHasLocalDraft,
  } = useApp();

  const [currentView, setCurrentView] = useState<"lista" | "calendario" | "histograma">(
    initialView === "calendario" || initialView === "histograma" ? initialView : "lista"
  );

  useEffect(() => {
    if (initialView === "calendario" || initialView === "histograma" || initialView === "lista") {
      setCurrentView(initialView);
    }
  }, [initialView]);

  const [rdosList, setRdosList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [detailRdoId, setDetailRdoId] = useState<number | null>(null);
  const [editRdoData, setEditRdoData] = useState<any | null>(null);
  const [rdoToDelete, setRdoToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  
  const [calendarDate, setCalendarDate] = useState(() => new Date());

  const [draftMetadata, setDraftMetadata] = useState<any>(null);

  useEffect(() => {
    if (hasLocalDraft && typeof window !== "undefined") {
      try {
        const draft = JSON.parse(localStorage.getItem("rdo_draft_v1") || "{}");
        setDraftMetadata(draft);
      } catch (e) {}
    } else {
      setDraftMetadata(null);
    }
  }, [hasLocalDraft]);

  const fetchRdos = async () => {
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
    fetchRdos();
  }, [activeProject]);

  useEffect(() => {
    const handleCreated = () => fetchRdos();
    window.addEventListener("rdo-created", handleCreated);
    return () => window.removeEventListener("rdo-created", handleCreated);
  }, [activeProject]);

  const handleDeleteConfirm = async () => {
    if (!rdoToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/rdos/${rdoToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        setRdosList((prev) => prev.filter((r) => r.id !== rdoToDelete.id));
        setRdoToDelete(null);
      } else {
        alert("Erro ao excluir RDO.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrintSingle = (rdoId: number) => {
    setDetailRdoId(rdoId);
    setTimeout(() => {
      window.print();
    }, 400);
  };

  
  const filteredRdos = useMemo(() => {
    let list = rdosList;
    if (draftMetadata) {
      const dummyDraft = {
        id: "draft",
        isDraft: true,
        rdoNumber: "RASCUNHO",
        date: draftMetadata.date || new Date().toISOString().split("T")[0],
        dayOfWeek: draftMetadata.dayOfWeek || "Seg",
        totalHh: "---",
        activitiesSummary: draftMetadata.activities?.length ? draftMetadata.activities[0].description : "Rascunho não finalizado...",
        dayStatus: draftMetadata.dayStatus || "trabalhando",
        hasOccurrences: false,
        totalHeadcount: "---",
        ownTeamCount: draftMetadata.ownTeamCount || 0,
        contractorTeamCount: "---",
        weatherMorning: draftMetadata.weatherMorning || "sol",
        weatherAfternoon: draftMetadata.weatherAfternoon || "sol",
        photosCount: 0
      };
      list = [dummyDraft, ...list];
    }

    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(
      (r) =>
        r.date?.includes(term) ||
        r.dayOfWeek?.toLowerCase().includes(term) ||
        r.activitiesSummary?.toLowerCase().includes(term) ||
        String(r.rdoNumber).includes(term) ||
        r.isDraft
    );
  }, [rdosList, searchTerm, draftMetadata]);


  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(calendarDate);
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const rdoByDate = useMemo(() => {
    const map: Record<string, any> = {};
    rdosList.forEach((r) => {
      map[r.date] = r;
    });
    return map;
  }, [rdosList]);

  const monthStats = useMemo(() => {
    let filled = 0;
    let withOccurrences = 0;
    let totalHhMonth = 0;

    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const found = rdoByDate[dateStr];
      if (found) {
        filled++;
        if (found.hasOccurrences) withOccurrences++;
        totalHhMonth += parseFloat(found.totalHh) || 0;
      }
    }
    const withoutRdo = Math.max(0, daysInCurrentMonth - filled);
    return { filled, withOccurrences, withoutRdo, totalHhMonth: totalHhMonth.toFixed(1) };
  }, [daysInCurrentMonth, rdoByDate, year, month]);

  const viewModes = [
    { id: "lista" as const, label: "Lista", icon: List },
    { id: "calendario" as const, label: "Calendário", icon: CalendarIcon },
    { id: "histograma" as const, label: "Histograma", icon: BarChart3 },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Draft notice */}
        {hasLocalDraft && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4" strokeWidth={2.2} />
              </div>
              <div>
                <h4 className="text-[13px] font-semibold text-amber-950">
                  Rascunho em andamento
                </h4>
                <p className="text-[12px] text-amber-800">
                  Você pode continuar de onde parou.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    localStorage.removeItem("rdo_draft_v1");
                    setHasLocalDraft(false);
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-amber-800 hover:bg-amber-100 transition"
              >
                Descartar
              </button>
              <button
                onClick={() => openCreateModal()}
                className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium bg-slate-900 text-white hover:bg-slate-800 transition"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* View switcher + actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-[20px] md:text-[22px] font-semibold text-slate-900 tracking-tight">
              Registros Diários de Obra
            </h1>
            <p className="text-[12.5px] text-slate-500 mt-0.5">
              Gerencie, edite e visualize os RDOs da obra ativa.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center p-0.5 bg-white border border-slate-200/80 rounded-xl">
              {viewModes.map((v) => {
                const Icon = v.icon;
                const isActive = currentView === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setCurrentView(v.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="w-6 h-6" strokeWidth={2} />
                    <span className="hidden sm:inline">{v.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => openCreateModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-medium text-white bg-slate-900 hover:bg-slate-800 transition active:scale-[0.98] shadow-sm"
            >
              <Plus className="w-6 h-6" strokeWidth={2.2} />
              <span className="hidden sm:inline">Criar RDO</span>
            </button>
          </div>
        </div>

        {/* Search bar (only for list) */}
        {currentView === "lista" && (
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por data, número ou atividade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 text-[13px] rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-300 transition"
            />
          </div>
        )}

        {/* LISTA */}
        {currentView === "lista" && (
          <div className="space-y-2.5">
            {loading ? (
              <div className="p-16 text-center bg-white rounded-2xl border border-slate-200/80 text-slate-400 text-[13px]">
                Carregando registros...
              </div>
            ) : filteredRdos.length === 0 ? (
              <div className="p-16 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <HardHat className="w-5 h-5 text-slate-400" />
                </div>
                <h3 className="text-[14px] font-semibold text-slate-700">
                  Nenhum RDO encontrado
                </h3>
                <p className="text-[12px] text-slate-500 mt-1 max-w-sm mx-auto">
                  Comece a documentar o dia a dia do canteiro criando seu primeiro registro.
                </p>
              </div>
            ) : (
              filteredRdos.map((rdo) => {
                const formattedDate = `${rdo.dayOfWeek}, ${rdo.date.split("-").reverse().join("/")}`;
                return (
                  <div
                    key={rdo.id}
                    className="group bg-white rounded-2xl p-4 md:p-5 border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-[14px] text-slate-900 capitalize">
                            {formattedDate}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            #{rdo.rdoNumber}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-[12px] font-medium text-slate-600 tabular-nums">
                            {rdo.totalHh} HH
                          </span>

                          
                          {rdo.isDraft ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                              Rascunho
                            </span>
                          ) : rdo.dayStatus === "paralisado_chuva" ? (

                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-red-50 text-red-700 border border-red-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              Paralisado
                            </span>
                          ) : rdo.hasOccurrences ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-amber-50 text-amber-700 border border-amber-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              {rdo.occurrencesCount} ocorrência{rdo.occurrencesCount > 1 ? "s" : ""}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Concluído
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <CloudSun className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.8} />
                            <span className="capitalize">
                              {rdo.weatherMorning} / {rdo.weatherAfternoon}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.8} />
                            <span>
                              <span className="font-semibold text-slate-900">
                                {rdo.totalHeadcount}
                              </span>{" "}
                              ({rdo.ownTeamCount}+{rdo.contractorTeamCount})
                            </span>
                          </div>
                          {rdo.photosCount > 0 && (
                            <span className="text-slate-500 text-[11.5px]">
                              📷 {rdo.photosCount}
                            </span>
                          )}
                        </div>

                        <div className="text-[12.5px] text-slate-700 line-clamp-2 pt-1 border-t border-slate-100">
                          <span className="font-medium text-slate-900">Atividades: </span>
                          {rdo.activitiesSummary || "Nenhuma atividade detalhada."}
                        </div>
                      </div>

                      
                      <div className="flex items-center justify-end gap-1 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                        {rdo.isDraft ? (
                          <button
                            onClick={() => openCreateModal()}
                            className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium bg-slate-900 text-white hover:bg-slate-800 transition"
                          >
                            Continuar
                          </button>
                        ) : (
                          <>
                        <button
                          onClick={() => setDetailRdoId(rdo.id)}
                          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                          title="Ver detalhes"
                        >
                          <Eye className="w-6 h-6" strokeWidth={1.8} />
                        </button>
                        <button
                          onClick={() => handlePrintSingle(rdo.id)}
                          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                          title="Imprimir"
                        >
                          <Printer className="w-6 h-6" strokeWidth={1.8} />
                        </button>
                        <button
                          onClick={() => {
                            fetch(`/api/rdos/${rdo.id}`)
                              .then((res) => res.json())
                              .then((data) => {
                                if (data.rdo) setEditRdoData(data.rdo);
                              });
                          }}
                          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                          title="Editar"
                        >
                          <Edit3 className="w-6 h-6" strokeWidth={1.8} />
                        </button>
                        <button
                          onClick={() => setRdoToDelete(rdo)}
                          className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                          title="Excluir">
                          <Trash2 className="w-6 h-6" strokeWidth={1.8} />
                        </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* CALENDARIO */}
        {currentView === "calendario" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-[16px] font-semibold text-slate-900 capitalize tracking-tight">
                  {monthName} de {year}
                </h2>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setCalendarDate(new Date())}
                    className="px-2.5 py-1 rounded-lg text-[11.5px] font-medium text-slate-700 hover:bg-slate-100 transition"
                  >
                    Hoje
                  </button>
                  <button
                    onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 px-3 pt-3 text-center text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                  <div key={d} className="py-2">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 p-3">
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-20" />
                ))}

                {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                  const rdoForDay = rdoByDate[dateStr];

                  let bgClass = "bg-slate-50 hover:bg-slate-100/80 border-slate-100";
                  let textClass = "text-slate-700";
                  let dotClass = "bg-slate-300";

                  if (rdoForDay) {
                    if (rdoForDay.dayStatus === "paralisado_chuva") {
                      bgClass = "bg-red-50/70 hover:bg-red-50 border-red-100";
                      textClass = "text-red-900";
                      dotClass = "bg-red-500";
                    } else if (rdoForDay.hasOccurrences) {
                      bgClass = "bg-amber-50/70 hover:bg-amber-50 border-amber-100";
                      textClass = "text-amber-900";
                      dotClass = "bg-amber-500";
                    } else {
                      bgClass = "bg-emerald-50/70 hover:bg-emerald-50 border-emerald-100";
                      textClass = "text-emerald-900";
                      dotClass = "bg-emerald-500";
                    }
                  }

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => {
                        if (rdoForDay) setDetailRdoId(rdoForDay.id);
                        else openCreateModal(dateStr);
                      }}
                      className={`h-20 p-2 rounded-xl border text-left flex flex-col justify-between transition ${bgClass}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold text-[13px] ${textClass}`}>
                          {dayNum}
                        </span>
                        <div className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                      </div>
                      <div className="text-[10px] leading-tight truncate">
                        {rdoForDay ? (
                          <span className={`font-semibold ${textClass}`}>
                            #{rdoForDay.rdoNumber} · {rdoForDay.totalHeadcount}
                          </span>
                        ) : (
                          <span className="text-slate-400">+ Lançar</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Month summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 border-t border-slate-100">
                <div className="px-3 py-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-emerald-700 uppercase tracking-wider">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Preenchidos
                  </div>
                  <div className="text-[18px] font-semibold text-emerald-900 mt-1 tabular-nums">
                    {monthStats.filled}
                  </div>
                </div>
                <div className="px-3 py-2.5 rounded-xl bg-amber-50/60 border border-amber-100">
                  <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-amber-700 uppercase tracking-wider">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Ocorrência
                  </div>
                  <div className="text-[18px] font-semibold text-amber-900 mt-1 tabular-nums">
                    {monthStats.withOccurrences}
                  </div>
                </div>
                <div className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-slate-600 uppercase tracking-wider">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Sem RDO
                  </div>
                  <div className="text-[18px] font-semibold text-slate-800 mt-1 tabular-nums">
                    {monthStats.withoutRdo}
                  </div>
                </div>
                <div className="px-3 py-2.5 rounded-xl bg-blue-50/60 border border-blue-100">
                  <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-blue-700 uppercase tracking-wider">
                    <Clock className="w-3 h-3" strokeWidth={2.2} />
                    HH Total
                  </div>
                  <div className="text-[18px] font-semibold text-blue-900 mt-1 tabular-nums">
                    {monthStats.totalHhMonth}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HISTOGRAMA */}
        {currentView === "histograma" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-[16px] font-semibold text-slate-900 tracking-tight">
                Histograma de Mão de Obra
              </h2>
              <p className="text-[12.5px] text-slate-500 mt-0.5">
                Evolução do contingente operacional — próprios vs. terceiros.
              </p>
            </div>

            <div className="px-5 py-4 flex items-center gap-5 text-[11.5px] text-slate-500 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-slate-900" />
                <span>Equipe própria</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-blue-300" />
                <span>Empreiteiros</span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {rdosList.map((rdo) => {
                const maxCapacity = 35;
                const ownWidth = Math.min(100, ((rdo.ownTeamCount || 0) / maxCapacity) * 100);
                const contWidth = Math.min(100, ((rdo.contractorTeamCount || 0) / maxCapacity) * 100);
                const formattedDate = `${rdo.dayOfWeek}, ${rdo.date.split("-").reverse().join("/")}`;

                return (
                  <button
                    key={rdo.id}
                    type="button"
                    onClick={() => setDetailRdoId(rdo.id)}
                    className="w-full text-left space-y-1.5 group p-2 -mx-2 rounded-xl hover:bg-slate-50 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[12px] gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 capitalize">
                          {formattedDate}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          #{rdo.rdoNumber}
                        </span>
                        {rdo.hasOccurrences && (
                          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-amber-100 text-amber-700">
                            Ocorrência
                          </span>
                        )}
                      </div>
                      <div className="text-slate-500 font-medium tabular-nums text-[11.5px]">
                        {rdo.totalHeadcount} op · {rdo.totalHh} HH
                      </div>
                    </div>

                    <div className="h-5 w-full bg-slate-100 rounded-lg overflow-hidden flex">
                      <div
                        style={{ width: `${ownWidth}%` }}
                        className="h-full bg-slate-900 flex items-center justify-center text-[10px] text-white font-semibold transition-all"
                      >
                        {rdo.ownTeamCount > 2 && rdo.ownTeamCount}
                      </div>
                      <div
                        style={{ width: `${contWidth}%` }}
                        className="h-full bg-blue-300 flex items-center justify-center text-[10px] text-slate-900 font-semibold transition-all"
                      >
                        {rdo.contractorTeamCount > 2 && rdo.contractorTeamCount}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <RdoDetailModal
        rdoId={detailRdoId}
        isOpen={Boolean(detailRdoId)}
        onClose={() => setDetailRdoId(null)}
        onEdit={(rdo) => setEditRdoData(rdo)}
        onRefresh={() => fetchRdos()}
      />

      {editRdoData && (
        <RdoModal
          isOpen={Boolean(editRdoData)}
          onClose={() => setEditRdoData(null)}
          editData={editRdoData}
          onSuccess={() => {
            fetchRdos();
            setEditRdoData(null);
          }}
        />
      )}

      <ConfirmModal
        isOpen={Boolean(rdoToDelete)}
        title={`Excluir RDO #${rdoToDelete?.rdoNumber}?`}
        description={`Esta ação é permanente. O registro de ${rdoToDelete?.dayOfWeek}, ${rdoToDelete?.date?.split("-").reverse().join("/")}, todas as atividades, fotos e ocorrências serão apagados.`}
        confirmText="Sim, excluir definitivamente"
        requireTextConfirmation="EXCLUIR"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setRdoToDelete(null)}
        isLoading={isDeleting}
      />
    </AppLayout>
  );
}

export default function RdoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RdoContent />
    </Suspense>
  );
}
