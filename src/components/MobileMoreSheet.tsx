"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useTaskBoardSummary } from "@/components/workspace/api";
import { logout } from "@/components/auth/logout";
import { buildNavItems } from "./nav-items";

/** Full menu for phones, where the sidebar is hidden (opened by "Mais" in the bottom bar). */
export function MobileMoreSheet({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useApp();
  const lateTasks = useTaskBoardSummary()?.late ?? 0;
  const items = buildNavItems({ isAdmin: profile?.accessLevel === "admin", lateTasks });

  const link = (href: string, label: string, badge?: number) => (
    <Link
      key={href}
      href={href}
      onClick={onClose}
      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition ${
        pathname === href ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      {label}
      {badge ? (
        <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">{badge}</span>
      ) : null}
    </Link>
  );

  return (
    <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto bg-white rounded-t-3xl shadow-2xl p-4 pb-8">
        <div className="flex items-center justify-between mb-2 px-1">
          <div>
            <div className="text-[15px] font-semibold text-slate-900">Menu</div>
            <div className="text-[12px] text-slate-500">{profile?.name}</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar menu" className="p-2 rounded-xl text-slate-500 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="space-y-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.href}>
                {item.children ? (
                  <>
                    <div className="flex items-center gap-2 px-3 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <Icon className="w-3.5 h-3.5" />
                      {item.label}
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {item.children.map((c) => link(c.href, c.label, c.badge?.count))}
                    </div>
                  </>
                ) : (
                  link(item.href, item.label)
                )}
              </div>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={() => void logout(router)}
          className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
        >
          <LogOut className="w-4 h-4" />
          Sair da conta
        </button>
      </div>
    </div>
  );
}
