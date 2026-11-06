"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Camera, CheckCircle2, ChevronDown, Clock3, Plus, Send, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { PdfDownloadButton } from "@/components/documents/PdfDownloadButton";
import {
  NC_CAUSA_METODOS,
  NC_EVENTOS,
  NC_GRAUS,
  NC_PORQUES_MAX,
  NC_SITUACOES_FLUXO,
  NC_TIPOS,
  NC_VERIFICACAO_RESULTADOS,
  canPerformNcAction,
  diasAtePrazo,
  getNcSituacaoFluxo,
  validateConclusaoAcao,
  validatePlanoAcao,
  type NaoConformidadeInput,
  type NcAcaoErrors,
  type NcAcaoInput,
  type NcCausaMetodo,
  type NcEventoTipo,
  type NcFluxoAcao,
  type NcSituacaoFluxo,
  type NcStatusFluxo,
  type PlanoAcaoErrors,
} from "@/modules/quality";
import { comprimirFoto } from "./compress-photo";

export interface NcAcaoData extends NcAcaoInput {
  id: number;
  status: "pendente" | "concluida";
  concluidaEm: string | null;
  evidencia: string | null;
  evidenciaFotoUrl: string | null;
}

export interface NcDetailData extends NaoConformidadeInput {
  id: number;
  status: NcStatusFluxo;
  criadoPor: string | null;
  acaoImediata: string | null;
  causaMetodo: NcCausaMetodo | null;
  porques: string[];
  causaRaiz: string | null;
  prazoOriginal: string | null;
  verificacaoResultado: string | null;
  verificacaoObs: string | null;
  verificadoPor: string | null;
  verificadoEm: string | null;
  encerradaEm: string | null;
  resolvidaEm: string | null;
  canceladaMotivo: string | null;
  createdAt: string;
  acoes: NcAcaoData[];
  eventos: { id: number; tipo: string; descricao: string; autor: string | null; createdAt: string }[];
}

export const SITUACAO_FLUXO_STYLE: Record<NcSituacaoFluxo, string> = {
  aberta: "bg-blue-50 text-blue-700 border-blue-100",
  em_tratamento: "bg-indigo-50 text-indigo-700 border-indigo-100",
  vencida: "bg-red-50 text-red-700 border-red-100",
  aguardando_verificacao: "bg-amber-50 text-amber-800 border-amber-200",
  encerrada: "bg-emerald-50 text-emerald-700 border-emerald-100",
  cancelada: "bg-slate-100 text-slate-600 border-slate-200",
};

const ETAPAS: { status: NcStatusFluxo; label: string }[] = [
  { status: "aberta", label: "Aberta" },
  { status: "em_tratamento", label: "Em tratamento" },
  { status: "aguardando_verificacao", label: "Verificação" },
  { status: "encerrada", label: "Encerrada" },
];

const inputClass =
  "w-full px-3.5 py-2.5 text-[13px] rounded-xl border bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-300 font-medium transition placeholder:text-slate-400";
const labelClass = "block text-[11.5px] font-semibold text-slate-700 mb-1.5";

const formatarData = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};
const formatarDataHora = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

const hojeIso = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

const acaoVazia = (): NcAcaoInput => ({ oQue: "", porQue: "", onde: "", quem: "", quando: "", como: "", quanto: "" });

export function NcDetailModal({
  ncId,
  projectCode,
  onClose,
  onChanged,
}: {
  ncId: number;
  projectCode?: string | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { profile } = useApp();
  const isAdmin = profile?.accessLevel === "admin";
  const [nc, setNc] = useState<NcDetailData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const [editandoPlano, setEditandoPlano] = useState(false);
  const hoje = hojeIso();

  const carregar = useCallback(async () => {
    try {
      const res = await fetch(`/api/qualidade/nao-conformidades/${ncId}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não foi possível carregar a OM.");
      setNc(data.naoConformidade);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Não foi possível carregar a OM.");
    }
  }, [ncId]);

  useEffect(() => {
    let active = true;
    fetch(`/api/qualidade/nao-conformidades/${ncId}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Não foi possível carregar a OM.");
        if (active) setNc(data.naoConformidade);
      })
      .catch((e) => {
        if (active) setLoadError(e instanceof Error ? e.message : "Não foi possível carregar a OM.");
      });
    return () => {
      active = false;
    };
  }, [ncId]);

  /** Runs one workflow step; returns true on success. */
  const fluxo = async (acao: NcFluxoAcao, body: Record<string, unknown>, sucesso: string): Promise<boolean> => {
    setBusy(acao);
    setAviso(null);
    try {
      const res = await fetch(`/api/qualidade/nao-conformidades/${ncId}/fluxo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao, ...body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "A operação não foi concluída.");
      setNc(data.naoConformidade);
      const emailFalhou = data.email && !data.email.sent;
      setAviso({ ok: !emailFalhou, texto: emailFalhou ? `${sucesso} O e-mail de aviso não foi enviado: ${data.email.reason}` : sucesso });
      onChanged();
      return true;
    } catch (e) {
      setAviso({ ok: false, texto: e instanceof Error ? e.message : "A operação não foi concluída." });
      return false;
    } finally {
      setBusy(null);
    }
  };

  const pode = (acao: NcFluxoAcao) => (nc ? canPerformNcAction(acao, nc, isAdmin) : { allowed: false });
  const situacao = nc ? getNcSituacaoFluxo(nc, hoje) : "aberta";
  const etapaAtual = nc ? ETAPAS.findIndex((e) => e.status === nc.status) : 0;
  const mostrarEditor = nc && pode("definir_plano").allowed && (editandoPlano || nc.status === "aberta");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="nc-detalhe-titulo" className="relative bg-white w-full max-w-4xl max-h-[94vh] rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <div className="flex-none px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
              Tratamento de OM · OM-{String(ncId).padStart(4, "0")}
            </span>
            <h2 id="nc-detalhe-titulo" className="text-[15px] font-semibold text-slate-900 mt-0.5 truncate">{nc?.titulo ?? "Carregando…"}</h2>
            {nc && (
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${SITUACAO_FLUXO_STYLE[situacao]}`}>{NC_SITUACOES_FLUXO[situacao]}</span>
                <span className="text-[11.5px] text-slate-500 inline-flex items-center gap-1">
                  <Clock3 className="w-3 h-3" />
                  Prazo {formatarData(nc.prazo)}
                  {nc.prazoOriginal && ` (original ${formatarData(nc.prazoOriginal)})`}
                </span>
              </div>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 md:p-7 space-y-6">
          {loadError && (
            <div role="alert" className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-[13px] text-red-800 flex items-center justify-between gap-3">
              <span>{loadError}</span>
              <Button variant="secondary" size="sm" onClick={() => void carregar()}>Tentar novamente</Button>
            </div>
          )}
          {aviso && (
            <div role="status" className={`p-3.5 rounded-xl border text-[13px] flex items-start justify-between gap-3 ${aviso.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
              <span>{aviso.texto}</span>
              <button type="button" onClick={() => setAviso(null)} aria-label="Fechar aviso" className="opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
            </div>
          )}

          {!nc && !loadError && <p className="text-center text-[13px] text-slate-500 py-10">Carregando…</p>}

          {nc && (
            <>
              {nc.status === "cancelada" ? (
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-[13px] text-slate-700">
                  <strong>OM cancelada.</strong> Motivo: {nc.canceladaMotivo ?? "—"}
                </div>
              ) : (
                <ol className="grid grid-cols-4 gap-2" aria-label="Etapas do tratamento">
                  {ETAPAS.map((e, i) => {
                    const feito = i < etapaAtual || nc.status === "encerrada";
                    const atual = i === etapaAtual && nc.status !== "encerrada";
                    return (
                      <li key={e.status} className="flex flex-col gap-1.5">
                        <span className={`h-1.5 rounded-full ${feito ? "bg-emerald-500" : atual ? "bg-slate-900" : "bg-slate-200"}`} />
                        <span className={`text-[11px] font-medium ${atual ? "text-slate-900" : "text-slate-500"}`}>{e.label}</span>
                      </li>
                    );
                  })}
                </ol>
              )}

              <Secao titulo="Dados da oportunidade de melhoria">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[12.5px]">
                  <Item k="Obra" v={nc.projectName ?? "—"} />
                  <Item k="Local" v={nc.localObra} />
                  <Item k="Tipo" v={NC_TIPOS[nc.tipo] ?? nc.tipo} />
                  <Item k="Grau" v={NC_GRAUS[nc.grau] ?? nc.grau} />
                  <Item k="Ocorrência" v={formatarData(nc.dataOcorrencia)} />
                  <Item k="Requisito" v={nc.requisitoViolado} />
                  <Item k="Responsável" v={`${nc.responsavelNome} · ${nc.responsavelEmail}`} />
                  <Item k="Registrada por" v={nc.criadoPor ?? "—"} />
                </dl>
                <p className="mt-3 text-[12.5px] text-slate-700 whitespace-pre-line">{nc.descricao}</p>
                {nc.fotoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- data URL photo
                  <img src={nc.fotoUrl} alt={`Foto da OM ${nc.titulo}`} className="mt-3 w-40 h-28 object-cover rounded-xl border border-slate-200" />
                )}
              </Secao>

              <Secao
                titulo="Análise de causa e plano de ação (5W2H)"
                acao={
                  !mostrarEditor && pode("definir_plano").allowed ? (
                    <Button variant="secondary" size="sm" onClick={() => setEditandoPlano(true)}>Editar plano</Button>
                  ) : undefined
                }
              >
                {mostrarEditor ? (
                  <PlanoEditor
                    nc={nc}
                    salvando={busy === "definir_plano"}
                    onCancel={nc.status === "aberta" ? undefined : () => setEditandoPlano(false)}
                    onSave={async (plano) => {
                      const ok = await fluxo("definir_plano", { plano }, nc.status === "aberta" ? "Plano de ação definido. A OM está em tratamento." : "Plano de ação atualizado.");
                      if (ok) setEditandoPlano(false);
                    }}
                  />
                ) : (
                  <PlanoResumo
                    nc={nc}
                    podeConcluir={pode("concluir_acao").allowed}
                    concluindo={busy === "concluir_acao"}
                    onConcluir={(acaoId, evidencia, evidenciaFotoUrl) =>
                      fluxo("concluir_acao", { acaoId, evidencia, evidenciaFotoUrl }, "Ação concluída com evidência registrada.")
                    }
                  />
                )}
              </Secao>

              {(nc.status === "aguardando_verificacao" || nc.verificacaoResultado) && (
                <Secao titulo="Verificação de eficácia">
                  {pode("verificar").allowed ? (
                    <VerificacaoForm salvando={busy === "verificar"} onSubmit={(resultado, observacao) =>
                      fluxo("verificar", { resultado, observacao }, resultado === "eficaz" ? "OM encerrada: ação eficaz." : "Tratamento reaberto: ação ineficaz.")
                    } />
                  ) : nc.verificacaoResultado ? (
                    <p className="text-[12.5px] text-slate-700">
                      <strong>{nc.verificacaoResultado === "eficaz" ? "Eficaz" : "Ineficaz"}</strong> — {nc.verificacaoObs}
                      <span className="block text-[11.5px] text-slate-500 mt-0.5">{nc.verificadoPor} · {formatarDataHora(nc.verificadoEm)}</span>
                    </p>
                  ) : (
                    <p className="text-[12.5px] text-slate-500">Aguardando a verificação do administrador (SMS).</p>
                  )}
                </Secao>
              )}

              {isAdmin && (pode("prorrogar").allowed || pode("cancelar").allowed) && (
                <AdminAcoes
                  prazoAtual={nc.prazo}
                  hoje={hoje}
                  busy={busy}
                  onProrrogar={(novoPrazo, justificativa) => fluxo("prorrogar", { novoPrazo, justificativa }, "Prazo prorrogado.")}
                  onCancelar={(motivo) => fluxo("cancelar", { motivo }, "OM cancelada.")}
                />
              )}

              <Secao titulo="Histórico">
                {nc.eventos.length === 0 ? (
                  <p className="text-[12.5px] text-slate-500">Sem registros.</p>
                ) : (
                  <ol className="relative border-l border-slate-200 ml-1.5 space-y-3">
                    {nc.eventos.map((e) => (
                      <li key={e.id} className="ml-4">
                        <span className="absolute -left-[5px] mt-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white" />
                        <div className="text-[12.5px] font-semibold text-slate-900">{NC_EVENTOS[e.tipo as NcEventoTipo] ?? e.tipo}</div>
                        <div className="text-[12px] text-slate-600 whitespace-pre-line">{e.descricao}</div>
                        <div className="text-[11px] text-slate-400">{formatarDataHora(e.createdAt)}{e.autor ? ` · ${e.autor}` : ""}</div>
                      </li>
                    ))}
                  </ol>
                )}
              </Secao>
            </>
          )}
        </div>

        <div className="flex-none px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          {nc ? (
            <PdfDownloadButton
              size="sm"
              variant="ghost"
              build={async () => (await import("@/components/documents/nc-document")).buildNcPdf(nc, hoje, projectCode)}
            />
          ) : <span />}
          <div className="flex items-center gap-2">
            {nc && nc.status === "em_tratamento" && (
              <Button
                size="sm"
                disabled={!pode("enviar_verificacao").allowed}
                title={pode("enviar_verificacao").reason}
                loading={busy === "enviar_verificacao"}
                onClick={() => void fluxo("enviar_verificacao", {}, "OM enviada para verificação de eficácia.")}
              >
                <Send className="w-3.5 h-3.5" />
                Enviar para verificação
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Secao({ titulo, acao, children }: { titulo: string; acao?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <h3 className="text-[13px] font-semibold text-slate-900">{titulo}</h3>
        {acao}
      </div>
      {children}
    </section>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-1.5">
      <dt className="text-slate-500 shrink-0">{k}:</dt>
      <dd className="text-slate-800 font-medium">{v}</dd>
    </div>
  );
}

function PlanoResumo({
  nc,
  podeConcluir,
  concluindo,
  onConcluir,
}: {
  nc: NcDetailData;
  podeConcluir: boolean;
  concluindo: boolean;
  onConcluir: (acaoId: number, evidencia: string, foto: string | null) => Promise<boolean>;
}) {
  if (!nc.causaRaiz && !nc.acoes.length) {
    return <p className="text-[12.5px] text-slate-500">Nenhum plano de ação definido.</p>;
  }
  return (
    <div className="space-y-4">
      <dl className="space-y-2 text-[12.5px]">
        {nc.acaoImediata && <div><dt className="text-slate-500">Ação imediata (contenção)</dt><dd className="text-slate-800">{nc.acaoImediata}</dd></div>}
        {nc.causaMetodo && <div><dt className="text-slate-500">Método</dt><dd className="text-slate-800">{NC_CAUSA_METODOS[nc.causaMetodo]}</dd></div>}
        {nc.porques.length > 0 && (
          <div>
            <dt className="text-slate-500">Porquês</dt>
            <dd><ol className="list-decimal ml-5 text-slate-800">{nc.porques.map((p, i) => <li key={i}>{p}</li>)}</ol></dd>
          </div>
        )}
        {nc.causaRaiz && <div><dt className="text-slate-500">Causa raiz</dt><dd className="text-slate-900 font-medium">{nc.causaRaiz}</dd></div>}
      </dl>
      <ul className="space-y-2.5">
        {nc.acoes.map((a, i) => (
          <AcaoCard key={a.id} indice={i} acao={a} podeConcluir={podeConcluir} concluindo={concluindo} onConcluir={onConcluir} />
        ))}
      </ul>
    </div>
  );
}

function AcaoCard({
  indice,
  acao,
  podeConcluir,
  concluindo,
  onConcluir,
}: {
  indice: number;
  acao: NcAcaoData;
  podeConcluir: boolean;
  concluindo: boolean;
  onConcluir: (acaoId: number, evidencia: string, foto: string | null) => Promise<boolean>;
}) {
  const [aberto, setAberto] = useState(false);
  const [evidencia, setEvidencia] = useState("");
  const [foto, setFoto] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const hoje = hojeIso();
  const atrasada = acao.status === "pendente" && acao.quando < hoje;

  const concluir = async () => {
    const e = validateConclusaoAcao({ evidencia, evidenciaFotoUrl: foto });
    setErro(e);
    if (e) return;
    if (await onConcluir(acao.id, evidencia, foto)) setAberto(false);
  };

  return (
    <li className={`rounded-xl border p-3.5 ${acao.status === "concluida" ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200"}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[12.5px] font-semibold text-slate-900">{indice + 1}. {acao.oQue}</div>
          <div className="text-[11.5px] text-slate-500 mt-0.5">
            Quem: {acao.quem} · Quando: <span className={atrasada ? "text-red-600 font-semibold" : ""}>{formatarData(acao.quando)}</span>
            {acao.onde ? ` · Onde: ${acao.onde}` : ""}{acao.quanto ? ` · Quanto: ${acao.quanto}` : ""}
          </div>
          <div className="text-[12px] text-slate-600 mt-1"><span className="text-slate-500">Por quê:</span> {acao.porQue}</div>
          <div className="text-[12px] text-slate-600"><span className="text-slate-500">Como:</span> {acao.como}</div>
        </div>
        {acao.status === "concluida" ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-100">
            <CheckCircle2 className="w-3 h-3" />Concluída {formatarData(acao.concluidaEm)}
          </span>
        ) : podeConcluir && !aberto ? (
          <Button variant="secondary" size="sm" onClick={() => setAberto(true)}>
            <CheckCircle2 className="w-3.5 h-3.5" />Concluir ação
          </Button>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold border bg-slate-50 text-slate-600 border-slate-200">Pendente</span>
        )}
      </div>
      {acao.status === "concluida" && acao.evidencia && (
        <div className="mt-2 text-[12px] text-slate-700 flex items-start gap-3">
          <p><span className="text-slate-500">Evidência:</span> {acao.evidencia}</p>
          {acao.evidenciaFotoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- data URL photo
            <img src={acao.evidenciaFotoUrl} alt="Foto da evidência" className="w-20 h-14 object-cover rounded-lg border border-slate-200 shrink-0" />
          )}
        </div>
      )}
      {aberto && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
          <label className="block">
            <span className={labelClass}>Evidência da execução *</span>
            <textarea rows={2} value={evidencia} onChange={(e) => setEvidencia(e.target.value)} placeholder="O que foi feito, quando e como foi conferido" className={`${inputClass} border-slate-200 resize-y`} />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            {foto ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
                <img src={foto} alt="Pré-visualização da evidência" className="w-20 h-14 object-cover rounded-lg border border-slate-200" />
                <Button variant="ghost" size="sm" onClick={() => setFoto(null)}><Trash2 className="w-3.5 h-3.5" />Remover foto</Button>
              </>
            ) : (
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-slate-300 text-[12.5px] font-medium text-slate-700 cursor-pointer hover:bg-slate-50">
                <Camera className="w-3.5 h-3.5" />Foto da evidência (opcional)
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    try {
                      setFoto(await comprimirFoto(file));
                    } catch {
                      setErro("Não foi possível ler esta imagem.");
                    }
                  }}
                />
              </label>
            )}
          </div>
          {erro && <p className="text-[11.5px] text-red-600">{erro}</p>}
          <div className="flex gap-2">
            <Button size="sm" loading={concluindo} onClick={() => void concluir()}>Registrar conclusão</Button>
            <Button variant="ghost" size="sm" onClick={() => setAberto(false)}>Cancelar</Button>
          </div>
        </div>
      )}
    </li>
  );
}

function PlanoEditor({
  nc,
  salvando,
  onSave,
  onCancel,
}: {
  nc: NcDetailData;
  salvando: boolean;
  onSave: (plano: Record<string, unknown>) => void;
  onCancel?: () => void;
}) {
  const concluidas = nc.acoes.filter((a) => a.status === "concluida");
  const [acaoImediata, setAcaoImediata] = useState(nc.acaoImediata ?? "");
  const [metodo, setMetodo] = useState<NcCausaMetodo>(nc.causaMetodo ?? "cinco_porques");
  const [porques, setPorques] = useState<string[]>(() => {
    const base = [...nc.porques];
    while (base.length < NC_PORQUES_MAX) base.push("");
    return base;
  });
  const [causaRaiz, setCausaRaiz] = useState(nc.causaRaiz ?? "");
  const [acoes, setAcoes] = useState<NcAcaoInput[]>(() => {
    const pendentes = nc.acoes.filter((a) => a.status === "pendente").map(({ id, oQue, porQue, onde, quem, quando, como, quanto }) => ({ id, oQue, porQue, onde, quem, quando, como, quanto }));
    return pendentes.length || concluidas.length ? pendentes : [{ ...acaoVazia(), quem: nc.responsavelNome }];
  });
  const [errors, setErrors] = useState<PlanoAcaoErrors>({});

  const setAcao = (i: number, campo: keyof NcAcaoInput, valor: string) =>
    setAcoes((list) => list.map((a, j) => (j === i ? { ...a, [campo]: valor } : a)));

  const salvar = () => {
    const plano = { acaoImediata, causaMetodo: metodo, porques: metodo === "cinco_porques" ? porques.filter((p) => p.trim()) : [], causaRaiz, acoes };
    const { errors: found } = validatePlanoAcao(plano, nc.dataOcorrencia);
    if (!acoes.length && concluidas.length) delete found.acoes;
    setErrors(found);
    if (Object.keys(found).length) return;
    onSave(plano);
  };

  const erroAcao = (i: number, k: keyof NcAcaoErrors) => errors.acoesItens?.[i]?.[k];
  const campo = (i: number, k: keyof NcAcaoInput, label: string, props: { textarea?: boolean; type?: string; placeholder?: string } = {}) => (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {props.textarea ? (
        <textarea rows={2} value={(acoes[i][k] as string) ?? ""} placeholder={props.placeholder} onChange={(e) => setAcao(i, k, e.target.value)} className={`${inputClass} resize-y ${erroAcao(i, k) ? "border-red-300" : "border-slate-200"}`} />
      ) : (
        <input type={props.type ?? "text"} value={(acoes[i][k] as string) ?? ""} placeholder={props.placeholder} min={props.type === "date" ? nc.dataOcorrencia : undefined} onChange={(e) => setAcao(i, k, e.target.value)} className={`${inputClass} ${erroAcao(i, k) ? "border-red-300" : "border-slate-200"}`} />
      )}
      {erroAcao(i, k) && <span className="block text-[11px] text-red-600 mt-1">{erroAcao(i, k)}</span>}
    </label>
  );

  return (
    <div className="space-y-5">
      <label className="block">
        <span className={labelClass}>Ação imediata / contenção <span className="font-normal text-slate-400">o que foi feito logo após a constatação</span></span>
        <textarea rows={2} value={acaoImediata} onChange={(e) => setAcaoImediata(e.target.value)} className={`${inputClass} border-slate-200 resize-y`} placeholder="Ex.: área isolada e serviço paralisado até a instalação de proteção coletiva" />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="block">
          <span className={labelClass}>Método de análise *</span>
          <select value={metodo} onChange={(e) => setMetodo(e.target.value as NcCausaMetodo)} className={`${inputClass} ${errors.causaMetodo ? "border-red-300" : "border-slate-200"}`}>
            {(Object.keys(NC_CAUSA_METODOS) as NcCausaMetodo[]).map((m) => <option key={m} value={m}>{NC_CAUSA_METODOS[m]}</option>)}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className={labelClass}>Causa raiz *</span>
          <textarea rows={2} value={causaRaiz} onChange={(e) => setCausaRaiz(e.target.value)} className={`${inputClass} resize-y ${errors.causaRaiz ? "border-red-300" : "border-slate-200"}`} placeholder="A causa fundamental que, eliminada, impede a repetição da OM" />
          {errors.causaRaiz && <span className="block text-[11px] text-red-600 mt-1">{errors.causaRaiz}</span>}
        </label>
      </div>

      {metodo === "cinco_porques" && (
        <fieldset className="space-y-2">
          <legend className={labelClass}>5 Porquês *</legend>
          {porques.map((p, i) => (
            <input key={i} value={p} onChange={(e) => setPorques((list) => list.map((x, j) => (j === i ? e.target.value : x)))} placeholder={`${i + 1}º Por quê?`} className={`${inputClass} border-slate-200`} />
          ))}
          {errors.porques && <span className="block text-[11px] text-red-600">{errors.porques}</span>}
        </fieldset>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] font-semibold text-slate-900">Ações do plano (5W2H)</span>
          <Button variant="secondary" size="sm" onClick={() => setAcoes((l) => [...l, { ...acaoVazia(), quem: nc.responsavelNome }])}>
            <Plus className="w-3.5 h-3.5" />Adicionar ação
          </Button>
        </div>
        {concluidas.length > 0 && (
          <p className="text-[11.5px] text-slate-500">{concluidas.length} ação(ões) já concluída(s) são mantidas e não podem ser editadas.</p>
        )}
        {errors.acoes && <p className="text-[11.5px] text-red-600">{errors.acoes}</p>}
        {acoes.map((_, i) => (
          <details key={i} open className="group rounded-xl border border-slate-200 p-3.5">
            <summary className="cursor-pointer list-none flex items-center justify-between text-[12.5px] font-semibold text-slate-900">
              <span>Ação {concluidas.length + i + 1}{acoes[i].oQue ? ` · ${acoes[i].oQue}` : ""}</span>
              <span className="flex items-center gap-1">
                <button type="button" onClick={(e) => { e.preventDefault(); setAcoes((l) => l.filter((__, j) => j !== i)); }} className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50" aria-label={`Remover ação ${i + 1}`}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <ChevronDown className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180" />
              </span>
            </summary>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div className="sm:col-span-2">{campo(i, "oQue", "O quê? (What) *", { placeholder: "Ação a ser executada" })}</div>
              <div className="sm:col-span-2">{campo(i, "porQue", "Por quê? (Why) *", { placeholder: "Qual causa a ação elimina" })}</div>
              {campo(i, "quem", "Quem? (Who) *")}
              {campo(i, "quando", "Quando? (When) *", { type: "date" })}
              {campo(i, "onde", "Onde? (Where)")}
              {campo(i, "quanto", "Quanto custa? (How much)", { placeholder: "Opcional" })}
              <div className="sm:col-span-2">{campo(i, "como", "Como? (How) *", { textarea: true, placeholder: "Método, recursos e responsáveis envolvidos" })}</div>
            </div>
          </details>
        ))}
      </div>

      <div className="flex gap-2">
        <Button loading={salvando} onClick={salvar}>{nc.status === "aberta" ? "Definir plano e iniciar tratamento" : "Salvar plano"}</Button>
        {onCancel && <Button variant="ghost" onClick={onCancel}>Cancelar</Button>}
      </div>
    </div>
  );
}

function VerificacaoForm({ salvando, onSubmit }: { salvando: boolean; onSubmit: (resultado: string, observacao: string) => void }) {
  const [resultado, setResultado] = useState<string>("");
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label="Resultado da verificação" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {Object.entries(NC_VERIFICACAO_RESULTADOS).map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={resultado === k}
            onClick={() => setResultado(k)}
            className={`px-3 py-2.5 rounded-xl border text-left text-[13px] font-semibold transition ${resultado === k ? (k === "eficaz" ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-red-400 bg-red-50 text-red-800") : "border-slate-200 text-slate-700 hover:border-slate-300"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="block">
        <span className={labelClass}>O que foi verificado *</span>
        <textarea rows={2} value={observacao} onChange={(e) => setObservacao(e.target.value)} className={`${inputClass} border-slate-200 resize-y`} placeholder="Ex.: inspeção em campo em 10/11 confirmou guarda-corpo instalado e equipe orientada" />
      </label>
      {erro && <p className="text-[11.5px] text-red-600">{erro}</p>}
      <Button
        loading={salvando}
        onClick={() => {
          if (!resultado) return setErro("Selecione o resultado da verificação.");
          if (observacao.trim().length < 10) return setErro("Registre o que foi verificado (mínimo de 10 caracteres).");
          setErro(null);
          onSubmit(resultado, observacao);
        }}
      >
        Registrar verificação
      </Button>
    </div>
  );
}

function AdminAcoes({
  prazoAtual,
  hoje,
  busy,
  onProrrogar,
  onCancelar,
}: {
  prazoAtual: string;
  hoje: string;
  busy: string | null;
  onProrrogar: (novoPrazo: string, justificativa: string) => Promise<boolean>;
  onCancelar: (motivo: string) => Promise<boolean>;
}) {
  const [novoPrazo, setNovoPrazo] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [motivo, setMotivo] = useState("");
  const dias = diasAtePrazo(prazoAtual, hoje);
  return (
    <Secao titulo="Ações do administrador (SMS)">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <details className="rounded-xl border border-slate-200 p-3.5">
          <summary className="cursor-pointer text-[12.5px] font-semibold text-slate-900">
            Prorrogar prazo <span className="font-normal text-slate-500">({dias < 0 ? `vencido há ${-dias} dia(s)` : `faltam ${dias} dia(s)`})</span>
          </summary>
          <div className="mt-3 space-y-2.5">
            <input type="date" min={prazoAtual > hoje ? prazoAtual : hoje} value={novoPrazo} onChange={(e) => setNovoPrazo(e.target.value)} className={`${inputClass} border-slate-200`} aria-label="Novo prazo" />
            <textarea rows={2} value={justificativa} onChange={(e) => setJustificativa(e.target.value)} placeholder="Justificativa da prorrogação" className={`${inputClass} border-slate-200 resize-y`} />
            <Button size="sm" variant="secondary" loading={busy === "prorrogar"} onClick={async () => { if (await onProrrogar(novoPrazo, justificativa)) { setNovoPrazo(""); setJustificativa(""); } }}>
              Prorrogar
            </Button>
          </div>
        </details>
        <details className="rounded-xl border border-red-100 p-3.5">
          <summary className="cursor-pointer text-[12.5px] font-semibold text-red-700">Cancelar OM</summary>
          <div className="mt-3 space-y-2.5">
            <textarea rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo (ex.: registrada em duplicidade)" className={`${inputClass} border-slate-200 resize-y`} />
            <Button size="sm" variant="danger" loading={busy === "cancelar"} onClick={() => void onCancelar(motivo)}>Cancelar OM</Button>
          </div>
        </details>
      </div>
    </Secao>
  );
}
