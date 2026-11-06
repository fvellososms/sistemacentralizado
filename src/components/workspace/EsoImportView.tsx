"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { ArrowDownToLine, ArrowRight, Check, Clock3, FileUp, Info } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui";
import { ESO_CSV_COLUMNS, ESO_CSV_MAX_BYTES, ESO_CSV_TEMPLATE } from "@/modules/workspace";
import { Notice, Panel, WorkspaceHeader, downloadFile, readApiError, useFetched, type NoticeState } from "./shared";

type ImportStatus = { esoLastSync: string | null };

/** Status is informative only; the page still works without it. */
async function fetchStatus(): Promise<ImportStatus | null> {
  const res = await fetch("/api/espaco-trabalho/integracoes");
  return res.ok ? res.json() : null;
}

/**
 * ESO is the only external source: visits and manual activities are registered in the system itself.
 */
export function EsoImportView() {
  const { data: status, reload: reloadStatus } = useFetched(fetchStatus, null);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > ESO_CSV_MAX_BYTES) {
      setNotice({ ok: false, text: "O CSV deve ter até 1 MB." });
      return;
    }
    setImporting(true);
    setNotice(null);
    try {
      const res = await fetch("/api/espaco-trabalho/eso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: await file.text() }),
      });
      if (!res.ok) throw new Error(await readApiError(res, "Falha ao importar o CSV do ESO."));
      const data = await res.json();
      setNotice({ ok: true, text: data.message ?? "Registros ESO importados." });
      reloadStatus();
    } catch (e) {
      setNotice({ ok: false, text: e instanceof Error ? e.message : "Falha ao importar o CSV do ESO." });
    } finally {
      setImporting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <WorkspaceHeader
          title="Importação ESO"
          description="Traga para o painel os eventos S-2210, S-2220 e S-2240 informados e enviados no ESO."
        />

        <Notice notice={notice} onClose={() => setNotice(null)} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Panel
            className="lg:col-span-2"
            title="Importar arquivo CSV"
            description={status?.esoLastSync ? `Última importação: ${new Date(status.esoLastSync).toLocaleString("pt-BR")}` : "Nenhuma importação recebida"}
            action={<span className="w-9 h-9 rounded-xl bg-teal-600 text-white text-[11px] font-bold flex items-center justify-center">ESO</span>}
          >
            <div className="p-6 space-y-4">
              <ul className="space-y-1.5 text-[12.5px] text-slate-600">
                {[
                  "Cada linha é identificada por external_id: reimportar atualiza o mesmo registro, sem duplicar.",
                  "Colaboradores com o mesmo nome de um usuário do sistema são vinculados automaticamente.",
                  "Arquivos de até 1 MB, separados por ponto e vírgula ou vírgula.",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
              <input
                ref={fileInput}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e) => {
                  void importFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button loading={importing} onClick={() => fileInput.current?.click()}>
                  <FileUp className="w-4 h-4" />
                  {importing ? "Importando…" : "Importar CSV do ESO"}
                </Button>
                <Button variant="secondary" onClick={() => downloadFile(ESO_CSV_TEMPLATE, "modelo-eso.csv")}>
                  <ArrowDownToLine className="w-4 h-4" />
                  Baixar modelo
                </Button>
              </div>
              <p className="flex items-start gap-1.5 text-[11.5px] text-slate-500">
                <Clock3 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                Colunas: {ESO_CSV_COLUMNS.join(", ")}.
              </p>
            </div>
          </Panel>

          <Panel title="Registrado no sistema" description="O que não vem do ESO">
            <div className="p-6 space-y-3 text-[12.5px] text-slate-600">
              <p className="flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                Visitas e atividades manuais são cadastradas aqui mesmo, por cada colaborador com o próprio login.
              </p>
              {[
                { href: "/espaco-trabalho/visitas", label: "Ir para Visitas" },
                { href: "/espaco-trabalho/atividades-manuais", label: "Ir para Atividades manuais" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-medium text-slate-800">
                  {l.label}
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </AppLayout>
  );
}
