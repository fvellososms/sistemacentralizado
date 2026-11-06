"use client";

import React, { ReactNode, useCallback, useEffect, useState } from "react";
import { Database, X } from "lucide-react";
import {
  ACTIVITY_SOURCES,
  statusLabel,
  type ActivitySource,
  type ActivityStatus,
} from "@/modules/workspace";

export const SOURCE_STYLE: Record<ActivitySource, { badge: string; dot: string; color: string }> = {
  visita: { badge: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500", color: "#2563EB" },
  eso: { badge: "bg-teal-50 text-teal-700 border-teal-100", dot: "bg-teal-500", color: "#0D9488" },
  manual: { badge: "bg-violet-50 text-violet-700 border-violet-100", dot: "bg-violet-500", color: "#7C3AED" },
};

const STATUS_STYLE: Record<ActivityStatus, { badge: string; dot: string }> = {
  completed: { badge: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
  pending: { badge: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-500" },
  overdue: { badge: "bg-red-50 text-red-700 border-red-100", dot: "bg-red-500" },
  agendada: { badge: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500" },
  realizada: { badge: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
  cancelada: { badge: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
};

export const inputClass =
  "w-full px-3.5 py-2.5 text-[13px] rounded-xl border bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-300 font-medium transition placeholder:text-slate-400";
export const labelClass = "block text-[11.5px] font-semibold text-slate-700 mb-1.5";

export const formatNumber = (n: number) => new Intl.NumberFormat("pt-BR").format(n);

/** "2026-09-05" → "05 set" */
export const formatShortDate = (iso: string | null) =>
  iso
    ? new Date(`${iso}T12:00:00Z`)
        .toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" })
        .replace(".", "")
    : "—";

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export function downloadFile(content: string, filename: string, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function SourceBadge({ source }: { source: ActivitySource }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap ${SOURCE_STYLE[source].badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${SOURCE_STYLE[source].dot}`} />
      {ACTIVITY_SOURCES[source]}
    </span>
  );
}

export function StatusBadge({ status }: { status: ActivityStatus }) {
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap ${style.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {statusLabel(status)}
    </span>
  );
}

export function Avatar({ name }: { name: string }) {
  return (
    <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-[10.5px] font-semibold flex items-center justify-center shrink-0">
      {initials(name)}
    </span>
  );
}

/** Same look as the secondary KPI cards of the dashboard. */
export function MetricCard({
  icon: Icon,
  iconClass,
  tag,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  iconClass: string; // e.g. "bg-blue-50 text-blue-600"
  tag: ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80">
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconClass}`}>
          <Icon className="w-4 h-4" strokeWidth={2} />
        </div>
        {tag}
      </div>
      <div className="text-2xl font-semibold text-slate-900 tracking-tight">{value}</div>
      <div className="text-[12px] text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

/** White card with the dashboard section header. */
export function Panel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`bg-white rounded-2xl border border-slate-200/80 overflow-hidden ${className}`}>
      <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900 tracking-tight">{title}</h2>
          {description && <p className="text-[12px] text-slate-500 mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyPanel({
  title = "Nenhum registro neste período.",
  description = "Experimente outros filtros ou cadastre uma atividade.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="px-6 py-10 flex flex-col items-center text-center">
      <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
        <Database className="w-5 h-5 text-slate-500" strokeWidth={1.8} />
      </div>
      <p className="text-[13.5px] font-semibold text-slate-900">{title}</p>
      <p className="text-[12px] text-slate-500 mt-1 max-w-sm">{description}</p>
    </div>
  );
}

export type NoticeState = { ok: boolean; text: string } | null;

export function Notice({ notice, onClose }: { notice: NoticeState; onClose: () => void }) {
  if (!notice) return null;
  return (
    <div
      role="status"
      className={`p-3.5 rounded-xl border text-[13px] flex items-start justify-between gap-3 ${
        notice.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"
      }`}
    >
      <span>{notice.text}</span>
      <button type="button" onClick={onClose} aria-label="Fechar aviso" className="shrink-0 opacity-70 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/** Page header shared by every Workspace screen. */
export function WorkspaceHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <span className="block text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500 mb-1.5">
          Espaço de trabalho
        </span>
        <h1 className="text-[22px] md:text-[26px] font-semibold text-slate-900 tracking-tight leading-tight">{title}</h1>
        <p className="text-[13px] text-slate-500 mt-1">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">{actions}</div>}
    </div>
  );
}

/** Modal frame with the same structure as the NC modal (header, scrollable body, footer). */
export function ModalShell({
  eyebrow,
  title,
  titleId,
  onClose,
  busy,
  footer,
  children,
}: {
  eyebrow: string;
  title: string;
  titleId: string;
  onClose: () => void;
  busy?: boolean;
  footer: ReactNode;
  children: ReactNode;
}) {
  const close = () => {
    if (!busy) onClose();
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" onKeyDown={(e) => e.key === "Escape" && close()}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={close} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-xl overflow-hidden flex flex-col"
      >
        <div className="flex-none px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">{eyebrow}</span>
            <h2 id={titleId} className="text-[15px] font-semibold text-slate-900 mt-0.5">{title}</h2>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={busy}
            aria-label="Fechar"
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 md:p-7 space-y-5">{children}</div>
        <div className="flex-none px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          {footer}
        </div>
      </div>
    </div>
  );
}

/** Reads `{ error }` from a failed API response. */
export async function readApiError(res: Response, fallback: string): Promise<string> {
  const data = await res.json().catch(() => ({}));
  return (data as { error?: string }).error || fallback;
}

/**
 * Loads data on mount and again on `reload()`. Reloads keep the current data on screen
 * (`loading` is only true for the first load). `fetcher` must be stable (module-level function).
 */
export function useFetched<T>(fetcher: () => Promise<T>, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    fetcher()
      .then((value) => {
        if (!active) return;
        setData(value);
        setError(null);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "Falha ao carregar os dados.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetcher, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data, setData, loading, error, reload };
}
