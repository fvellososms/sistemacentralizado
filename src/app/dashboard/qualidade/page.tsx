"use client";

import React, { useCallback, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ClipboardCheck, FileWarning, ShieldCheck } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { EmptyPanel, Panel, readApiError, useFetched } from "@/components/workspace/shared";
import { useApp } from "@/context/AppContext";
import {
  NC_SITUACOES_FLUXO,
  calculateComplianceFromCounts,
  calcularIndicadoresNc,
  getNcSituacaoFluxo,
} from "@/modules/quality";

interface Oportunidade {
  id: number;
  titulo: string;
  localObra: string;
  status: string;
  prazo: string;
  dataOcorrencia: string;
  encerradaEm: string | null;
  resolvidaEm: string | null;
}

interface Inspecao {
  id: number;
  modeloNome: string;
  tag: string;
  dataInspecao: string;
  conformes: number;
  naoConformes: number;
  naoAplica: number;
}

interface Dados {
  oportunidades: Oportunidade[];
  inspecoes: Inspecao[];
}

const SEM_DADOS: Dados = { oportunidades: [], inspecoes: [] };
const LIMITE_LISTA = 5;
const hojeIso = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
const dataBr = (iso: string) => iso.split("-").reverse().join("/");

function Indicador({ titulo, valor, detalhe, destaque }: { titulo: string; valor: string; detalhe: string; destaque?: "verde" | "vermelho" }) {
  const cor = destaque === "verde" ? "text-emerald-600" : destaque === "vermelho" ? "text-red-600" : "text-slate-900";
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80">
      <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">{titulo}</span>
      <div className={`text-[26px] font-semibold mt-2 tracking-tight tabular-nums ${cor}`}>{valor}</div>
      <div className="text-[11.5px] text-slate-500 mt-0.5">{detalhe}</div>
    </div>
  );
}

function VerTodas({ href, texto }: { href: string; texto: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-600 hover:text-slate-900">
      {texto}
      <ArrowRight className="w-3.5 h-3.5" />
    </Link>
  );
}

export default function QualidadePage() {
  const { activeProject } = useApp();
  const projectId = activeProject?.id;

  const carregar = useCallback(async (): Promise<Dados> => {
    if (!projectId) return SEM_DADOS;
    const [resOportunidades, resInspecoes] = await Promise.all([
      fetch(`/api/qualidade/nao-conformidades?projectId=${projectId}`),
      fetch(`/api/qualidade/checklists/inspecoes?projectId=${projectId}`),
    ]);
    if (!resOportunidades.ok) throw new Error(await readApiError(resOportunidades, "Não foi possível carregar as oportunidades de melhoria."));
    if (!resInspecoes.ok) throw new Error(await readApiError(resInspecoes, "Não foi possível carregar as inspeções."));
    return {
      oportunidades: (await resOportunidades.json()).naoConformidades ?? [],
      inspecoes: (await resInspecoes.json()).inspecoes ?? [],
    };
  }, [projectId]);
  const { data, loading, error } = useFetched(carregar, SEM_DADOS);

  const hoje = hojeIso();
  const { indicadores, emAndamento, conformidade } = useMemo(() => {
    const indicadores = calcularIndicadoresNc(data.oportunidades, hoje);
    const emAndamento = data.oportunidades
      .map((o) => ({ ...o, situacao: getNcSituacaoFluxo(o, hoje) }))
      .filter((o) => o.situacao !== "encerrada" && o.situacao !== "cancelada")
      .sort((a, b) => a.prazo.localeCompare(b.prazo));
    return { indicadores, emAndamento, conformidade: calculateComplianceFromCounts(data.inspecoes) };
  }, [data, hoje]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-slate-900 mb-2 transition">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao início</span>
          </Link>
          <h1 className="text-[20px] md:text-[22px] font-semibold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" strokeWidth={2} />
            </div>
            <span>Painel da qualidade</span>
          </h1>
          <p className="text-[12.5px] text-slate-500 mt-1">
            Oportunidades de melhoria e inspeções de equipamentos da obra {activeProject ? `“${activeProject.name}”` : "ativa"}.
          </p>
        </div>

        {error ? (
          <p role="alert" className="p-4 rounded-xl border border-red-200 bg-red-50 text-[13px] text-red-800">{error}</p>
        ) : loading ? (
          <div className="p-10 text-center text-[13px] text-slate-500">Carregando dados da obra…</div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Indicador
                titulo="Em andamento"
                valor={String(emAndamento.length)}
                detalhe="Oportunidades ainda não encerradas"
              />
              <Indicador
                titulo="Vencidas"
                valor={String(indicadores.porSituacao.vencida)}
                detalhe="Com prazo expirado"
                destaque={indicadores.porSituacao.vencida > 0 ? "vermelho" : undefined}
              />
              <Indicador
                titulo="Encerradas"
                valor={String(indicadores.porSituacao.encerrada)}
                detalhe={indicadores.encerradasNoPrazo === null ? "Nenhuma encerrada ainda" : `${indicadores.encerradasNoPrazo}% dentro do prazo`}
                destaque={indicadores.porSituacao.encerrada > 0 ? "verde" : undefined}
              />
              <Indicador
                titulo="Conformidade"
                valor={conformidade.percentage === null ? "—" : `${conformidade.percentage}%`}
                detalhe={conformidade.percentage === null ? "Nenhuma inspeção nesta obra" : `${conformidade.conformCount} de ${conformidade.evaluatedCount} itens de checklist`}
              />
            </div>

            <Panel
              title="Oportunidades de melhoria em andamento"
              description="Ordenadas pelo prazo mais próximo"
              action={<VerTodas href="/dashboard/qualidade/nao-conformidades" texto="Ver todas" />}
            >
              {emAndamento.length === 0 ? (
                <EmptyPanel title="Nenhuma oportunidade em andamento nesta obra." description="Quando uma for registrada, ela aparece aqui." />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {emAndamento.slice(0, LIMITE_LISTA).map((o) => (
                    <li key={o.id} className="px-4 sm:px-6 py-3.5 flex items-start gap-3">
                      <FileWarning className={`w-4 h-4 mt-0.5 shrink-0 ${o.situacao === "vencida" ? "text-red-600" : "text-slate-400"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-semibold text-slate-900">{o.titulo}</p>
                        <p className="text-[12px] text-slate-500 mt-0.5">
                          {o.localObra} · prazo {dataBr(o.prazo)} ·{" "}
                          <span className={o.situacao === "vencida" ? "text-red-700 font-medium" : ""}>{NC_SITUACOES_FLUXO[o.situacao]}</span>
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel
              title="Últimas inspeções de equipamentos"
              description={`${data.inspecoes.length} inspeção(ões) nesta obra`}
              action={<VerTodas href="/dashboard/qualidade/checklist-equipamentos" texto="Ver todas" />}
            >
              {data.inspecoes.length === 0 ? (
                <EmptyPanel title="Nenhuma inspeção registrada nesta obra." description="As inspeções feitas em Checklist Equipamentos aparecem aqui." />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.inspecoes.slice(0, LIMITE_LISTA).map((i) => (
                    <li key={i.id} className="px-4 sm:px-6 py-3.5 flex items-start gap-3">
                      <ClipboardCheck className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-semibold text-slate-900">{i.modeloNome}</p>
                        <p className="text-[12px] text-slate-500 mt-0.5">
                          {dataBr(i.dataInspecao)}
                          {i.tag ? ` · TAG ${i.tag}` : ""} · <span className={i.naoConformes ? "text-red-700 font-medium" : ""}>{i.naoConformes} não conforme(s)</span>
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </>
        )}
      </div>
    </AppLayout>
  );
}
