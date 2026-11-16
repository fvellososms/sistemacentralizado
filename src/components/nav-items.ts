import type React from "react";
import {
  AlertTriangle,
  Briefcase,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  FileClock,
  FileSpreadsheet,
  FileWarning,
  LayoutDashboard,
  MapPin,
  Settings,
  ShieldCheck,
  SquareKanban,
  Upload,
  User,
  Wrench,
} from "lucide-react";

export type NavLink = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  subtitle?: string;
  /** Only this exact address marks the link as current (other links live below it). */
  exact?: boolean;
  badge?: { count: number; title: string };
};
export type NavSection = { title?: string; links: NavLink[] };

/** Single source of the menu, organized by what the person wants to do. Shared by the sidebar and the mobile sheet. */
export function buildNavSections({
  isAdmin,
  lateTasks,
  reminderAlerts = 0,
}: {
  isAdmin: boolean;
  lateTasks: number;
  reminderAlerts?: number;
}): NavSection[] {
  return [
    { links: [{ label: "Início", href: "/dashboard", icon: LayoutDashboard, exact: true }] },
    {
      title: "Registros da obra",
      links: [
        { label: "RDO", href: "/rdo", icon: FileSpreadsheet, subtitle: "Diário de obra" },
        { label: "APR", href: "/apr", icon: AlertTriangle, subtitle: "Análise de riscos" },
        { label: "RSO", href: "/rso", icon: CalendarDays, subtitle: "Relatório semanal" },
      ],
    },
    {
      title: "Inspeções e melhoria",
      links: [
        { label: "Painel da qualidade", href: "/dashboard/qualidade", icon: ShieldCheck, exact: true },
        { label: "Checklist Equipamentos", href: "/dashboard/qualidade/checklist-equipamentos", icon: Wrench },
        { label: "Oportunidades de Melhoria", href: "/dashboard/qualidade/nao-conformidades", icon: FileWarning },
      ],
    },
    {
      title: "Tarefas e agenda",
      links: [
        { label: "Painel de atividades", href: "/espaco-trabalho", icon: Briefcase, exact: true },
        {
          label: "Quadro de tarefas",
          href: "/espaco-trabalho/tarefas",
          icon: SquareKanban,
          badge: { count: lateTasks, title: `${lateTasks} tarefa(s) atrasada(s)` },
        },
        {
          label: "Calendário",
          href: "/espaco-trabalho/calendario",
          icon: CalendarCheck,
          badge: { count: reminderAlerts, title: `${reminderAlerts} lembrete(s) para hoje ou atrasado(s)` },
        },
        { label: "Visitas", href: "/espaco-trabalho/visitas", icon: MapPin },
        { label: "Atividades manuais", href: "/espaco-trabalho/atividades-manuais", icon: ClipboardList },
      ],
    },
    {
      title: "ESO e administração",
      links: [
        { label: "Eventos ESO", href: "/espaco-trabalho/eventos-eso", icon: FileClock },
        { label: "Importação ESO", href: "/espaco-trabalho/importacao-eso", icon: Upload },
        ...(isAdmin ? [{ label: "Administração", href: "/admin", icon: Settings }] : []),
        { label: "Perfil", href: "/perfil", icon: User },
      ],
    },
  ];
}

export const isNavLinkActive = (link: NavLink, pathname: string) =>
  pathname === link.href || (!link.exact && pathname.startsWith(`${link.href}/`));
