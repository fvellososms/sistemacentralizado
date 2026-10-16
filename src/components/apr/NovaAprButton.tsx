"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AprWizard } from "./AprWizard";
import type { AprDraft } from "@/lib/apr/types";

export function NovaAprButton({
  inicial,
  obraNome,
  usuarioNome,
}: {
  inicial: AprDraft;
  obraNome: string | null;
  usuarioNome: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13.5px] font-semibold bg-slate-900 text-white hover:bg-slate-800 transition"
      >
        <Plus className="w-4 h-4" />
        Nova APR
      </button>

      {isOpen && (
        <AprWizard
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          inicial={inicial}
          obraNome={obraNome}
          usuarioNome={usuarioNome}
        />
      )}
    </>
  );
}
