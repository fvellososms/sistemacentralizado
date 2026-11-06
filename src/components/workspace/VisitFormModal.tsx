"use client";

import React, { useEffect, useState } from "react";
import { Camera, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { comprimirFoto } from "@/components/quality/compress-photo";
import {
  NOTES_MAX_LENGTH,
  TEXT_MAX_LENGTH,
  VISIT_PHOTOS_MAX,
  VISIT_STATUS,
  VISIT_TYPES,
  todayInSaoPaulo,
  validateActivity,
  type Activity,
  type ActivityErrors,
  type ActivityInput,
  type VisitStatus,
  type VisitType,
} from "@/modules/workspace";
import { CollaboratorSelect } from "./CollaboratorSelect";
import { ModalShell, inputClass, labelClass, readApiError } from "./shared";
import type { TeamMember } from "./api";

/** Create or edit a visit registered in the system (agendada, realizada or cancelada). */
export function VisitFormModal({
  visit,
  team,
  companies,
  defaultCollaboratorId,
  onClose,
  onSaved,
}: {
  visit: Activity | null;
  team: TeamMember[];
  companies: string[];
  defaultCollaboratorId?: number;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const { projects } = useApp();
  const today = todayInSaoPaulo();
  const [form, setForm] = useState<Partial<ActivityInput>>(() => ({
    occurredOn: visit?.occurredOn ?? today,
    status: (visit?.status as VisitStatus) ?? "realizada",
    visitType: visit?.visitType ?? "tecnica",
    collaboratorId: visit?.collaboratorId ?? defaultCollaboratorId,
    company: visit?.company ?? "",
    projectId: visit?.projectId ?? null,
    projectName: visit?.projectName ?? null,
    objective: visit?.objective ?? "",
    notes: visit?.notes ?? "",
  }));
  // undefined = photos of an existing visit not loaded yet (they are kept as they are)
  const [photos, setPhotos] = useState<string[] | undefined>(visit && visit.photoCount > 0 ? undefined : []);
  const [errors, setErrors] = useState<ActivityErrors>({});
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (!visit || visit.photoCount === 0) return;
    let active = true;
    fetch(`/api/espaco-trabalho/atividades/${visit.id}/fotos`)
      .then((res) => (res.ok ? res.json() : { photos: [] }))
      .then((data) => {
        if (active) setPhotos((data.photos ?? []).map((p: { photoUrl: string }) => p.photoUrl));
      })
      .catch(() => {
        if (active) setGeneralError("Não foi possível carregar as fotos desta visita.");
      });
    return () => {
      active = false;
    };
  }, [visit]);

  const set = <K extends keyof ActivityInput>(k: K, v: ActivityInput[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const chooseProject = (id: number | null) => {
    const project = projects.find((p) => p.id === id);
    setForm((f) => ({
      ...f,
      projectId: id,
      projectName: project?.name ?? null,
      // The project's client company fills the company when it is still empty.
      company: !f.company?.trim() && project?.clientCompanyName ? project.clientCompanyName : f.company,
    }));
  };

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length || photos === undefined) return;
    setProcessing(true);
    try {
      const room = VISIT_PHOTOS_MAX - photos.length;
      const added = await Promise.all([...files].slice(0, room).map((f) => comprimirFoto(f)));
      setPhotos([...photos, ...added]);
      if (files.length > room) setErrors((e) => ({ ...e, photos: `No máximo ${VISIT_PHOTOS_MAX} fotos por visita.` }));
    } catch {
      setErrors((e) => ({ ...e, photos: "Não foi possível ler uma das imagens." }));
    } finally {
      setProcessing(false);
    }
  };

  const save = async () => {
    const { isValid, errors: found } = validateActivity(form, "visita", today);
    setErrors(found);
    if (!isValid) return;
    setSaving(true);
    setGeneralError(null);
    try {
      const res = await fetch(visit ? `/api/espaco-trabalho/atividades/${visit.id}` : "/api/espaco-trabalho/atividades", {
        method: visit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "visita", photos }),
      });
      if (!res.ok) throw new Error(await readApiError(res, "Falha ao salvar a visita."));
      onSaved(visit ? "Visita atualizada." : form.status === "agendada" ? "Visita agendada." : "Visita registrada.");
    } catch (e) {
      setGeneralError(e instanceof Error ? e.message : "Falha ao salvar a visita.");
    } finally {
      setSaving(false);
    }
  };

  const field = (k: keyof ActivityInput) => `${inputClass} ${errors[k] ? "border-red-300" : "border-slate-200"}`;
  const error = (k: keyof ActivityErrors) => (errors[k] ? <p className="text-[11.5px] text-red-600 mt-1">{errors[k]}</p> : null);

  return (
    <ModalShell
      eyebrow="Visitas"
      title={visit ? "Editar visita" : "Nova visita"}
      titleId="visita-form-titulo"
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={() => void save()} loading={saving} disabled={processing}>
            <CheckCircle2 className="w-4 h-4" />
            Salvar visita
          </Button>
        </>
      }
    >
      {generalError && <div role="alert" className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-[13px] text-red-800">{generalError}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <span className={labelClass} id="visita-situacao">Situação *</span>
          <div role="radiogroup" aria-labelledby="visita-situacao" className="grid grid-cols-3 gap-2">
            {(Object.keys(VISIT_STATUS) as VisitStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={form.status === s}
                onClick={() => set("status", s)}
                className={`px-3 py-2.5 rounded-xl border text-[13px] font-semibold transition ${
                  form.status === s ? "border-slate-900 bg-slate-50 shadow-sm" : "border-slate-200 hover:border-slate-300 bg-white text-slate-600"
                }`}
              >
                {VISIT_STATUS[s]}
              </button>
            ))}
          </div>
          {error("status")}
        </div>
        <div>
          <label htmlFor="visita-data" className={labelClass}>{form.status === "agendada" ? "Data prevista *" : "Data da visita *"}</label>
          <input id="visita-data" type="date" value={form.occurredOn ?? ""} onChange={(e) => set("occurredOn", e.target.value)} className={field("occurredOn")} />
          {error("occurredOn")}
        </div>
        <div>
          <label htmlFor="visita-tipo" className={labelClass}>Tipo de visita *</label>
          <select id="visita-tipo" value={form.visitType ?? ""} onChange={(e) => set("visitType", e.target.value as VisitType)} className={field("visitType")}>
            {(Object.keys(VISIT_TYPES) as VisitType[]).map((t) => <option key={t} value={t}>{VISIT_TYPES[t]}</option>)}
          </select>
          {error("visitType")}
        </div>
        <div>
          <label htmlFor="visita-colaborador" className={labelClass}>Colaborador *</label>
          <CollaboratorSelect
            id="visita-colaborador"
            team={team}
            value={form.collaboratorId}
            current={visit ? { id: visit.collaboratorId, name: visit.collaborator } : undefined}
            onChange={(id) => set("collaboratorId", id)}
            className={field("collaboratorId")}
          />
          {error("collaboratorId")}
        </div>
        <div>
          <label htmlFor="visita-obra" className={labelClass}>Obra <span className="font-normal text-slate-400">opcional</span></label>
          <select id="visita-obra" value={form.projectId ?? ""} onChange={(e) => chooseProject(e.target.value ? Number(e.target.value) : null)} className={field("projectId")}>
            <option value="">Sem obra específica</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.code} · {p.name}{p.clientCompanyName ? ` (${p.clientCompanyName})` : ""}</option>
            ))}
          </select>
          {error("projectId")}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="visita-empresa" className={labelClass}>Empresa cliente *</label>
          <input id="visita-empresa" list="visita-empresas" maxLength={TEXT_MAX_LENGTH} placeholder="Nome da empresa" value={form.company ?? ""} onChange={(e) => set("company", e.target.value)} className={field("company")} />
          <datalist id="visita-empresas">{companies.map((n) => <option key={n} value={n} />)}</datalist>
          {error("company")}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="visita-objetivo" className={labelClass}>Objetivo *</label>
          <textarea id="visita-objetivo" rows={2} maxLength={NOTES_MAX_LENGTH} placeholder="Ex.: inspecionar os andaimes da fachada leste" value={form.objective ?? ""} onChange={(e) => set("objective", e.target.value)} className={`${field("objective")} resize-y`} />
          {error("objective")}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="visita-resultado" className={labelClass}>
            Resultado / observações <span className="font-normal text-slate-400">{form.status === "agendada" ? "preencha após a visita" : "opcional"}</span>
          </label>
          <textarea id="visita-resultado" rows={3} maxLength={NOTES_MAX_LENGTH} placeholder="O que foi constatado, orientações dadas e pendências" value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} className={`${field("notes")} resize-y`} />
          {error("notes")}
        </div>
        <div className="sm:col-span-2">
          <span className={labelClass}>Fotos <span className="font-normal text-slate-400">até {VISIT_PHOTOS_MAX}</span></span>
          {photos === undefined ? (
            <p className="text-[12px] text-slate-500">Carregando fotos…</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {photos.map((src, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local data URL preview */}
                  <img src={src} alt={`Foto ${i + 1} da visita`} className="w-24 h-20 object-cover rounded-xl border border-slate-200" />
                  <button type="button" aria-label={`Remover foto ${i + 1}`} onClick={() => setPhotos(photos.filter((_, j) => j !== i))} className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-red-600 shadow-sm">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {photos.length < VISIT_PHOTOS_MAX && (
                <label className="w-24 h-20 flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 text-[11px] font-medium text-slate-600 cursor-pointer hover:bg-slate-50">
                  <Camera className="w-4 h-4" />
                  {processing ? "Processando…" : "Adicionar"}
                  <input type="file" accept="image/*" multiple className="sr-only" disabled={processing} onChange={(e) => { void addPhotos(e.target.files); e.target.value = ""; }} />
                </label>
              )}
            </div>
          )}
          {error("photos")}
        </div>
      </div>
    </ModalShell>
  );
}
