"use client";

import React from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import {
  Building2,
  Calendar,
  Plus,
  AlertCircle,
  ChevronDown,
  Search,
  Bell,
} from "lucide-react";

export function TopHeader() {
  const {
    projects,
    activeProject,
    setActiveProject,
    profile,
    openCreateModal,
    hasLocalDraft,
  } = useApp();

  const todayFormatted = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
      <div className="px-4 md:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Mobile brand row */}
          <div className="flex items-center justify-between md:hidden">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center shadow-sm">
                <div className="w-3.5 h-3.5 rounded-sm bg-blue-400" />
              </div>
              <span className="font-semibold text-slate-900 text-[15px] tracking-tight">
                RDO
              </span>
            </div>

            <div className="flex items-center gap-2">
              {hasLocalDraft && (
                <button
                  onClick={() => openCreateModal()}
                  className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 transition"
                  title="Rascunho pendente"
                >
                  <AlertCircle className="w-6 h-6" />
                </button>
              )}
              <Link href="/perfil" className="block">
                <img
                  src={
                    profile?.avatarUrl ||
                    "https://images.pexels.com/photos/8960995/pexels-photo-8960995.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800"
                  }
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200"
                />
              </Link>
            </div>
          </div>

          {/* Project selector & date (desktop) */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-2.5 px-7 py-4 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200/60 transition"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center text-white shrink-0">
                  <Building2 className="w-6 h-6" strokeWidth={2.2} />
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider leading-none mb-0.5">
                    Obra ativa
                  </div>
                  <div className="text-[13px] font-semibold text-slate-900 leading-tight max-w-[200px] truncate">
                    {activeProject?.name || "Selecionar obra"}
                  </div>
                </div>
                <select
                  value={activeProject?.id || ""}
                  onChange={(e) => {
                    const found = projects.find(
                      (p) => p.id === parseInt(e.target.value, 10)
                    );
                    if (found) setActiveProject(found);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                >
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-[12px] text-slate-500 font-medium capitalize">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{todayFormatted}</span>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            {hasLocalDraft && (
              <button
                onClick={() => openCreateModal()}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium bg-amber-50 text-amber-700 border border-amber-200/80 hover:bg-amber-100 transition"
                title="Continuar rascunho"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Rascunho pendente</span>
              </button>
            )}

            <button
              type="button"
              className="hidden md:flex w-9 h-9 items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
              title="Notificações"
            >
              <Bell className="w-[18px] h-[18px]" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
