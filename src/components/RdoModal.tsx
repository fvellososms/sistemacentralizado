"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  Trash2,
  Clock,
  Building,
  Image as ImageIcon,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

interface RdoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDate?: string;
  editData?: any;
}

interface ContractorItem {
  id?: number;
  companyName: string;
  trade: string;
  workerCount: number;
}

interface ActivityItem {
  id?: number;
  description: string;
  location: string;
  status: "em_andamento" | "concluido";
  hasOvertime: boolean;
  overtimeHours: string;
}

export const NR_CONSTRUCAO_CIVIL = [
  { value: "NR-18", label: "NR-18 - Segurança e Saúde na Construção Civil" },
  { value: "NR-35", label: "NR-35 - Trabalho em Altura" },
  { value: "NR-06", label: "NR-06 - Equipamentos de Proteção Individual (EPI)" },
  { value: "NR-10", label: "NR-10 - Instalações e Serviços em Eletricidade" },
  { value: "NR-12", label: "NR-12 - Máquinas e Equipamentos" },
  { value: "NR-01", label: "NR-01 - Gerenciamento de Riscos Ocupacionais (GRO/PGR)" },
  { value: "NR-11", label: "NR-11 - Movimentação e Armazenagem de Materiais" },
  { value: "NR-24", label: "NR-24 - Condições Sanitárias e de Conforto" },
  { value: "NR-26", label: "NR-26 - Sinalização de Segurança" },
  { value: "NR-33", label: "NR-33 - Espaços Confinados" },
  { value: "NR-23", label: "NR-23 - Proteção Contra Incêndios" },
  { value: "NR-17", label: "NR-17 - Ergonomia" },
];

export const DEMAIS_NRS = [
  { value: "NR-03", label: "NR-03 - Embargo e Interdição" },
  { value: "NR-04", label: "NR-04 - SESMT" },
  { value: "NR-05", label: "NR-05 - CIPA" },
  { value: "NR-07", label: "NR-07 - PCMSO" },
  { value: "NR-08", label: "NR-08 - Edificações" },
  { value: "NR-09", label: "NR-09 - Agentes Físicos, Químicos e Biológicos" },
  { value: "NR-13", label: "NR-13 - Caldeiras, Vasos de Pressão e Tubulações" },
  { value: "NR-14", label: "NR-14 - Fornos" },
  { value: "NR-15", label: "NR-15 - Atividades e Operações Insalubres" },
  { value: "NR-16", label: "NR-16 - Atividades e Operações Perigosas" },
  { value: "NR-19", label: "NR-19 - Explosivos" },
  { value: "NR-20", label: "NR-20 - Inflamáveis e Combustíveis" },
  { value: "NR-21", label: "NR-21 - Trabalhos a Céu Aberto" },
  { value: "NR-22", label: "NR-22 - Mineração" },
  { value: "NR-25", label: "NR-25 - Resíduos Industriais" },
  { value: "NR-28", label: "NR-28 - Fiscalização e Penalidades" },
  { value: "NR-29", label: "NR-29 - Trabalho Portuário" },
  { value: "NR-30", label: "NR-30 - Trabalho Aquaviário" },
  { value: "NR-31", label: "NR-31 - Trabalho Rural" },
  { value: "NR-32", label: "NR-32 - Serviços de Saúde" },
  { value: "NR-34", label: "NR-34 - Construção e Reparação Naval" },
  { value: "NR-36", label: "NR-36 - Frigoríficos" },
  { value: "NR-37", label: "NR-37 - Plataformas de Petróleo" },
  { value: "NR-38", label: "NR-38 - Limpeza Urbana e Resíduos Sólidos" },
];

interface NonConformityItem {
  id?: number;
  description: string;
  nr?: string;
  customNr?: string;
  severity: "baixa" | "media" | "alta";
  correctiveAction: string;
  status: "resolvido" | "pendente";
}

interface OccurrenceItem {
  id?: number;
  category: string;
  title: string;
  description: string;
  impactedHours: string;
}

interface PhotoItem {
  id?: number;
  activityName: string;
  nonConformityText?: string;
  goodPracticeText?: string;
  caption?: string;
  photoUrl: string;
  timestamp: string;
  locationText: string;
  showWatermark: boolean;
}


const CONTRACTOR_SUGGESTIONS = [
  { name: "EletroForte Engenharia", trade: "Instalações Elétricas" },
  { name: "HidroArte Tubulações", trade: "Instalações Hidrossanitárias" },
  { name: "AçoMax Armações", trade: "Armação e Formas" },
  { name: "GessoPrime Forros", trade: "Acabamentos e Gesso" },
  { name: "Alpha Climatização", trade: "Dutos e Ar-Condicionado" },
];

export function RdoModal({
  isOpen,
  onClose,
  onSuccess,
  initialDate,
  editData,
}: RdoModalProps) {
  const { activeProject, setHasLocalDraft } = useApp();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<string | null>(null);

  const [date, setDate] = useState(() => initialDate || new Date().toISOString().split("T")[0]);
  const [dayStatus, setDayStatus] = useState("trabalhando");
  const [workCondition, setWorkCondition] = useState("praticavel");
  const [weatherMorning, setWeatherMorning] = useState("sol");
  const [weatherAfternoon, setWeatherAfternoon] = useState("sol");

  const [ownTeamCount, setOwnTeamCount] = useState<number>(8);
  const [contractors, setContractors] = useState<ContractorItem[]>([
    { companyName: "EletroForte Engenharia", trade: "Instalações Elétricas", workerCount: 3 },
    { companyName: "HidroArte Tubulações", trade: "Instalações Hidrossanitárias", workerCount: 4 },
  ]);

  const [nonConformities, setNonConformities] = useState<NonConformityItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([
    {
      description: "Concretagem da laje e vigas superiores do Bloco A",
      location: "Bloco A · 5º Pavimento",
      status: "em_andamento",
      hasOvertime: false,
      overtimeHours: "0",
    },
  ]);
  const [occurrences, setOccurrences] = useState<OccurrenceItem[]>([]);
  const [observations, setObservations] = useState("");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);

  const DRAFT_KEY = "rdo_draft_v1";

  useEffect(() => {
    if (!isOpen) return;

    if (editData) {
      setDate(editData.date || new Date().toISOString().split("T")[0]);
      setDayStatus(editData.dayStatus || "trabalhando");
      setWorkCondition(editData.workCondition || "praticavel");
      setWeatherMorning(editData.weatherMorning || "sol");
      setWeatherAfternoon(editData.weatherAfternoon || "sol");
      setOwnTeamCount(editData.ownTeamCount || 0);
      setContractors(editData.contractors || []);
      const loadedNcs = (editData.nonConformities || []).map((nc: any) => {
        const isStandard =
          NR_CONSTRUCAO_CIVIL.some((item) => item.value === nc.nr) ||
          DEMAIS_NRS.some((item) => item.value === nc.nr);
        if (nc.nr && !isStandard) {
          return { ...nc, nr: "Outra", customNr: nc.nr };
        }
        return nc;
      });
      setNonConformities(loadedNcs);
      setActivities(editData.activities || []);
      setOccurrences(editData.occurrences || []);
      setObservations(editData.observations || "");
      setPhotos(editData.photos || []);
      setCurrentStep(1);
    } else {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved && !initialDate) {
        try {
          const parsed = JSON.parse(saved);
          setDate(parsed.date || new Date().toISOString().split("T")[0]);
          setDayStatus(parsed.dayStatus || "trabalhando");
          setWorkCondition(parsed.workCondition || "praticavel");
          setWeatherMorning(parsed.weatherMorning || "sol");
          setWeatherAfternoon(parsed.weatherAfternoon || "sol");
          setOwnTeamCount(parsed.ownTeamCount ?? 8);
          setContractors(parsed.contractors || []);
          setNonConformities(parsed.nonConformities || []);
          setActivities(parsed.activities || []);
          setOccurrences(parsed.occurrences || []);
          setObservations(parsed.observations || "");
          setPhotos(parsed.photos || []);
          setLastAutoSave(parsed.lastSavedAt || "Rascunho recuperado");
          setCurrentStep(1);
        } catch (e) {
          console.error("Failed to parse draft", e);
        }
      } else {
        // Clear all fields for a fresh RDO
        setDate(initialDate || new Date().toISOString().split("T")[0]);
        setDayStatus("trabalhando");
        setWorkCondition("praticavel");
        setWeatherMorning("sol");
        setWeatherAfternoon("sol");
        setOwnTeamCount(8);
        setContractors([
          { companyName: "EletroForte Engenharia", trade: "Instalações Elétricas", workerCount: 3 },
          { companyName: "HidroArte Tubulações", trade: "Instalações Hidrossanitárias", workerCount: 4 },
        ]);
        setNonConformities([]);
        setActivities([
          {
            description: "Concretagem da laje e vigas superiores do Bloco A",
            location: "Bloco A · 5º Pavimento",
            status: "em_andamento",
            hasOvertime: false,
            overtimeHours: "0",
          },
        ]);
        setOccurrences([]);
        setObservations("");
        setPhotos([]);
        setLastAutoSave(null);
        setCurrentStep(1);
      }
    }
  }, [isOpen, editData, initialDate]);

  useEffect(() => {
    if (!isOpen || editData) return;

    const draftData = {
      projectId: activeProject?.id || 1,
      date,
      dayStatus,
      workCondition,
      weatherMorning,
      weatherAfternoon,
      ownTeamCount,
      contractors,
      nonConformities,
      activities,
      occurrences,
      observations,
      photos,
      lastSavedAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };

    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
      setLastAutoSave(draftData.lastSavedAt);
      setHasLocalDraft(true);
    } catch (e) {
      console.warn(e);
    }
  }, [
    isOpen, editData, date, dayStatus, workCondition, weatherMorning, weatherAfternoon,
    ownTeamCount, contractors, nonConformities, activities, occurrences, observations, photos,
  ]);

  if (!isOpen) return null;

  const totalContractorsCount = contractors.reduce((acc, c) => acc + (parseInt(String(c.workerCount), 10) || 0), 0);
  const totalOperarios = (parseInt(String(ownTeamCount), 10) || 0) + totalContractorsCount;

  const addContractor = () => {
    setContractors([
      ...contractors,
      { companyName: `Empreiteiro ${contractors.length + 1}`, trade: "Serviços Gerais", workerCount: 2 },
    ]);
  };
  const removeContractor = (idx: number) => setContractors(contractors.filter((_, i) => i !== idx));
  const addActivity = () => setActivities([...activities, { description: "", location: "", status: "em_andamento", hasOvertime: false, overtimeHours: "0" }]);
  const removeActivity = (idx: number) => setActivities(activities.filter((_, i) => i !== idx));
  const addNonConformity = () => setNonConformities([...nonConformities, { description: "", nr: "", customNr: "", severity: "media", correctiveAction: "", status: "resolvido" }]);
  const removeNonConformity = (idx: number) => setNonConformities(nonConformities.filter((_, i) => i !== idx));
  const addOccurrence = () => setOccurrences([...occurrences, { category: "Geral", title: "", description: "", impactedHours: "0" }]);
  const removeOccurrence = (idx: number) => setOccurrences(occurrences.filter((_, i) => i !== idx));


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const defaultAct = activities[0]?.description || "Serviço Geral de Canteiro";
        const nowStr = `${date} ${new Date().toLocaleTimeString("pt-BR")}`;
        const loc = activeProject?.name || "Canteiro de Obras";
        setPhotos([...photos, {
          activityName: defaultAct,
          caption: file.name.replace(/\.[^/.]+$/, ""),
          photoUrl: reader.result as string,
          timestamp: nowStr,
          locationText: `${loc} · Foto de Campo`,
          showWatermark: true,
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveRdo = async () => {
    if (!date) {
      alert("Selecione uma data para o RDO.");
      setCurrentStep(1);
      return;
    }
    if (activities.length === 0 || !activities[0].description) {
      alert("Adicione pelo menos uma atividade na etapa 4.");
      setCurrentStep(4);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        projectId: activeProject?.id || 1,
        date,
        dayStatus,
        workCondition,
        weatherMorning,
        weatherAfternoon,
        ownTeamCount,
        contractors,
        activities,
        nonConformities: nonConformities.map((nc) => ({
          ...nc,
          nr: nc.nr === "Outra" ? (nc.customNr?.trim() || "Outra") : (nc.nr || null),
        })),
        occurrences,
        hasOccurrences: occurrences.length > 0,
        observations,
        photos,
        authorName: "Alberto Martins",
      };

      let res;
      if (editData?.id) {
        res = await fetch(`/api/rdos/${editData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/rdos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error("Erro ao salvar");

      localStorage.removeItem(DRAFT_KEY);
      setHasLocalDraft(false);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar o RDO. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!editData) {
      alert("O preenchimento foi salvo como rascunho no navegador. Você pode retomá-lo depois.");
    }
    onClose();
  };

  const steps = [
    { num: 1, title: "Geral" },
    { num: 2, title: "Efetivo" },
    { num: 3, title: "Não conformidades" },
    { num: 4, title: "Atividades" },
    { num: 5, title: "Ocorrências" },
    { num: 6, title: "Fotos" },
  ];

  const inputClass = "w-full px-3.5 py-2.5 text-[13px] rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-300 font-medium transition placeholder:text-slate-400";
  const labelClass = "block text-[11.5px] font-semibold text-slate-700 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full h-full md:h-auto md:max-h-[92vh] md:max-w-4xl bg-white md:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                {editData ? "Editar RDO" : "Novo RDO"}
              </span>
              {lastAutoSave && !editData && (
                <span className="inline-flex items-center gap-1 text-[10.5px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md font-medium">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                  Rascunho · {lastAutoSave}
                </span>
              )}
            </div>
            <h2 className="text-[15px] font-semibold text-slate-900 mt-0.5">
              Etapa {currentStep} de 6 — {steps[currentStep - 1].title}
            </h2>
          </div>

          <button
            onClick={handleCancel}
            className="p-2 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
            title="Fechar (salva rascunho)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-5 py-3 border-b border-slate-100 shrink-0 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[480px] max-w-2xl mx-auto">
            {steps.map((step, i) => {
              const isPast = step.num < currentStep;
              const isCurrent = step.num === currentStep;
              return (
                <React.Fragment key={step.num}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(step.num)}
                    className="flex flex-col items-center group"
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold transition ${
                        isCurrent
                          ? "bg-slate-900 text-white ring-4 ring-slate-100"
                          : isPast
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                      }`}
                    >
                      {isPast ? <Check className="w-6 h-6" strokeWidth={3} /> : step.num}
                    </div>
                    <span
                      className={`text-[10px] mt-1 hidden sm:block whitespace-nowrap ${
                        isCurrent ? "font-semibold text-slate-900" : "text-slate-500"
                      }`}
                    >
                      {step.title}
                    </span>
                  </button>
                  {i < steps.length - 1 && (
                    <div
                      className={`flex-1 h-px mx-1 ${
                        isPast ? "bg-emerald-500" : "bg-slate-200"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 md:p-7 space-y-5">
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <h3 className="text-[14px] font-semibold text-slate-900">Condições gerais</h3>
                <p className="text-[12px] text-slate-500 mt-0.5">Defina a data e as condições climáticas e de trabalho.</p>
              </div>

              <div>
                <label className={labelClass}>Data do RDO *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`${inputClass} sm:w-64`}
                />
              </div>

              <div>
                <label className={labelClass}>Status do dia</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: "trabalhando", label: "Trabalhando", desc: "Atividades normais" },
                    { id: "nao_trabalhando", label: "Não trabalhando", desc: "Feriado / domingo" },
                    { id: "paralisado_chuva", label: "Paralisado (chuva)", desc: "Intempérie" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDayStatus(item.id)}
                      className={`p-3 rounded-xl border text-left transition ${
                        dayStatus === item.id
                          ? "border-slate-900 bg-slate-50 shadow-sm"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="text-[13px] font-semibold text-slate-900">{item.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Condições de trabalho</label>
                <div className="grid grid-cols-2 gap-2 max-w-md">
                  {[
                    { id: "praticavel", label: "Praticável" },
                    { id: "impraticavel", label: "Impraticável" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setWorkCondition(item.id)}
                      className={`p-2.5 rounded-xl border text-[13px] font-semibold transition ${
                        workCondition === item.id
                          ? "border-slate-900 bg-slate-50"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Clima · Manhã</label>
                  <select value={weatherMorning} onChange={(e) => setWeatherMorning(e.target.value)} className={inputClass}>
                    <option value="sol">☀️ Sol</option>
                    <option value="parcialmente_nublado">⛅ Parcialmente nublado</option>
                    <option value="nublado">☁️ Nublado</option>
                    <option value="chuva">🌧️ Chuva</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Clima · Tarde</label>
                  <select value={weatherAfternoon} onChange={(e) => setWeatherAfternoon(e.target.value)} className={inputClass}>
                    <option value="sol">☀️ Sol</option>
                    <option value="parcialmente_nublado">⛅ Parcialmente nublado</option>
                    <option value="nublado">☁️ Nublado</option>
                    <option value="chuva">🌧️ Chuva</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <h3 className="text-[14px] font-semibold text-slate-900">Efetivo e mão de obra</h3>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Equipe própria e empreiteiros terceirizados em obra.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-slate-900 truncate">
                    {activeProject?.companyName || "Construtora Aliança S/A"} — Equipe Própria
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Funcionários diretos
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-slate-500 font-medium">Qtd:</span>
                  <input
                    type="number"
                    min="0"
                    value={ownTeamCount}
                    onChange={(e) => setOwnTeamCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-16 px-2.5 py-1.5 text-center text-[13px] font-semibold border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-4 focus:ring-slate-100"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={labelClass + " mb-0"}>Empreiteiros ({contractors.length})</label>
                  <button
                    type="button"
                    onClick={addContractor}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-slate-900 text-white hover:bg-slate-800 transition"
                  >
                    <Plus className="w-6 h-6" />
                    Adicionar
                  </button>
                </div>

                <div className="space-y-2">
                  {contractors.map((c, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Empresa parceira"
                          value={c.companyName}
                          onChange={(e) => {
                            const updated = [...contractors];
                            updated[idx].companyName = e.target.value;
                            setContractors(updated);
                          }}
                          list={`contractor-suggestions-${idx}`}
                          className={inputClass}
                        />
                        <datalist id={`contractor-suggestions-${idx}`}>
                          {CONTRACTOR_SUGGESTIONS.map((s, i) => <option key={i} value={s.name} />)}
                        </datalist>
                        <input
                          type="text"
                          placeholder="Especialidade"
                          value={c.trade}
                          onChange={(e) => {
                            const updated = [...contractors];
                            updated[idx].trade = e.target.value;
                            setContractors(updated);
                          }}
                          className={inputClass}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-500">Qtd operários:</span>
                          <input
                            type="number"
                            min="1"
                            value={c.workerCount}
                            onChange={(e) => {
                              const updated = [...contractors];
                              updated[idx].workerCount = Math.max(1, parseInt(e.target.value, 10) || 1);
                              setContractors(updated);
                            }}
                            className="w-16 px-2.5 py-1 text-center text-[12.5px] font-semibold border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeContractor(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
                    Total em obra
                  </div>
                  <div className="text-[12px] text-slate-300 mt-0.5">
                    {ownTeamCount} próprios + {totalContractorsCount} terceiros
                  </div>
                </div>
                <div className="text-[22px] font-semibold tabular-nums">
                  {totalOperarios} <span className="text-[10px] text-slate-400 font-medium">op</span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[14px] font-semibold text-slate-900">Não conformidades</h3>
                  <p className="text-[12px] text-slate-500 mt-0.5">Desvios de qualidade ou segurança.</p>
                </div>
                <button
                  type="button"
                  onClick={addNonConformity}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-slate-900 text-white hover:bg-slate-800 transition"
                >
                  <Plus className="w-6 h-6" />
                  Adicionar
                </button>
              </div>

              {nonConformities.length === 0 ? (
                <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 font-semibold">
                    ✓
                  </div>
                  <p className="text-[12.5px] font-semibold text-slate-700">Nenhuma não conformidade</p>
                  <p className="text-[11.5px] text-slate-500 mt-0.5">Adicione se houve algum desvio no dia.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {nonConformities.map((nc, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10.5px] font-semibold text-slate-700 uppercase tracking-wider">
                            Não Conformidade #{idx + 1}
                          </span>
                          {nc.nr && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80">
                              {nc.nr === "Outra" ? (nc.customNr || "Outra NR") : nc.nr}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeNonConformity(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Remover não conformidade"
                        >
                          <Trash2 className="w-6 h-6" />
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Descrição do desvio *"
                        value={nc.description}
                        onChange={(e) => {
                          const updated = [...nonConformities];
                          updated[idx].description = e.target.value;
                          setNonConformities(updated);
                        }}
                        className={inputClass}
                      />

                      <select
                        value={nc.severity}
                        onChange={(e) => {
                          const updated = [...nonConformities];
                          updated[idx].severity = e.target.value as any;
                          setNonConformities(updated);
                        }}
                        className={inputClass}
                      >
                        <option value="baixa">Gravidade: Baixa</option>
                        <option value="media">Gravidade: Média</option>
                        <option value="alta">Gravidade: Alta</option>
                      </select>

                      <select
                        value={nc.nr || ""}
                        onChange={(e) => {
                          const updated = [...nonConformities];
                          updated[idx].nr = e.target.value;
                          if (e.target.value !== "Outra") {
                            updated[idx].customNr = "";
                          }
                          setNonConformities(updated);
                        }}
                        className={inputClass}
                      >
                        <option value="">Selecione a NR caracterizadora...</option>
                        <optgroup label="Principais na Construção Civil">
                          {NR_CONSTRUCAO_CIVIL.map((nr) => (
                            <option key={nr.value} value={nr.value}>
                              {nr.label}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Demais Normas Regulamentadoras">
                          {DEMAIS_NRS.map((nr) => (
                            <option key={nr.value} value={nr.value}>
                              {nr.label}
                            </option>
                          ))}
                          <option value="Outra">Outra norma / Não listada</option>
                        </optgroup>
                      </select>

                      {nc.nr === "Outra" && (
                        <input
                          type="text"
                          placeholder="Especifique a norma ou especificação técnica (ex: NBR 6118, NR-18.12...)"
                          value={nc.customNr || ""}
                          onChange={(e) => {
                            const updated = [...nonConformities];
                            updated[idx].customNr = e.target.value;
                            setNonConformities(updated);
                          }}
                          className={inputClass}
                        />
                      )}

                      <input
                        type="text"
                        placeholder="Ação corretiva proposta ou realizada"
                        value={nc.correctiveAction}
                        onChange={(e) => {
                          const updated = [...nonConformities];
                          updated[idx].correctiveAction = e.target.value;
                          setNonConformities(updated);
                        }}
                        className={inputClass}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[14px] font-semibold text-slate-900">Atividades realizadas</h3>
                  <p className="text-[12px] text-slate-500 mt-0.5">Serviços executados no dia.</p>
                </div>
                <button
                  type="button"
                  onClick={addActivity}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-slate-900 text-white hover:bg-slate-800 transition"
                >
                  <Plus className="w-6 h-6" />
                  Adicionar
                </button>
              </div>

              <div className="space-y-2.5">
                {activities.map((act, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-semibold text-slate-700 uppercase tracking-wider">
                        Atividade #{idx + 1}
                      </span>
                      {activities.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeActivity(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-6 h-6" />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Descrição da atividade *"
                      value={act.description}
                      onChange={(e) => {
                        const updated = [...activities];
                        updated[idx].description = e.target.value;
                        setActivities(updated);
                      }}
                      className={inputClass}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Local"
                        value={act.location}
                        onChange={(e) => {
                          const updated = [...activities];
                          updated[idx].location = e.target.value;
                          setActivities(updated);
                        }}
                        className={inputClass}
                      />
                      <select
                        value={act.status}
                        onChange={(e) => {
                          const updated = [...activities];
                          updated[idx].status = e.target.value as any;
                          setActivities(updated);
                        }}
                        className={inputClass}
                      >
                        <option value="em_andamento">Em andamento</option>
                        <option value="concluido">Concluído</option>
                      </select>
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 text-[12px] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={act.hasOvertime}
                            onChange={(e) => {
                              const updated = [...activities];
                              updated[idx].hasOvertime = e.target.checked;
                              setActivities(updated);
                            }}
                            className="rounded text-slate-900"
                          />
                          <span>Hora extra</span>
                        </label>
                        {act.hasOvertime && (
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            value={act.overtimeHours}
                            onChange={(e) => {
                              const updated = [...activities];
                              updated[idx].overtimeHours = e.target.value;
                              setActivities(updated);
                            }}
                            className="w-16 px-2 py-1 text-center text-[12.5px] border border-slate-200 rounded-lg bg-white"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[14px] font-semibold text-slate-900">Ocorrências e observações</h3>
                  <p className="text-[12px] text-slate-500 mt-0.5">Atrasos, acidentes, fiscalizações.</p>
                </div>
                <button
                  type="button"
                  onClick={addOccurrence}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-slate-900 text-white hover:bg-slate-800 transition"
                >
                  <Plus className="w-6 h-6" />
                  Adicionar
                </button>
              </div>

              <div className="space-y-2.5">
                {occurrences.length === 0 ? (
                  <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 text-[12.5px] text-slate-500">
                    Nenhuma ocorrência grave no dia.
                  </div>
                ) : (
                  occurrences.map((occ, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10.5px] font-semibold text-slate-700 uppercase tracking-wider">
                          Ocorrência #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeOccurrence(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-6 h-6" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <select
                          value={occ.category}
                          onChange={(e) => {
                            const updated = [...occurrences];
                            updated[idx].category = e.target.value;
                            setOccurrences(updated);
                          }}
                          className={inputClass}
                        >
                          <option value="Geral">Geral</option>
                          <option value="Falta de Material">Falta de material</option>
                          <option value="Acidente / Incidente">Acidente</option>
                          <option value="Visita de Fiscalização">Fiscalização</option>
                          <option value="Entrega Relevante">Entrega</option>
                          <option value="Clima / Chuva">Clima</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Título"
                          value={occ.title}
                          onChange={(e) => {
                            const updated = [...occurrences];
                            updated[idx].title = e.target.value;
                            setOccurrences(updated);
                          }}
                          className={`${inputClass} sm:col-span-2`}
                        />
                      </div>
                      <textarea
                        rows={2}
                        placeholder="Detalhes e ações"
                        value={occ.description}
                        onChange={(e) => {
                          const updated = [...occurrences];
                          updated[idx].description = e.target.value;
                          setOccurrences(updated);
                        }}
                        className={inputClass}
                      />
                    </div>
                  ))
                )}
              </div>

              <div>
                <label className={labelClass}>Observações gerais</label>
                <textarea
                  rows={3}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Anotações sobre o andamento, liberações, previsões..."
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <h3 className="text-[14px] font-semibold text-slate-900">Registro fotográfico</h3>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Vincule cada foto a uma atividade. Carimbo técnico com data/hora/local.
                </p>
              </div>

                            <div
                className="p-6 md:p-10 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition relative group"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.add("bg-slate-100", "border-slate-400");
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.remove("bg-slate-100", "border-slate-400");
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.remove("bg-slate-100", "border-slate-400");
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type.startsWith("image/")) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      const defaultAct = activities[0]?.description || "Serviço Geral de Canteiro";
                      const nowStr = `${date} ${new Date().toLocaleTimeString("pt-BR")}`;
                      const loc = activeProject?.name || "Canteiro de Obras";
                      setPhotos((prev) => [...prev, {
                        activityName: defaultAct,
                        caption: file.name.replace(/\.[^/.]+$/, ""),
                        photoUrl: reader.result as string,
                        timestamp: nowStr,
                        locationText: loc,
                        showWatermark: true,
                        nonConformityText: ""
                      }]);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              >
                <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <p className="text-[14px] font-medium text-slate-700">Arraste e solte uma foto aqui</p>
                <p className="text-[12px] text-slate-500 mt-1">ou clique para selecionar do seu dispositivo</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              {photos.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-[12px] bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  Nenhuma foto anexada.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {photos.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200 bg-white flex flex-col md:flex-row gap-3"
                    >
                      <div className="relative w-full md:w-40 aspect-4/3 rounded-lg overflow-hidden bg-slate-900 shrink-0">
                        <img src={p.photoUrl} alt="Foto" className="w-full h-full object-cover" />
                        {p.showWatermark && (
                          <div className="absolute bottom-1 left-1 right-1 p-1 bg-slate-900/80 rounded text-[8.5px] text-white font-mono leading-tight">
                            <div className="text-amber-300 font-bold">RDO</div>
                            <div className="truncate">{p.timestamp}</div>
                            <div className="truncate text-slate-300">{p.locationText}</div>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-700">Foto #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-red-600 text-[11px] flex items-center gap-1"
                          >
                            <Trash2 className="w-6 h-6" />
                            Remover
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <select
                            value={p.activityName}
                            onChange={(e) => {
                              const updated = [...photos];
                              updated[idx].activityName = e.target.value;
                              setPhotos(updated);
                            }}
                            className={inputClass}
                          >
                            <option value="">Selecione uma atividade...</option>
                            {activities.map((a, aIdx) => (
                              <option key={aIdx} value={a.description || `Atividade #${aIdx + 1}`}>
                                Atividade: {a.description || `Atividade #${aIdx + 1}`}
                              </option>
                            ))}
                          </select>
                          
                          <select
                            value={p.nonConformityText || ""}
                            onChange={(e) => {
                              const updated = [...photos];
                              updated[idx].nonConformityText = e.target.value;
                              setPhotos(updated);
                            }}
                            className={inputClass}
                          >
                            <option value="">Sem Não Conformidade</option>
                            {nonConformities.map((nc, ncIdx) => (
                              <option key={ncIdx} value={nc.description || `NC #${ncIdx + 1}`}>
                                NC: {nc.description || `NC #${ncIdx + 1}`}
                              </option>
                            ))}
                          </select>
                        </div>

                        <input
                          type="text"
                          value={p.caption || ""}
                          onChange={(e) => {
                            const updated = [...photos];
                            updated[idx].caption = e.target.value;
                            setPhotos(updated);
                          }}
                          placeholder="Legenda (opcional)"
                          className={inputClass}
                        />

                        <label className="inline-flex items-center gap-2 text-[11.5px] font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={p.showWatermark}
                            onChange={(e) => {
                              const updated = [...photos];
                              updated[idx].showWatermark = e.target.checked;
                              setPhotos(updated);
                            }}
                            className="rounded text-slate-900"
                          />
                          <span>Sobrepor carimbo técnico</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleCancel}
            className="px-7 py-4 rounded-xl text-[14.5px] font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-[12.5px] font-medium text-slate-700 hover:bg-slate-100 transition"
              >
                <ChevronLeft className="w-6 h-6" />
                Voltar
              </button>
            )}

            {currentStep < 6 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-[12.5px] font-medium text-white bg-slate-900 hover:bg-slate-800 transition active:scale-[0.98] shadow-sm"
              >
                Avançar
                <ChevronRight className="w-6 h-6" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveRdo}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-8 py-4 rounded-xl text-[14.5px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition disabled:opacity-50 shadow-sm"
              >
                <Check className="w-6 h-6" strokeWidth={2.5} />
                {isSubmitting ? "Salvando..." : "Salvar RDO"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
