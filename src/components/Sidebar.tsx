"use client";

import React from "react";
import Link from "next/link";
import logo from "@/assets/images/logofvelloso.png";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { logout } from "@/components/auth/logout";
import { useReminderSummary, useTaskBoardSummary } from "@/components/workspace/api";
import { buildNavSections, isNavLinkActive } from "./nav-items";
import { UserAvatar } from "./UserAvatar";
import { LogOut } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useApp();
  const lateTasks = useTaskBoardSummary()?.late ?? 0;
  const reminderSummary = useReminderSummary();
  const reminderAlerts = reminderSummary?.alertas.length ?? 0;

  const sections = buildNavSections({ isAdmin: profile?.accessLevel === "admin", lateTasks, reminderAlerts });

  const handleLogout = () => void logout(router);

  return (
    <aside
      className="hidden md:flex flex-col w-72 shrink-0 h-screen sticky top-0 text-slate-100 select-none z-30"
      style={{ background: "linear-gradient(180deg, #0B1220 0%, #0F172A 50%, #0B1220 100%)" }}
    >
      {/* Brand */}
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 rounded-[8px] overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <img src={logo.src as string} alt="logo"/>
            </div>
          <div className="flex-1">
            <h1 className="font-semibold text-[15px] tracking-tight text-white leading-tight">
              FVelloso SMS
            </h1>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">
              Gestão Tecnológica de Obras
            </p>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="px-4 pb-4">
        <Link
          href="/perfil"
          className="group block p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all"
          title="Ver perfil completo"
        >
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <UserAvatar
                name={profile?.name}
                url={profile?.avatarUrl}
                className="w-10 h-10 text-[13px] ring-2 ring-white/10 group-hover:ring-blue-400/40 transition"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-[13px] text-white truncate group-hover:text-blue-300 transition">
                {profile?.name || "Usuário"}
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 pb-2 overflow-y-auto" aria-label="Menu principal">
        {sections.map((section, i) => (
          <div key={section.title ?? i} className="mb-2.5">
            {section.title && (
              <div className="px-3 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{section.title}</div>
            )}
            <div className="space-y-px">
              {section.links.map((link) => {
                const Icon = link.icon;
                const isActive = isNavLinkActive(link, pathname);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`group flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                      isActive ? "bg-white text-slate-900 shadow-sm shadow-white/5" : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon
                      className={`w-[17px] h-[17px] shrink-0 transition ${isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-200"}`}
                      strokeWidth={isActive ? 2.2 : 1.7}
                    />
                    <span className="flex-1">{link.label}</span>
                    {link.subtitle && !isActive && <span className="text-[10px] text-slate-500 font-medium">{link.subtitle}</span>}
                    {link.badge && link.badge.count > 0 && <NavBadge count={link.badge.count} title={link.badge.title} />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/5 space-y-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition text-[13.5px] font-medium"
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
          <span>Sair da conta</span>
        </button>
      </div>
    </aside>
  );
}

function NavBadge({ count, title }: { count: number; title: string }) {
  return (
    <span
      title={title}
      aria-label={title}
      className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-semibold leading-none flex items-center justify-center tabular-nums"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
