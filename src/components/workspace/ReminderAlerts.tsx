"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Bell } from "lucide-react";
import { notifySite } from "@/components/ui";
import { setReminderDone, useReminderSummary } from "./api";

const dataBr = (iso: string) => iso.split("-").reverse().slice(0, 2).join("/");

/** Notice on the home page with the user's late and today's reminders. Hidden when there are none. */
export function ReminderAlerts() {
  const summary = useReminderSummary();
  const [busy, setBusy] = useState<number | null>(null);
  if (!summary || summary.alertas.length === 0) return null;

  const done = async (id: number) => {
    setBusy(id);
    try {
      await setReminderDone(id, true);
    } catch (e) {
      notifySite(e instanceof Error ? e.message : "Não foi possível atualizar o lembrete.");
    } finally {
      setBusy(null);
    }
  };

  const titulo = [summary.atrasados && `${summary.atrasados} atrasado(s)`, summary.hoje && `${summary.hoje} para hoje`].filter(Boolean).join(" · ");

  return (
    <section aria-label="Seus lembretes" className="rounded-2xl border border-violet-200 bg-violet-50/60 overflow-hidden">
      <div className="px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-violet-100">
        <h2 className="flex items-center gap-2 text-[14px] font-semibold text-violet-900">
          <Bell className="w-4 h-4" />
          Seus lembretes: {titulo}
        </h2>
        <Link href="/espaco-trabalho/calendario" className="inline-flex items-center gap-1 text-[12px] font-medium text-violet-800 hover:text-violet-950">
          Abrir calendário
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <ul className="divide-y divide-violet-100">
        {summary.alertas.slice(0, 5).map((r) => (
          <li key={r.id} className="px-4 sm:px-5 py-2.5 flex items-center gap-3">
            <input
              type="checkbox"
              disabled={busy === r.id}
              onChange={() => void done(r.id)}
              aria-label={`Marcar como feito: ${r.title}`}
              className="w-4 h-4 rounded accent-violet-600"
            />
            <span className="min-w-0 flex-1 text-[13px] text-slate-900">
              {r.time && <span className="tabular-nums font-medium mr-1">{r.time}</span>}
              {r.title}
            </span>
            {r.date < new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }) && (
              <span className="text-[11.5px] font-medium text-red-600 shrink-0">desde {dataBr(r.date)}</span>
            )}
          </li>
        ))}
      </ul>
      {summary.alertas.length > 5 && <p className="px-4 sm:px-5 py-2 text-[12px] text-violet-800">E mais {summary.alertas.length - 5} no calendário.</p>}
    </section>
  );
}
