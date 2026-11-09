"use client";

import React, { useState } from "react";
import { Power, Upload } from "lucide-react";
import { Button } from "@/components/ui";
import { CHECKLIST_CSV_MAX_BYTES } from "@/modules/checklists";
import { EmptyPanel, Notice, Panel, readApiError, useFetched, type NoticeState } from "@/components/workspace/shared";
import { AdminShell, Pill, sendJson } from "./AdminShell";

interface Modelo {
  id: number;
  nome: string;
  ativo: boolean;
  totalItens: number;
}

const NENHUM: Modelo[] = [];

async function carregar(): Promise<Modelo[]> {
  const res = await fetch("/api/admin/checklists");
  if (!res.ok) throw new Error(await readApiError(res, "Não foi possível carregar os checklists."));
  return (await res.json()).modelos ?? [];
}

export function ChecklistsAdmin() {
  const { data: modelos, loading, error, reload } = useFetched(carregar, NENHUM);
  const [importando, setImportando] = useState(false);
  const [alterando, setAlterando] = useState<number | null>(null);
  const [aviso, setAviso] = useState<NoticeState>(null);

  const importar = async (arquivos: FileList | null) => {
    if (!arquivos?.length) return;
    setImportando(true);
    let ok = 0;
    const falhas: string[] = [];
    for (const arquivo of arquivos) {
      try {
        if (arquivo.size > CHECKLIST_CSV_MAX_BYTES) throw new Error("O arquivo deve ter até 256 KB.");
        await sendJson("/api/admin/checklists", "POST", { arquivo: arquivo.name, csv: await arquivo.text() });
        ok++;
      } catch (e) {
        falhas.push(`${arquivo.name}: ${e instanceof Error ? e.message : "falha"}`);
      }
    }
    setImportando(false);
    setAviso({ ok: falhas.length === 0, text: `${ok} checklist(s) importado(s).${falhas.length ? ` Erros: ${falhas.join(" ")}` : ""}` });
    reload();
  };

  const alternar = async (m: Modelo) => {
    setAlterando(m.id);
    try {
      await sendJson(`/api/admin/checklists/${m.id}`, "PATCH", { ativo: !m.ativo });
      reload();
    } catch (e) {
      setAviso({ ok: false, text: e instanceof Error ? e.message : "A operação não foi concluída." });
    } finally {
      setAlterando(null);
    }
  };

  return (
    <AdminShell
      title="Checklists de equipamentos"
      description="Modelos usados nas inspeções. Importar um arquivo com o mesmo nome atualiza as perguntas; inspeções já feitas não mudam."
      actions={
        <label className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium bg-slate-900 text-white cursor-pointer ${importando ? "opacity-60 pointer-events-none" : ""}`}>
          <Upload className="w-4 h-4" />
          {importando ? "Importando…" : "Importar CSV"}
          <input
            type="file"
            accept=".csv,text/csv,text/tab-separated-values"
            multiple
            className="sr-only"
            onChange={(e) => {
              void importar(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      }
    >
      <Notice notice={aviso} onClose={() => setAviso(null)} />
      <Panel title="Modelos cadastrados" description={`${modelos.filter((m) => m.ativo).length} ativo(s) de ${modelos.length}`}>
        {loading ? (
          <div className="p-10 text-center text-[13px] text-slate-500">Carregando checklists…</div>
        ) : error ? (
          <p role="alert" className="p-6 text-[13px] text-red-700">{error}</p>
        ) : modelos.length === 0 ? (
          <EmptyPanel title="Nenhum modelo cadastrado." description="Importe os arquivos CSV dos checklists." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {modelos.map((m) => (
              <li key={m.id} className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium text-slate-900">{m.nome}</p>
                  <p className="text-[12px] text-slate-500">{m.totalItens} pergunta(s)</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Pill tone={m.ativo ? "green" : "slate"}>{m.ativo ? "Ativo" : "Inativo"}</Pill>
                  <Button variant="ghost" size="sm" loading={alterando === m.id} onClick={() => void alternar(m)}>
                    <Power className="w-3.5 h-3.5" />
                    {m.ativo ? "Desativar" : "Reativar"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </AdminShell>
  );
}
