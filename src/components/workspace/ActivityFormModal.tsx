"use client";

import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui";
import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_STATUS,
  NOTES_MAX_LENGTH,
  QUANTITY_MAX,
  TEXT_MAX_LENGTH,
  todayInSaoPaulo,
  validateActivity,
  type Activity,
  type ActivityErrors,
  type ActivityInput,
  type ActivityStatus,
} from "@/modules/workspace";
import { ModalShell, inputClass, labelClass, readApiError } from "./shared";
import { CollaboratorSelect } from "./CollaboratorSelect";
import type { TeamMember } from "./api";

export function ActivityFormModal({
  activity,
  team,
  companies,
  defaultCollaboratorId,
  onClose,
  onSaved,
}: {
  activity: Activity | null; // null creates a new manual activity
  team: TeamMember[];
  companies: string[];
  defaultCollaboratorId?: number; // the logged user
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [form, setForm] = useState<Partial<ActivityInput>>(() => ({
    occurredOn: activity?.occurredOn ?? todayInSaoPaulo(),
    quantity: activity?.quantity ?? 1,
    collaboratorId: activity?.collaboratorId ?? defaultCollaboratorId,
    company: activity?.company ?? "",
    category: activity?.category ?? ACTIVITY_CATEGORIES[0],
    status: activity?.status ?? "completed",
    notes: activity?.notes ?? "",
  }));
  const [errors, setErrors] = useState<ActivityErrors>({});
  const [saving, setSaving] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const set = <K extends keyof ActivityInput>(k: K, v: ActivityInput[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const save = async () => {
    const { isValid, errors: found } = validateActivity(form, "manual");
    setErrors(found);
    if (!isValid) return;
    setSaving(true);
    setGeneralError(null);
    try {
      const res = await fetch(
        activity ? `/api/espaco-trabalho/atividades/${activity.id}` : "/api/espaco-trabalho/atividades",
        {
          method: activity ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, source: "manual" }),
        }
      );
      if (!res.ok) throw new Error(await readApiError(res, "Falha ao salvar a atividade."));
      onSaved(activity ? "Atividade atualizada." : "Atividade registrada com sucesso.");
    } catch (e) {
      setGeneralError(e instanceof Error ? e.message : "Falha ao salvar a atividade.");
    } finally {
      setSaving(false);
    }
  };

  const statuses = Object.keys(ACTIVITY_STATUS) as (keyof typeof ACTIVITY_STATUS)[];
  const field = (k: keyof ActivityInput) => `${inputClass} ${errors[k] ? "border-red-300" : "border-slate-200"}`;
  const error = (k: keyof ActivityInput) =>
    errors[k] ? <p className="text-[11.5px] text-red-600 mt-1">{errors[k]}</p> : null;

  return (
    <ModalShell
      eyebrow="Registro do setor"
      title={activity ? "Editar atividade" : "Nova atividade manual"}
      titleId="atividade-form-titulo"
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={() => void save()} loading={saving}>
            <CheckCircle2 className="w-4 h-4" />
            Salvar atividade
          </Button>
        </>
      }
    >
      {generalError && (
        <div role="alert" className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-[13px] text-red-800">
          {generalError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="atividade-data" className={labelClass}>Data da atividade *</label>
          <input
            id="atividade-data"
            type="date"
            value={form.occurredOn ?? ""}
            onChange={(e) => set("occurredOn", e.target.value)}
            className={field("occurredOn")}
          />
          {error("occurredOn")}
        </div>
        <div>
          <label htmlFor="atividade-qtd" className={labelClass}>Quantidade *</label>
          <input
            id="atividade-qtd"
            type="number"
            min={1}
            max={QUANTITY_MAX}
            step={1}
            value={Number.isFinite(form.quantity) ? form.quantity : ""}
            onChange={(e) => set("quantity", e.target.valueAsNumber)}
            className={field("quantity")}
          />
          {error("quantity")}
        </div>
        <div>
          <label htmlFor="atividade-colaborador" className={labelClass}>Colaborador *</label>
          <CollaboratorSelect
            id="atividade-colaborador"
            team={team}
            value={form.collaboratorId}
            current={activity ? { id: activity.collaboratorId, name: activity.collaborator } : undefined}
            onChange={(id) => set("collaboratorId", id)}
            className={field("collaboratorId")}
          />
          {error("collaboratorId")}
        </div>
        <div>
          <label htmlFor="atividade-empresa" className={labelClass}>Empresa *</label>
          <input
            id="atividade-empresa"
            list="atividade-empresas"
            maxLength={TEXT_MAX_LENGTH}
            placeholder="Nome da empresa"
            value={form.company ?? ""}
            onChange={(e) => set("company", e.target.value)}
            className={field("company")}
          />
          <datalist id="atividade-empresas">
            {companies.map((n) => <option key={n} value={n} />)}
          </datalist>
          {error("company")}
        </div>
        <div>
          <label htmlFor="atividade-categoria" className={labelClass}>Categoria *</label>
          <select
            id="atividade-categoria"
            value={form.category ?? ""}
            onChange={(e) => set("category", e.target.value)}
            className={field("category")}
          >
            {ACTIVITY_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          {error("category")}
        </div>
        <div>
          <label htmlFor="atividade-situacao" className={labelClass}>Situação *</label>
          <select
            id="atividade-situacao"
            value={form.status ?? ""}
            onChange={(e) => set("status", e.target.value as ActivityStatus)}
            className={field("status")}
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{ACTIVITY_STATUS[s]}</option>
            ))}
          </select>
          {error("status")}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="atividade-obs" className={labelClass}>
            Observação <span className="font-normal text-slate-400">opcional</span>
          </label>
          <textarea
            id="atividade-obs"
            rows={3}
            maxLength={NOTES_MAX_LENGTH}
            placeholder="Descreva o que foi realizado. Evite dados pessoais de trabalhadores."
            value={form.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
            className={`${field("notes")} resize-y`}
          />
          {error("notes")}
        </div>
      </div>
    </ModalShell>
  );
}
