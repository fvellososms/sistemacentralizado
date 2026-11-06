"use client";

import React, { useState } from "react";
import Link from "next/link";
import logo from "@/assets/images/logofvelloso.png";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { logout } from "@/components/auth/logout";
import { useTaskBoardSummary } from "@/components/workspace/api";
import { buildNavItems } from "./nav-items";
import { LogOut, ChevronDown } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, openCreateModal, activeProject } = useApp();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const lateTasks = useTaskBoardSummary()?.late ?? 0;

  const navItems = buildNavItems({ isAdmin: profile?.accessLevel === "admin", lateTasks });

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
              <img
                src={
                  profile?.avatarUrl ||
                  "https://instagram.fsdu12-2.fna.fbcdn.net/v/t51.82787-19/747054491_18084026429547727_4569591890917331405_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_cat=100&_nc_map=urlgen_bucketless&ccb=7-5&_nc_sid=f7ccc5&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLnd3dy4xMDgwLkMzIn0%3D&_nc_ohc=fmK07mZdj64Q7kNvwEy6hqv&_nc_oc=AdrhoScdeciPdRgs0hsf0YKdDkHORsUnd9Wt7Bs5VUwbpxzlRvcDtAqCN9o5UGrjZIGrP6VaF-x5BGzXdCf2spth&_nc_zt=24&_nc_ht=instagram.fsdu12-2.fna&_nc_gid=Ju5eb8hMj939ZCswwdWGuQ&_nc_ss=7b6a8&oh=00_AQJrqocwB4ieqXY_Shpauipg3rzja8sV_QpMVo2czb-tJA&oe=6AA9EA80"
                }
                alt={profile?.name || "Usuário"}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-blue-400/40 transition"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-[13px] text-white truncate group-hover:text-blue-300 transition">
                {profile?.name || "Alberto Martins"}
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          Navegação
        </div>
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isInGroup = !!item.children && pathname.startsWith(item.href);
            const isActive = item.children ? isInGroup : pathname === item.href;
            const isOpen = openGroups[item.href] ?? isInGroup;
            const itemClass = `group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all ${
              isActive && !item.children
                ? "bg-white text-slate-900 shadow-sm shadow-white/5"
                : isActive
                  ? "text-white bg-white/5"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
            }`;
            const icon = (
              <Icon
                className={`w-[18px] h-[18px] shrink-0 transition ${
                  isActive ? (item.children ? "text-blue-400" : "text-blue-600") : "text-slate-400 group-hover:text-slate-200"
                }`}
                strokeWidth={isActive ? 2.2 : 1.7}
              />
            );

            if (item.children) {
              const groupBadge = item.children.reduce((sum, c) => sum + (c.badge?.count ?? 0), 0);
              return (
                <div key={item.href}>
                  <button
                    type="button"
                    onClick={() => setOpenGroups((g) => ({ ...g, [item.href]: !isOpen }))}
                    aria-expanded={isOpen}
                    className={itemClass}
                  >
                    {icon}
                    <span className="flex-1 text-left">{item.label}</span>
                    {!isOpen && groupBadge > 0 && <NavBadge count={groupBadge} title={`${groupBadge} pendência(s) neste grupo`} />}
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      strokeWidth={2}
                    />
                  </button>
                  {isOpen && (
                    <div className="mt-0.5 ml-[21px] pl-3 border-l border-white/10 space-y-0.5">
                      {item.children.map((child) => {
                        const isChildActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[12.5px] font-medium transition ${
                              isChildActive
                                ? "bg-white text-slate-900 shadow-sm shadow-white/5"
                                : "text-slate-400 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            <span>{child.label}</span>
                            {child.badge && child.badge.count > 0 && <NavBadge count={child.badge.count} title={child.badge.title} />}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link key={item.href} href={item.href} className={itemClass}>
                {icon}
                <span className="flex-1">{item.label}</span>
                {item.subtitle && !isActive && (
                  <span className="text-[10px] text-slate-500 font-medium">
                    {item.subtitle}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
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
