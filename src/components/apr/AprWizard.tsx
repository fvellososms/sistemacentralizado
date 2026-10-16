"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, ChevronLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Badge, Button, ConfirmDialog, Spinner, useToast } from "@/components/ui";
import { AprResumo } from "./AprResumo";
import { AprStatusBadge, RelevanciaBadge, StepIndicator } from "./shared";
import { riscoBaseParaDraft, StepAtividadesRiscos, StepIdentificacao, StepMedidas } from "./Steps";
import { validarDraft, type Erros } from "@/lib/apr/validacao";
import { novaKey, type AprDraft, type BuscaResposta, type RiscoBase, type SugestaoAtividade } from "@/lib/apr/types";

type EstadoAssistente = "aguardando" | "pesquisando" | "sugestoes" | "vazio" | "erro" | "revisado";

export function AprWizard({
  inicial,
  obraNome,
  usuarioNome,
  isOpen,
  onClose,
}: {
  inicial: AprDraft;
  obraNome: string | null;
  usuarioNome: string;
  isOpen?: boolean;
  onClose?: () => void;
}) {
  if (isOpen !== undefined && !isOpen) return null;
  const router = useRouter();
  const toast = useToast();
  const [draft, setDraft] = useState<AprDraft>(inicial);
  const [etapa, setEtapa] = useState(Math.min(Math.max(inicial.etapaAtual, 1), 4));
  const [maxEtapa, setMaxEtapa] = useState(Math.min(Math.max(inicial.etapaAtual, 1), 4));
  const [erros, setErros] = useState<Erros>({});
  const [salvando, setSalvando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [confirmEnvio, setConfirmEnvio] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [assistenteAberto, setAssistenteAberto] = useState(true);

  // Assistente
  const [estado, setEstado] = useState<EstadoAssistente>(inicial.atividades.length ? "revisado" : "aguardando");
  const [busca, setBusca] = useState<BuscaResposta | null>(null);
  const [erroBusca, setErroBusca] = useState<string | null>(null);
  const ultimaDescricao = useRef<string>(inicial.atividades.length ? inicial.descricaoServico : "");
  const topoRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const atualizar = useCallback((fn: (d: AprDraft) => AprDraft) => setDraft((d) => fn(d)), []);

  // ---------------------------------------------------------------------
  // Busca inteligente
  // ---------------------------------------------------------------------
  const buscar = useCallback(
    async (texto: string) => {
      setEstado("pesquisando");
      setErroBusca(null);
      try {
        const res = await fetch("/api/apr/busca", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texto }),
        });
        const data = (await res.json()) as BuscaResposta & { error?: string };
        if (!res.ok) throw new Error(data.error || "Falha na consulta.");
        setBusca(data);
        ultimaDescricao.current = texto;
        setEstado(data.sugestoes.length === 0 ? "vazio" : "sugestoes");
        setAssistenteAberto(true);

        // Auto-selecionar sugestões de alta relevância (círculo de seleção já vem preenchido)
        const altasNaoAdicionadas = data.sugestoes.filter(
          (s) => s.relevancia === "alta" && !draftRef.current.atividades.some((a) => a.atividadeOrigemId === s.id),
        );

        if (altasNaoAdicionadas.length > 0) {
          const novas = await Promise.all(
            altasNaoAdicionadas.map(async (s) => {
              try {
                const rRes = await fetch(`/api/apr/atividades/${s.id}/riscos`);
                if (!rRes.ok) return null;
                const rData = (await rRes.json()) as { riscos: RiscoBase[] };
                return {
                  key: novaKey("a"),
                  nome: s.nome,
                  categoria: s.categoria,
                  atividadeOrigemId: s.id,
                  origem: "base" as const,
                  relevancia: s.relevancia,
                  riscos: rData.riscos.map(riscoBaseParaDraft),
                };
              } catch {
                return null;
              }
            }),
          );
          const validos = novas.filter((x): x is NonNullable<typeof x> => x !== null);
          if (validos.length > 0) {
            atualizar((d) => ({
              ...d,
              atividades: [
                ...d.atividades,
                ...validos.filter((v) => !d.atividades.some((existing) => existing.atividadeOrigemId === v.atividadeOrigemId)),
              ],
            }));
            toast.push(
              `${validos.length} atividade(s) de alta relevância pré-selecionada(s) automaticamente para revisão.`,
              "info",
            );
          }
        }
      } catch (e) {
        setErroBusca(e instanceof Error ? e.message : "Falha na consulta.");
        setEstado("erro");
      }
    },
    [atualizar, toast],
  );

  // Ao entrar na etapa 2 com descrição alterada, pesquisa automaticamente
  useEffect(() => {
    if (etapa === 2 && draft.descricaoServico.trim().length >= 10 && ultimaDescricao.current !== draft.descricaoServico.trim()) {
      void buscar(draft.descricaoServico.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapa]);

  // Estado "revisado" quando todas as sugestões foram tratadas e não há riscos pendentes
  const pendentesRevisao = useMemo(() => draft.atividades.reduce((s, a) => s + a.riscos.filter((r) => !r.revisado).length, 0), [draft]);
  const obrigSemJustificativa = useMemo(
    () => draft.atividades.reduce((s, a) => s + a.riscos.filter((r) => r.selecionado).reduce((x, r) => x + r.controles.filter((c) => c.obrigatorio && !c.selecionado && !c.justificativa?.trim()).length, 0), 0),
    [draft],
  );
  useEffect(() => {
    if (estado !== "sugestoes" && estado !== "revisado") return;
    if (pendentesRevisao === 0 && draft.atividades.length > 0) {
      setEstado("revisado");
    } else if (estado === "revisado" && pendentesRevisao > 0) {
      setEstado("sugestoes");
    }
  }, [draft, busca, pendentesRevisao, estado]);

  // ---------------------------------------------------------------------
  // Atividades
  // ---------------------------------------------------------------------
  const adicionarAtividadeBase = useCallback(
    async (id: number, nome: string, categoria: string | null, relevancia?: SugestaoAtividade["relevancia"]) => {
      if (draft.atividades.some((a) => a.atividadeOrigemId === id)) return;
      try {
        const res = await fetch(`/api/apr/atividades/${id}/riscos`);
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { riscos: RiscoBase[] };
        atualizar((d) => ({
          ...d,
          atividades: [
            ...d.atividades,
            { key: novaKey("a"), nome, categoria, atividadeOrigemId: id, origem: "base", relevancia, riscos: data.riscos.map(riscoBaseParaDraft) },
          ],
        }));
        toast.push(`Atividade “${nome}” adicionada com ${data.riscos.length} risco(s) para revisão.`, "success");
      } catch {
        toast.push("Não foi possível carregar os riscos da atividade. Tente novamente.", "danger");
      }
    },
    [draft.atividades, atualizar, toast],
  );

  const adicionarAtividadeManual = useCallback(
    (nome: string) => {
      atualizar((d) => ({
        ...d,
        atividades: [...d.atividades, { key: novaKey("a"), nome, categoria: null, atividadeOrigemId: null, origem: "manual", riscos: [] }],
      }));
      toast.push(`Atividade manual “${nome}” adicionada. Inclua os riscos aplicáveis.`, "info");
    },
    [atualizar, toast],
  );

  const removerAtividade = useCallback(
    (key: string) => {
      const a = draft.atividades.find((x) => x.key === key);
      atualizar((d) => ({ ...d, atividades: d.atividades.filter((x) => x.key !== key) }));
      if (a) toast.push(`Atividade “${a.nome}” removida.`, "neutral");
    },
    [draft.atividades, atualizar, toast],
  );

  const toggleAtividadeSugestao = useCallback(
    async (s: SugestaoAtividade) => {
      const existente = draft.atividades.find((a) => a.atividadeOrigemId === s.id);
      if (existente) {
        removerAtividade(existente.key);
      } else {
        await adicionarAtividadeBase(s.id, s.nome, s.categoria, s.relevancia);
      }
    },
    [draft.atividades, removerAtividade, adicionarAtividadeBase],
  );

  // ---------------------------------------------------------------------
  // Persistência e navegação
  // ---------------------------------------------------------------------
  async function salvar(dados: AprDraft, silencioso = false): Promise<number | null> {
    setSalvando(true);
    setErroGeral(null);
    try {
      const res = await fetch(dados.id ? `/api/apr/${dados.id}` : "/api/apr", {
        method: dados.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      const data = (await res.json()) as { id?: number; error?: string; erros?: Erros };
      if (!res.ok) {
        if (data.erros) setErros(data.erros);
        throw new Error(data.error || "Falha ao salvar.");
      }
      const id = data.id!;
      if (!dados.id) {
        setDraft((d) => ({ ...d, id, status: "rascunho" }));
        window.history.replaceState(null, "", `/apr/${id}/editar`);
      } else {
        setDraft((d) => ({ ...d, status: "rascunho" }));
      }
      if (!silencioso) toast.push("Rascunho salvo.", "success");
      return id;
    } catch (e) {
      setErroGeral(e instanceof Error ? e.message : "Falha de comunicação ao salvar.");
      return null;
    } finally {
      setSalvando(false);
    }
  }

  function irPara(n: number) {
    setEtapa(n);
    setErros({});
    topoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function avancar() {
    const e = validarDraft(draft, etapa);
    setErros(e);
    if (Object.keys(e).length) {
      toast.push("Há campos que precisam de atenção nesta etapa.", "warning");
      return;
    }
    const proxima = etapa + 1;
    const dados = { ...draft, etapaAtual: Math.max(proxima, draft.etapaAtual), revisadaPeloAutor: false };
    setDraft(dados);
    const id = await salvar(dados, true);
    if (id === null) return;
    setMaxEtapa((m) => Math.max(m, proxima));
    toast.push(`Etapa ${etapa} concluída.`, "success");
    irPara(proxima);
  }

  async function enviarParaAprovacao() {
    const e = validarDraft(draft, 3);
    setErros(e);
    if (Object.keys(e).length) {
      setConfirmEnvio(false);
      toast.push("Corrija as pendências antes de enviar.", "warning");
      return;
    }
    setEnviando(true);
    const dados = { ...draft, etapaAtual: 4, revisadaPeloAutor: true };
    const id = await salvar(dados, true);
    if (id === null) {
      setEnviando(false);
      return;
    }
    try {
      const res = await fetch(`/api/apr/${id}/acao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "submeter" }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Falha ao enviar.");
      toast.push("APR enviada para aprovação.", "success");
      router.push(`/apr/${id}`);
      router.refresh();
    } catch (e) {
      setErroGeral(e instanceof Error ? e.message : "Falha ao enviar para aprovação.");
    } finally {
      setEnviando(false);
      setConfirmEnvio(false);
    }
  }

  const bloqueada = draft.status === "aprovada" || draft.status === "aguardando_aprovacao";

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------
  const painelAssistente = (
    <AssistentePanel
      estado={estado}
      busca={busca}
      erro={erroBusca}
      draft={draft}
      pendentesRevisao={pendentesRevisao}
      obrigSemJustificativa={obrigSemJustificativa}
      etapa={etapa}
      onBuscar={() => void buscar(draft.descricaoServico.trim())}
      onToggle={(s) => void toggleAtividadeSugestao(s)}
      onIrEtapa={irPara}
    />
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style={{ overflow: "hidden" }}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-none px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                Nova APR
              </span>
              {draft.status === "rascunho" && draft.id && (
                <span className="inline-flex items-center gap-1 text-[10.5px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md font-medium">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                  Rascunho
                </span>
              )}
            </div>
            <h2 className="text-[15px] font-semibold text-slate-900 mt-0.5">
              Etapa {etapa} de 4
            </h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step indicator */}
        <div className="px-5 py-3 border-b border-slate-100 shrink-0 overflow-x-auto bg-white">
          <div className="flex items-center justify-between min-w-[320px] max-w-xl mx-auto">
            {[{num:1,title:"Identificação"},{num:2,title:"Atividades"},{num:3,title:"Medidas"},{num:4,title:"Revisão"}].map((step, i, arr) => {
              const isPast = step.num < etapa;
              const isCurrent = step.num === etapa;
              return (
                <div key={step.num} className="flex items-center w-full">
                  <button
                    type="button"
                    onClick={() => irPara(step.num)}
                    className="flex flex-col items-center group relative z-10"
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold transition ${
                        isCurrent
                          ? "bg-slate-900 text-white ring-4 ring-slate-100"
                          : isPast
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                      }`}
                    >
                      {isPast ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> : step.num}
                    </div>
                    <span
                      className={`text-[10px] mt-1 hidden sm:block whitespace-nowrap ${
                        isCurrent ? "font-semibold text-slate-900" : "text-slate-500"
                      }`}
                    >
                      {step.title}
                    </span>
                  </button>
                  {i < arr.length - 1 && (
                    <div
                      className={`flex-1 h-px mx-2 ${
                        isPast ? "bg-emerald-500" : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Body scroll */}
        <div className="flex-1 overflow-y-auto bg-[#F7F9FB] p-5 md:p-7 relative" ref={topoRef}>
          <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            <div className="min-w-0">
              {erroGeral && (
                <div className="mb-4">
                  <Alert tone="danger" title="Falha de comunicação" action={<Button size="sm" variant="secondary" onClick={() => void salvar(draft)}>Tentar novamente</Button>}>
                    {erroGeral}
                  </Alert>
                </div>
              )}

              <fieldset disabled={bloqueada} className="min-w-0">
                {etapa === 1 && (
                  <StepIdentificacao draft={draft} erros={erros} atualizar={atualizar} obraNome={obraNome} onBuscar={() => void buscar(draft.descricaoServico.trim())} buscando={estado === "pesquisando"} />
                )}
                {etapa === 2 && (
                  <StepAtividadesRiscos
                    draft={draft}
                    erros={erros}
                    atualizar={atualizar}
                    obraNome={obraNome}
                    onRemoverAtividade={removerAtividade}
                    onAdicionarManual={adicionarAtividadeManual}
                    onSelecionarBase={(id, nome, cat) => adicionarAtividadeBase(id, nome, cat)}
                  />
                )}
                {etapa === 3 && <StepMedidas draft={draft} erros={erros} atualizar={atualizar} obraNome={obraNome} />}
                {etapa === 4 && (
                  <div className="flex flex-col gap-5">
                    <section className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all overflow-hidden p-4 sm:p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h2 className="text-[16px] font-semibold text-slate-900 tracking-tight">Revisão final</h2>
                          <p className="mt-1 text-sm text-slate-500">Confira todos os itens. Você pode voltar às etapas anteriores para corrigir.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {draft.codigo && <span className="text-[11px] font-mono text-slate-400">{draft.codigo}</span>}
                          <AprStatusBadge status={draft.status} />
                        </div>
                      </div>
                      {Object.keys(validarDraft(draft, 3)).length > 0 && (
                        <div className="mt-4">
                          <Alert tone="warning" title="Existem pendências na APR">
                            Volte às etapas anteriores e preencha as informações obrigatórias.
                          </Alert>
                        </div>
                      )}
                      <label className="mt-6 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 cursor-pointer hover:bg-slate-100 transition-colors">
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                          checked={draft.revisadaPeloAutor}
                          onChange={(e) => atualizar((d) => ({ ...d, revisadaPeloAutor: e.target.checked }))}
                        />
                        <span className="text-sm text-slate-800">
                          Declaro que revisei todas as atividades, riscos e medidas de controle desta APR e que refletem a situação real da frente de serviço.
                          <span className="mt-1 block text-xs text-slate-500">Elaborador: {usuarioNome} · {new Date().toLocaleDateString("pt-BR")}</span>
                        </span>
                      </label>
                    </section>
                    <AprResumo draft={draft} obraNome={obraNome} onEditar={irPara} />
                  </div>
                )}
              
                {(etapa === 1 || etapa === 2) && (
                  <div className="w-full mt-4">
                    {painelAssistente}
                  </div>
                )}
              </fieldset>
            </div>
        </div>

        </div>

        {/* Footer */}
        <div className="flex-none px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-7 py-4 rounded-xl text-[14.5px] font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => void salvar(draft)} disabled={salvando} className="hidden sm:inline-flex px-7 py-4 rounded-xl text-[14.5px] font-medium text-slate-600 hover:bg-slate-100 transition">
              Salvar rascunho
            </Button>
            
            {etapa > 1 && (
              <button
                type="button"
                onClick={() => irPara(etapa - 1)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-[12.5px] font-medium text-slate-700 hover:bg-slate-100 transition"
              >
                <ChevronLeft className="w-6 h-6" />
                Voltar
              </button>
            )}
            {etapa < 4 ? (
              <button
                type="button"
                onClick={() => void avancar()}
                disabled={salvando}
                className="inline-flex items-center gap-1.5 px-7 py-4 rounded-xl text-[14.5px] font-semibold bg-slate-900 text-white hover:bg-slate-800 transition disabled:opacity-50"
              >
                {etapa === 3 ? "Revisar APR" : "Continuar"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmEnvio(true)}
                disabled={!draft.revisadaPeloAutor || Object.keys(validarDraft(draft, 3)).length > 0 || enviando}
                className="inline-flex items-center gap-1.5 px-7 py-4 rounded-xl text-[14.5px] font-semibold bg-slate-900 text-white hover:bg-slate-800 transition disabled:opacity-50"
              >
                Enviar para aprovação
              </button>
            )}
          </div>
        </div>

      </div>

      <ConfirmDialog
        open={confirmEnvio}
        title="Enviar APR para aprovação?"
        description="Após o envio, a APR não poderá ser editada até que o aprovador a aprove ou devolva."
        confirmLabel="Enviar para aprovação"
        tone="primary"
        loading={enviando}
        onCancel={() => setConfirmEnvio(false)}
        onConfirm={() => void enviarParaAprovacao()}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Painel do assistente
// ---------------------------------------------------------------------------
function IconeAssistente() {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-border-slate-400 ring-slate-400-soft text-border-slate-400 ring-slate-400" aria-hidden>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.2 2.2M16.2 16.2l2.2 2.2M5.6 18.4l2.2-2.2M16.2 7.8l2.2-2.2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function EstadoBadge({ estado }: { estado: EstadoAssistente }) {
  const map: Record<EstadoAssistente, { label: string; tone: "neutral" | "info" | "success" | "warning" | "danger" }> = {
    aguardando: { label: "Aguardando descrição", tone: "neutral" },
    pesquisando: { label: "Pesquisando…", tone: "info" },
    sugestoes: { label: "Sugestões disponíveis", tone: "info" },
    vazio: { label: "Nenhum resultado", tone: "warning" },
    erro: { label: "Erro na consulta", tone: "danger" },
    revisado: { label: "Sugestões revisadas", tone: "success" },
  };
  const m = map[estado];
  return <Badge tone={m.tone}>{m.label}</Badge>;
}

function AssistentePanel({
  estado,
  busca,
  erro,
  draft,
  pendentesRevisao,
  obrigSemJustificativa,
  etapa,
  onBuscar,
  onToggle,
  onIrEtapa,
}: {
  estado: EstadoAssistente;
  busca: BuscaResposta | null;
  erro: string | null;
  draft: AprDraft;
  pendentesRevisao: number;
  obrigSemJustificativa: number;
  etapa: number;
  onBuscar: () => void;
  onToggle: (s: SugestaoAtividade) => void;
  onIrEtapa: (n: number) => void;
}) {
  const podeBuscar = draft.descricaoServico.trim().length >= 10;
  const sugestoes = busca?.sugestoes ?? [];
  const selecionadas = new Set(draft.atividades.map((a) => a.atividadeOrigemId).filter((x): x is number => x !== null));

  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all overflow-hidden flex flex-col" aria-label="Assistente de APR" aria-live="polite">
      <div className="flex items-center justify-between gap-2 border-b border-border-slate-200 px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <IconeAssistente />
          Assistente de APR
        </span>
        <EstadoBadge estado={estado} />
      </div>

      <div className="flex flex-col gap-4 p-4">
        <p className="text-xs text-slate-500">
          As sugestões vêm da base de conhecimento revisada pela equipe de SST{busca?.interpretadoPorIa ? ", com apoio de IA na interpretação da descrição" : ""}. Elas não substituem a avaliação da situação real e nunca aprovam a APR automaticamente.
        </p>

        {estado === "aguardando" && (
          <div className="rounded-lg border border-dashed border-border-slate-200 p-4 text-center">
            <p className="text-sm text-slate-800">Descreva a atividade na etapa 1 para receber sugestões.</p>
            <p className="mt-1 text-xs text-slate-500">Quanto mais detalhes (equipamentos, altura, local), melhores as sugestões.</p>
            <Button className="mt-3" size="sm" variant="primary" onClick={onBuscar} disabled={!podeBuscar}>
              Buscar atividades
            </Button>
          </div>
        )}

        {estado === "pesquisando" && (
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-800-secondary">
            <Spinner /> Pesquisando atividades na base de conhecimento…
          </div>
        )}

        {estado === "erro" && (
          <Alert tone="danger" title="Erro na consulta" action={<Button size="sm" variant="secondary" onClick={onBuscar}>Tentar novamente</Button>}>
            {erro ?? "Não foi possível consultar a base."}
          </Alert>
        )}

        {estado === "vazio" && (
          <Alert tone="warning" title="Nenhuma atividade correspondente">
            Não encontramos atividades cadastradas para esta descrição. Você pode adicionar uma atividade manualmente na etapa 2. A busca foi registrada para revisão da equipe de SST.
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="secondary" onClick={onBuscar}>
                Buscar novamente
              </Button>
              {etapa !== 2 && (
                <Button size="sm" variant="ghost" onClick={() => onIrEtapa(2)}>
                  Ir para atividades
                </Button>
              )}
            </div>
          </Alert>
        )}

        {(estado === "sugestoes" || estado === "revisado") && busca && (
          <>
            {busca.trechos.length > 1 && (
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Trechos identificados</p>
                <div className="flex flex-wrap gap-1.5">
                  {busca.trechos.map((t, i) => (
                    <Badge key={i} tone="neutral" className="max-w-full">
                      <span className="truncate">{t}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {!busca.satisfatoria && (
              <p className="rounded-md bg-bg-amber-50 text-amber-700 px-3 py-2 text-xs text-amber-900">
                As correspondências têm baixa confiança. Confira com atenção ou adicione a atividade manualmente. A busca foi registrada para revisão da SST.
              </p>
            )}
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Atividades sugeridas ({sugestoes.length})
                </p>
                <span className="text-[11px] text-slate-500">
                  Marque o círculo para incluir
                </span>
              </div>
              <ul className="flex flex-col gap-2">
                {sugestoes.map((s) => {
                  const adicionada = selecionadas.has(s.id);
                  return (
                    <li
                      key={s.id}
                      className={`group rounded-2xl border p-4 transition-all ${
                        adicionada
                          ? "border-blue-400 bg-blue-50/50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Círculo de seleção */}
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={adicionada}
                          aria-label={`${adicionada ? "Remover da APR" : "Adicionar à APR"}: ${s.nome}`}
                          onClick={() => onToggle(s)}
                          className={`mt-0.5 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                            adicionada
                              ? "border-blue-500 bg-blue-500 text-white scale-105 shadow-md"
                              : "border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/50"
                          }`}
                        >
                          <svg
                            className={`h-3.5 w-3.5 transform transition-transform duration-300 ${adicionada ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>

                        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onToggle(s)}>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`text-sm ${
                                adicionada ? "font-semibold text-slate-900" : "font-medium text-slate-800"
                              }`}
                            >
                              {s.nome}
                            </span>
                            <RelevanciaBadge relevancia={s.relevancia} />
                            {adicionada && (
                              <span className="text-xs font-medium text-border-slate-400 ring-slate-400">• Incluída na APR</span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {s.categoria ?? "Sem categoria"} · {s.qtdRiscos} risco(s)
                            {s.termosCorrespondentes.length > 0 && <> · termos: {s.termosCorrespondentes.join(", ")}</>}
                          </p>
                          {s.relevancia === "alta" && !adicionada && (
                            <p className="mt-1 text-[11px] text-amber-700">
                              Desmarcada. Clique no círculo para incluir novamente.
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {sugestoes.length > 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  {sugestoes.filter((s) => selecionadas.has(s.id)).length} de {sugestoes.length} sugestão(ões) selecionada(s).
                </p>
              )}
            </div>
            <Button size="sm" variant="ghost" onClick={onBuscar}>
              Pesquisar novamente com a descrição atual
            </Button>
          </>
        )}

        {/* Pendências de validação */}
        {draft.atividades.length > 0 && (
          <div className="border-t border-border-slate-200 pt-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Situação da análise</p>
            <ul className="flex flex-col gap-1.5 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-slate-800-secondary">Atividades selecionadas</span>
                <Badge tone="success">{draft.atividades.length}</Badge>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-800-secondary">Riscos aguardando revisão</span>
                {pendentesRevisao ? (
                  <button type="button" onClick={() => onIrEtapa(2)} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-amber-50 text-amber-700 border border-amber-100 hover:underline">
                    ◔ {pendentesRevisao}
                  </button>
                ) : (
                  <Badge tone="success">✓ 0</Badge>
                )}
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-800-secondary">Medidas confirmadas</span>
                <Badge tone="success">
                  {draft.atividades.reduce((s, a) => s + a.riscos.filter((r) => r.selecionado).reduce((x, r) => x + r.controles.filter((c) => c.selecionado).length, 0), 0)}
                </Badge>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-800-secondary">Precisam de validação</span>
                {obrigSemJustificativa ? (
                  <button type="button" onClick={() => onIrEtapa(3)} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-red-50 text-red-700 border border-red-100 hover:underline">
                    ! {obrigSemJustificativa} obrigatória(s) sem justificativa
                  </button>
                ) : (
                  <Badge tone="success">✓ 0</Badge>
                )}
              </li>
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
