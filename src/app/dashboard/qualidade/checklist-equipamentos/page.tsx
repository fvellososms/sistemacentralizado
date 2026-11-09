"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Wrench } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui";
import { ChecklistForm } from "@/components/checklists/ChecklistForm";
import { PdfDownloadButton } from "@/components/documents/PdfDownloadButton";
import { EmptyPanel, Notice, Panel, readApiError, useFetched, type NoticeState } from "@/components/workspace/shared";
import { useApp } from "@/context/AppContext";

interface InspecaoResumo {
  id: number;
  modeloNome: string;
  tag: string;
  inspetor: string;
  dataInspecao: string;
  conformes: number;
  naoConformes: number;
  naoAplica: number;
}

const SEM_INSPECOES: InspecaoResumo[] = [];
const dataBr = (iso: string) => iso.split("-").reverse().join("/");

export default function ChecklistEquipamentosPage() {
  const { activeProject, profile } = useApp();
  const projectId = activeProject?.id;
  const [preenchendo, setPreenchendo] = useState(false);
  const [aviso, setAviso] = useState<NoticeState>(null);

  const carregar = useCallback(async (): Promise<InspecaoResumo[]> => {
    if (!projectId) return SEM_INSPECOES;
    const res = await fetch(`/api/qualidade/checklists/inspecoes?projectId=${projectId}`);
    if (!res.ok) throw new Error(await readApiError(res, "Não foi possível carregar as inspeções."));
    return (await res.json()).inspecoes ?? [];
  }, [projectId]);
  const { data: inspecoes, loading, error, reload } = useFetched(carregar, SEM_INSPECOES);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <Link href="/dashboard/qualidade" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-slate-900 mb-2">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar à Qualidade</span>
            </Link>
            <h1 className="text-[20px] md:text-[22px] font-semibold text-slate-900 tracking-tight flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Wrench className="w-4.5 h-4.5 text-emerald-600" strokeWidth={2} />
              </div>
              <span>Checklist Equipamentos</span>
            </h1>
            <p className="text-[12.5px] text-slate-500 mt-1">
              Lista de verificação pré-operacional de máquinas e equipamentos da obra {activeProject ? `“${activeProject.name}”` : "ativa"}.
            </p>
          </div>
          {!preenchendo && (
            <Button onClick={() => setPreenchendo(true)} disabled={!activeProject}>
              <Plus className="w-4 h-4" />
              Nova inspeção
            </Button>
          )}
        </div>

        <Notice notice={aviso} onClose={() => setAviso(null)} />

        {preenchendo && activeProject ? (
          <ChecklistForm
            projeto={activeProject}
            inspetorPadrao={profile?.name ?? ""}
            onCancelar={() => setPreenchendo(false)}
            onSalvo={(texto) => {
              setPreenchendo(false);
              setAviso({ ok: true, text: texto });
              reload();
            }}
          />
        ) : (
          <Panel title="Inspeções realizadas" description={`${inspecoes.length} inspeção(ões) nesta obra`}>
            {loading ? (
              <div className="p-10 text-center text-[13px] text-slate-500">Carregando inspeções…</div>
            ) : error ? (
              <p role="alert" className="p-6 text-[13px] text-red-700">{error}</p>
            ) : inspecoes.length === 0 ? (
              <EmptyPanel title="Nenhuma inspeção registrada nesta obra." description="Toque em Nova inspeção para preencher o primeiro checklist." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {inspecoes.map((i) => (
                  <li key={i.id} className="px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-semibold text-slate-900">{i.modeloNome}</p>
                      <p className="text-[12px] text-slate-500 mt-0.5">
                        {dataBr(i.dataInspecao)}
                        {i.tag ? ` · TAG ${i.tag}` : ""}
                        {i.inspetor ? ` · ${i.inspetor}` : ""}
                      </p>
                      <p className="text-[12px] mt-1 font-medium">
                        <span className="text-emerald-700">{i.conformes} conforme(s)</span>
                        <span className={i.naoConformes ? "text-red-700" : "text-slate-400"}> · {i.naoConformes} não conforme(s)</span>
                        <span className="text-slate-400"> · {i.naoAplica} não se aplica</span>
                      </p>
                    </div>
                    <PdfDownloadButton
                      size="sm"
                      build={async () => (await import("@/components/documents/checklist-document")).fetchChecklistPdf(i.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}
      </div>
    </AppLayout>
  );
}
