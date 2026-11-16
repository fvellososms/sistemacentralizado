"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useReminderSummary, useTaskBoardSummary } from "@/components/workspace/api";
import { logout } from "@/components/auth/logout";
import { buildNavSections, isNavLinkActive, type NavLink } from "./nav-items";

/** Menu for phones, where the sidebar is hidden (opened by "Mais" in the bottom bar). */
export function MobileMoreSheet({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useApp();
  const lateTasks = useTaskBoardSummary()?.late ?? 0;
  const reminderSummary = useReminderSummary();
  const reminderAlerts = reminderSummary?.alertas.length ?? 0;
  // "Início" is already in the bottom bar; the sections with a title are the rest of the menu.
  const sections = buildNavSections({ isAdmin: profile?.accessLevel === "admin", lateTasks, reminderAlerts }).filter((s) => s.title);

  const link = (item: NavLink) => {
    const Icon = item.icon;
    const active = isNavLinkActive(item, pathname);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-2 px-2.5 py-2 rounded-xl transition min-w-0 ${active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}
      >
        <Icon className="w-4 h-4 shrink-0" strokeWidth={1.8} />
        <span className="min-w-0 flex-1">
          <span className="block text-[12.5px] font-medium leading-tight">{item.label}</span>
          {item.subtitle && <span className={`block text-[10.5px] leading-tight ${active ? "text-slate-300" : "text-slate-500"}`}>{item.subtitle}</span>}
        </span>
        {item.badge && item.badge.count > 0 ? (
          <span title={item.badge.title} className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
            {item.badge.count}
          </span>
        ) : null}
      </Link>
    );
  };

  return (
    <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto bg-white rounded-t-3xl shadow-2xl p-4 pb-6">
        <div className="flex items-center justify-between mb-1 px-1">
          <div className="min-w-0">
            <div className="text-[15px] font-semibold text-slate-900">Menu</div>
            <div className="text-[12px] text-slate-500 truncate">{profile?.name}</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar menu" className="p-2 rounded-xl text-slate-500 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="space-y-2" aria-label="Menu principal">
          {sections.map((section) => (
            <div key={section.title}>
              <div className="px-2.5 pb-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">{section.title}</div>
              <div className="grid grid-cols-2 gap-0.5">{section.links.map(link)}</div>
            </div>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => void logout(router)}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
        >
          <LogOut className="w-4 h-4" />
          Sair da conta
        </button>
      </div>
    </div>
  );
}
