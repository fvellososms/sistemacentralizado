"use client";

import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui";
import {
  ACTIVITY_CATEGORIES,
  DEFAULT_TASK_CATEGORY,
  NOTES_MAX_LENGTH,
  TASK_STAGES,
  TASK_STAGE_ORDER,
  TEXT_MAX_LENGTH,
  validateTask,
  type Task,
  type TaskErrors,
  type TaskInput,
  type TaskStage,
} from "@/modules/workspace";
import { ModalShell, inputClass, labelClass, readApiError } from "./shared";
import { CollaboratorSelect } from "./CollaboratorSelect";
import type { TeamMember } from "./api";

export function TaskFormModal({
  task,
  initialCompany,
  team,
  defaultCollaboratorId,
  companies,
  onClose,
  onSaved,
}: {
  task: Task | null; // null creates a new task
  initialCompany?: string;
  team: TeamMember[];
  defaultCollaboratorId?: number; // the logged user
  companies: string[];
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [form, setForm] = useState<Partial<TaskInput>>(() => ({
    title: task?.title ?? "",
    collaboratorId: task?.collaboratorId ?? defaultCollaboratorId,
    company: task?.company ?? initialCompany ?? "",
    category: task?.category ?? DEFAULT_TASK_CATEGORY,
    dueDate: task?.dueDate ?? "",
    stage: task?.stage ?? "todo",
    notes: task?.notes ?? "",
  }));
  const [errors, setErrors] = useState<TaskErrors>({});
  const [saving, setSaving] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const set = <K extends keyof TaskInput>(k: K, v: TaskInput[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const save = async () => {
    const { isValid, errors: found } = validateTask(form);
    setErrors(found);
    if (!isValid) return;
    setSaving(true);
    setGeneralError(null);
    try {
      const res = await fetch(task ? `/api/espaco-trabalho/tarefas/${task.id}` : "/api/espaco-trabalho/tarefas", {
        method: task ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await readApiError(res, "Falha ao salvar a tarefa."));
      onSaved(task ? "Tarefa atualizada." : "Tarefa criada com sucesso.");
    } catch (e) {
      setGeneralError(e instanceof Error ? e.message : "Falha ao salvar a tarefa.");
    } finally {
      setSaving(false);
    }
  };

  const field = (k: keyof TaskInput) => `${inputClass} ${errors[k] ? "border-red-300" : "border-slate-200"}`;
  const error = (k: keyof TaskInput) =>
    errors[k] ? <p className="text-[11.5px] text-red-600 mt-1">{errors[k]}</p> : null;

  return (
    <ModalShell
      eyebrow="Quadro de tarefas"
      title={task ? "Editar tarefa" : "Nova tarefa"}
      titleId="tarefa-form-titulo"
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={() => void save()} loading={saving}>
            <CheckCircle2 className="w-4 h-4" />
            Salvar tarefa
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
        <div className="sm:col-span-2">
          <label htmlFor="tarefa-titulo" className={labelClass}>Tarefa *</label>
          <input
            id="tarefa-titulo"
            maxLength={TEXT_MAX_LENGTH}
            placeholder="O que precisa ser feito"
            value={form.title ?? ""}
            onChange={(e) => set("title", e.target.value)}
            className={field("title")}
          />
          {error("title")}
        </div>
        <div>
          <label htmlFor="tarefa-colaborador" className={labelClass}>Colaborador *</label>
          <CollaboratorSelect
            id="tarefa-colaborador"
            team={team}
            value={form.collaboratorId}
            current={task ? { id: task.collaboratorId, name: task.collaborator } : undefined}
            onChange={(id) => set("collaboratorId", id)}
            className={field("collaboratorId")}
          />
          {error("collaboratorId")}
        </div>
        <div>
          <label htmlFor="tarefa-empresa" className={labelClass}>Empresa *</label>
          <input
            id="tarefa-empresa"
            list="tarefa-empresas"
            maxLength={TEXT_MAX_LENGTH}
            placeholder="Nome da empresa"
            value={form.company ?? ""}
            onChange={(e) => set("company", e.target.value)}
            className={field("company")}
          />
          <datalist id="tarefa-empresas">
            {companies.map((n) => <option key={n} value={n} />)}
          </datalist>
          {error("company")}
        </div>
        <div>
          <label htmlFor="tarefa-tipo" className={labelClass}>Tipo de serviço</label>
          <select
            id="tarefa-tipo"
            value={form.category ?? DEFAULT_TASK_CATEGORY}
            onChange={(e) => set("category", e.target.value)}
            className={field("category")}
          >
            {ACTIVITY_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          {error("category")}
        </div>
        <div>
          <label htmlFor="tarefa-prazo" className={labelClass}>
            Prazo <span className="font-normal text-slate-400">opcional</span>
          </label>
          <input
            id="tarefa-prazo"
            type="date"
            value={form.dueDate ?? ""}
            onChange={(e) => set("dueDate", e.target.value)}
            className={field("dueDate")}
          />
          {error("dueDate")}
        </div>
        <div className="sm:col-span-2">
          <span className={labelClass} id="tarefa-etapa-label">Etapa *</span>
          <div role="radiogroup" aria-labelledby="tarefa-etapa-label" className="grid grid-cols-3 gap-2">
            {TASK_STAGE_ORDER.map((s: TaskStage) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={form.stage === s}
                onClick={() => set("stage", s)}
                className={`px-3 py-2.5 rounded-xl border text-[13px] font-semibold transition ${
                  form.stage === s ? "border-slate-900 bg-slate-50 shadow-sm" : "border-slate-200 hover:border-slate-300 bg-white text-slate-600"
                }`}
              >
                {TASK_STAGES[s]}
              </button>
            ))}
          </div>
          {error("stage")}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="tarefa-obs" className={labelClass}>
            Observação <span className="font-normal text-slate-400">opcional</span>
          </label>
          <textarea
            id="tarefa-obs"
            rows={3}
            maxLength={NOTES_MAX_LENGTH}
            placeholder="Detalhes da tarefa. Evite dados pessoais de trabalhadores."
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
