"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Bell, FileSpreadsheet, FileWarning, SquareKanban, Wrench, X } from "lucide-react";
import { useApp } from "@/context/AppContext";

const OPCOES = [
  { label: "Nova inspeção", detalhe: "Checklist de equipamento", icon: Wrench, href: "/dashboard/qualidade/checklist-equipamentos" },
  { label: "Nova oportunidade", detalhe: "Oportunidade de melhoria", icon: FileWarning, href: "/dashboard/qualidade/nao-conformidades" },
  { label: "Nova tarefa", detalhe: "Quadro de tarefas", icon: SquareKanban, href: "/espaco-trabalho/tarefas" },
  { label: "Novo lembrete", detalhe: "Calendário (só você vê)", icon: Bell, href: "/espaco-trabalho/calendario" },
];

/** What the "+" of the bottom bar can create on phones. */
export function MobileCreateSheet({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { openCreateModal } = useApp();

  const opcao = (label: string, detalhe: string, Icon: React.ComponentType<{ className?: string }>, acao: () => void) => (
    <button
      key={label}
      type="button"
      onClick={() => {
        onClose();
        acao();
      }}
      className="w-full flex items-center gap-3 p-3 rounded-2xl text-left hover:bg-slate-100 active:bg-slate-100 transition"
    >
      <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </span>
      <span>
        <span className="block text-[14px] font-semibold text-slate-900">{label}</span>
        <span className="block text-[12px] text-slate-500">{detalhe}</span>
      </span>
    </button>
  );

  return (
    <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Criar novo registro">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl p-4 pb-8">
        <div className="flex items-center justify-between mb-1 px-1">
          <div className="text-[15px] font-semibold text-slate-900">O que você quer registrar?</div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="p-2 rounded-xl text-slate-500 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        {opcao("Novo RDO", "Diário de obra", FileSpreadsheet, () => openCreateModal())}
        {OPCOES.map((o) => opcao(o.label, o.detalhe, o.icon, () => router.push(`${o.href}?nova=${Date.now()}`)))}
      </div>
    </div>
  );
}
