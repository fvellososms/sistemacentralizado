import type React from "react";
import {
  AlertTriangle,
  Briefcase,
  CalendarDays,
  FileSpreadsheet,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react";

export type NavChild = { label: string; href: string; badge?: { count: number; title: string } };
export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  subtitle?: string;
  children?: NavChild[];
};

/** Single source of the menu, shared by the desktop sidebar and the mobile "Mais" sheet. */
export function buildNavItems({ isAdmin, lateTasks }: { isAdmin: boolean; lateTasks: number }): NavItem[] {
  return [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "RDO", href: "/rdo", icon: FileSpreadsheet, subtitle: "Diário de obra" },
    { label: "APR", href: "/apr", icon: AlertTriangle, subtitle: "Análise de riscos" },
    { label: "RSO", href: "/rso", icon: CalendarDays, subtitle: "Relatório semanal" },
    {
      label: "Qualidade",
      href: "/dashboard/qualidade",
      icon: ShieldCheck,
      children: [
        { label: "Visão geral", href: "/dashboard/qualidade" },
        { label: "Oportunidades de Melhoria", href: "/dashboard/qualidade/nao-conformidades" },
        { label: "Checklist Equipamentos", href: "/dashboard/qualidade/checklist-equipamentos" },
        { label: "Checklist EPI", href: "/dashboard/qualidade/checklist-epi" },
        { label: "Inspeções programadas", href: "/dashboard/qualidade/inspecoes" },
      ],
    },
    {
      label: "Espaço de trabalho",
      href: "/espaco-trabalho",
      icon: Briefcase,
      children: [
        { label: "Visão geral", href: "/espaco-trabalho" },
        {
          label: "Quadro de tarefas",
          href: "/espaco-trabalho/tarefas",
          badge: { count: lateTasks, title: `${lateTasks} tarefa(s) atrasada(s)` },
        },
        { label: "Visitas", href: "/espaco-trabalho/visitas" },
        { label: "Eventos ESO", href: "/espaco-trabalho/eventos-eso" },
        { label: "Atividades manuais", href: "/espaco-trabalho/atividades-manuais" },
        { label: "Importação ESO", href: "/espaco-trabalho/importacao-eso" },
      ],
    },
    ...(isAdmin
      ? [
          {
            label: "Administração",
            href: "/admin",
            icon: Settings,
            children: [
              { label: "Visão geral", href: "/admin" },
              { label: "Usuários", href: "/admin/usuarios" },
              { label: "Empresas clientes", href: "/admin/empresas" },
              { label: "Obras", href: "/admin/obras" },
              { label: "Auditoria", href: "/admin/auditoria" },
            ],
          },
        ]
      : []),
    { label: "Perfil", href: "/perfil", icon: User },
  ];
}
