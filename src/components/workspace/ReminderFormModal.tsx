"use client";

import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui";
import { NOTES_MAX_LENGTH, TEXT_MAX_LENGTH, validateReminder, type Reminder, type ReminderErrors, type ReminderInput } from "@/modules/workspace";
import { notifyRemindersChanged } from "./api";
import { ModalShell, inputClass, labelClass, readApiError } from "./shared";

export function ReminderFormModal({
  reminder,
  initialDate,
  onClose,
  onSaved,
}: {
  reminder: Reminder | null; // null creates a new one
  initialDate: string;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [form, setForm] = useState<ReminderInput>(() => ({
    title: reminder?.title ?? "",
    date: reminder?.date ?? initialDate,
    time: reminder?.time ?? "",
    notes: reminder?.notes ?? "",
  }));
  const [errors, setErrors] = useState<ReminderErrors>({});
  const [saving, setSaving] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const set = <K extends keyof ReminderInput>(k: K, v: ReminderInput[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const save = async () => {
    const { isValid, errors: found } = validateReminder(form);
    setErrors(found);
    if (!isValid) return;
    setSaving(true);
    setGeneralError(null);
    try {
      const res = await fetch(reminder ? `/api/espaco-trabalho/lembretes/${reminder.id}` : "/api/espaco-trabalho/lembretes", {
        method: reminder ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await readApiError(res, "Falha ao salvar o lembrete."));
      notifyRemindersChanged();
      onSaved(reminder ? "Lembrete atualizado." : "Lembrete criado.");
    } catch (e) {
      setGeneralError(e instanceof Error ? e.message : "Falha ao salvar o lembrete.");
    } finally {
      setSaving(false);
    }
  };

  const field = (k: keyof ReminderInput) => `${inputClass} ${errors[k] ? "border-red-300" : "border-slate-200"}`;
  const error = (k: keyof ReminderInput) => (errors[k] ? <p className="text-[11.5px] text-red-600 mt-1">{errors[k]}</p> : null);

  return (
    <ModalShell
      eyebrow="Calendário"
      title={reminder ? "Editar lembrete" : "Novo lembrete"}
      titleId="lembrete-form-titulo"
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={() => void save()} loading={saving}>
            <CheckCircle2 className="w-4 h-4" />
            Salvar lembrete
          </Button>
        </>
      }
    >
      {generalError && (
        <div role="alert" className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-[13px] text-red-800">{generalError}</div>
      )}
      <p className="text-[12px] text-slate-500">Só você vê os seus lembretes.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label htmlFor="lembrete-titulo" className={labelClass}>Lembrete *</label>
          <input id="lembrete-titulo" maxLength={TEXT_MAX_LENGTH} placeholder="O que você quer lembrar" value={form.title} onChange={(e) => set("title", e.target.value)} className={field("title")} />
          {error("title")}
        </div>
        <div>
          <label htmlFor="lembrete-data" className={labelClass}>Data *</label>
          <input id="lembrete-data" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className={field("date")} />
          {error("date")}
        </div>
        <div>
          <label htmlFor="lembrete-hora" className={labelClass}>
            Horário <span className="font-normal text-slate-400">opcional</span>
          </label>
          <input id="lembrete-hora" type="time" value={form.time ?? ""} onChange={(e) => set("time", e.target.value)} className={field("time")} />
          {error("time")}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="lembrete-obs" className={labelClass}>
            Observação <span className="font-normal text-slate-400">opcional</span>
          </label>
          <textarea id="lembrete-obs" rows={3} maxLength={NOTES_MAX_LENGTH} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} className={`${field("notes")} resize-y`} />
          {error("notes")}
        </div>
      </div>
    </ModalShell>
  );
}
