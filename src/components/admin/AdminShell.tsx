"use client";

import React, { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui";
import { ModalShell } from "@/components/workspace/shared";

export const ADMIN_TABS = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/usuarios", label: "Usuários" },
  { href: "/admin/empresas", label: "Empresas clientes" },
  { href: "/admin/obras", label: "Obras" },
  { href: "/admin/checklists", label: "Checklists" },
  { href: "/admin/auditoria", label: "Auditoria" },
];

/** Layout of every admin page: header, tabs and content. Access is enforced by the proxy and the API. */
export function AdminShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="block text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500 mb-1.5">Administração</span>
            <h1 className="text-[22px] md:text-[26px] font-semibold text-slate-900 tracking-tight leading-tight">{title}</h1>
            <p className="text-[13px] text-slate-500 mt-1">{description}</p>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">{actions}</div>}
        </div>

        <nav aria-label="Seções da administração" className="flex gap-1 overflow-x-auto p-1 rounded-xl bg-slate-100 w-fit max-w-full">
          {ADMIN_TABS.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium whitespace-nowrap transition ${
                  active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {children}
      </div>
    </AppLayout>
  );
}

/** Small colored pill used in admin tables. */
export function Pill({ tone, children }: { tone: "green" | "slate" | "red" | "amber" | "blue"; children: ReactNode }) {
  const styles = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    slate: "bg-slate-100 text-slate-600 border-slate-200",
    red: "bg-red-50 text-red-700 border-red-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap ${styles[tone]}`}>
      {children}
    </span>
  );
}

export const formatDateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

export async function sendJson<T>(url: string, method: "POST" | "PATCH", body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "A operação não foi concluída.");
  return data as T;
}

/** Neutral confirmation (the shared ConfirmModal is styled for deletions). */
export function ConfirmAction({
  isOpen,
  title,
  description,
  confirmText,
  danger,
  isLoading,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText: string;
  danger?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;
  return (
    <ModalShell
      eyebrow="Confirmação"
      title={title}
      titleId="confirmar-acao-titulo"
      onClose={onCancel}
      busy={isLoading}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
          <Button variant={danger ? "danger" : "primary"} loading={isLoading} onClick={onConfirm}>{confirmText}</Button>
        </>
      }
    >
      <p className="text-[13px] text-slate-600 leading-relaxed">{description}</p>
    </ModalShell>
  );
}
