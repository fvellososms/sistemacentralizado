"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Plus,
  CalendarDays,
  User,
} from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  const { openCreateModal } = useApp();

  return (
    <nav className="md:hidden fixed bottom-4 left-3 right-3 z-40">
      <div
        className="relative flex items-center justify-between px-2 py-2 rounded-3xl shadow-2xl shadow-slate-900/30 backdrop-blur-xl border border-white/10 text-white"
        style={{ background: "rgba(15, 23, 42, 0.92)" }}
      >
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center w-14 py-1.5 rounded-2xl transition ${
            pathname === "/dashboard" ? "text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          <LayoutDashboard
            className="w-[20px] h-[20px]"
            strokeWidth={pathname === "/dashboard" ? 2.2 : 1.7}
          />
          <span className="text-[10px] mt-0.5 font-medium">Início</span>
        </Link>

        <Link
          href="/rdo"
          className={`flex flex-col items-center justify-center w-14 py-1.5 rounded-2xl transition ${
            pathname === "/rdo" ? "text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          <FileSpreadsheet
            className="w-[20px] h-[20px]"
            strokeWidth={pathname === "/rdo" ? 2.2 : 1.7}
          />
          <span className="text-[10px] mt-0.5 font-medium">RDO</span>
        </Link>

        {/* Center FAB */}
        <div className="relative -top-5 flex flex-col items-center">
          <button
            onClick={() => openCreateModal()}
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl border-4 border-slate-50 transition active:scale-95 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
            }}
            aria-label="Criar novo RDO"
          >
            <Plus className="w-7 h-7" strokeWidth={2.5} />
          </button>
          <span className="text-[9.5px] font-semibold text-slate-700 mt-0.5 uppercase tracking-wider">
            Novo
          </span>
        </div>

        <Link
          href="/rso"
          className={`flex flex-col items-center justify-center w-14 py-1.5 rounded-2xl transition ${
            pathname === "/rso" ? "text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          <CalendarDays
            className="w-[20px] h-[20px]"
            strokeWidth={pathname === "/rso" ? 2.2 : 1.7}
          />
          <span className="text-[10px] mt-0.5 font-medium">Semanal</span>
        </Link>

        <Link
          href="/perfil"
          className={`flex flex-col items-center justify-center w-14 py-1.5 rounded-2xl transition ${
            pathname === "/perfil" ? "text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          <User
            className="w-[20px] h-[20px]"
            strokeWidth={pathname === "/perfil" ? 2.2 : 1.7}
          />
          <span className="text-[10px] mt-0.5 font-medium">Perfil</span>
        </Link>
      </div>
    </nav>
  );
}
