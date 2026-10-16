"use client";

import { useState } from "react";
import { Alert, Badge, Button, Input, Select, Textarea } from "@/components/ui";
import { Autocomplete, NivelBadge, TipoControleBadge, type OpcaoAuto } from "./shared";
import type { Erros } from "@/lib/apr/validacao";
import {
  novaKey,
  PROBABILIDADE_LABEL,
  SEVERIDADE_LABEL,
  TIPO_CONTROLE_LABEL,
  TIPO_CONTROLE_ORDEM,
  type AprDraft,
  type AtividadeDraft,
  type ControleDraft,
  type Probabilidade,
  type RiscoBase,
  type RiscoDraft,
  type Severidade,
  type TipoControle,
} from "@/lib/apr/types";

export interface StepProps {
  draft: AprDraft;
  erros: Erros;
  atualizar: (fn: (d: AprDraft) => AprDraft) => void;
  obraNome: string | null;
}

// ---------------------------------------------------------------------------
// Etapa 1 — Identificação e descrição
// ---------------------------------------------------------------------------
export function StepIdentificacao({
  draft,
  erros,
  atualizar,
  obraNome,
  onBuscar,
  buscando,
}: StepProps & { onBuscar: () => void; buscando: boolean }) {
  const set = <K extends keyof AprDraft>(k: K, v: AprDraft[K]) => atualizar((d) => ({ ...d, [k]: v }));
  return (
    <div className="flex flex-col gap-5">
      <section className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all overflow-hidden p-4 sm:p-6">
        <h2 className="text-[16px] font-semibold text-slate-900 tracking-tight">Identificação</h2>
        <p className="mt-1 text-sm text-slate-800-secondary">Dados da obra, local e responsáveis pela execução do serviço.</p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input label="Obra" value={obraNome ?? "Nenhuma obra selecionada"} disabled help="Definida pela obra ativa no cabeçalho." />
          <Input
            label="Local / frente de serviço"
            required
            placeholder="Ex.: Torre B – 3º pavimento"
            value={draft.localObra}
            onChange={(e) => set("localObra", e.target.value)}
            error={erros.localObra}
          />
          <Input
            label="Responsável pela execução"
            required
            placeholder="Nome do encarregado ou líder"
            value={draft.responsavel}
            onChange={(e) => set("responsavel", e.target.value)}
            error={erros.responsavel}
          />
          <Input
            label="Data prevista de execução"
            required
            type="date"
            value={draft.dataExecucao}
            onChange={(e) => set("dataExecucao", e.target.value)}
            error={erros.dataExecucao}
          />
          <Input
            className="md:col-span-2"
            label="Equipe envolvida"
            placeholder="Ex.: 2 pedreiros, 1 servente"
            value={draft.equipe}
            onChange={(e) => set("equipe", e.target.value)}
            help="Opcional. Informe funções e quantidade de pessoas."
          />
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all overflow-hidden border-border-slate-400 ring-slate-400/40 p-4 ring-1 ring-slate-400/20 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-border-slate-400 ring-slate-400-soft text-border-slate-400 ring-slate-400" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.2 2.2M16.2 16.2l2.2 2.2M5.6 18.4l2.2-2.2M16.2 7.8l2.2-2.2" strokeLinecap="round" />
            </svg>
          </span>
          <div>
            <h2 className="text-[16px] font-semibold text-slate-900 tracking-tight">Descrição da atividade</h2>
            <p className="mt-1 text-sm text-slate-800-secondary">
              Descreva com suas palavras o que será feito. Este texto alimenta a busca inteligente de atividades, riscos e medidas na base de conhecimento.
            </p>
          </div>
        </div>
        <Textarea
          className="mt-4"
          label="O que será executado?"
          required
          rows={5}
          placeholder="Ex.: Vamos montar andaime fachadeiro na face norte para fazer o reboco externo e depois passar a fiação elétrica do 3º andar."
          value={draft.descricaoServico}
          onChange={(e) => set("descricaoServico", e.target.value)}
          error={erros.descricaoServico}
          help="Cite equipamentos, altura, local e materiais. Descrições compostas são decompostas em várias atividades."
        />
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">As sugestões são apenas um ponto de partida e devem ser avaliadas para a situação real da obra.</p>
          <Button variant="secondary" onClick={onBuscar} loading={buscando} disabled={draft.descricaoServico.trim().length < 10}>
            Buscar atividades na base
          </Button>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Utilitários de construção de rascunho
// ---------------------------------------------------------------------------
export function riscoBaseParaDraft(r: RiscoBase): RiscoDraft {
  return {
    key: novaKey("r"),
    nome: r.nome,
    nrs: r.nrs,
    probabilidade: r.probabilidade,
    severidade: r.severidade,
    selecionado: true,
    revisado: false,
    riscoOrigemId: r.id,
    origem: "base",
    controles: r.controles.map((c) => ({
      key: novaKey("c"),
      nome: c.nome,
      tipoControle: c.tipoControle,
      obrigatorio: c.obrigatorio,
      selecionado: c.obrigatorio,
      controleOrigemId: c.id,
      origem: "base",
    })),
  };
}

export function riscoManual(nome: string): RiscoDraft {
  return {
    key: novaKey("r"),
    nome,
    nrs: [],
    probabilidade: "media",
    severidade: "moderada",
    selecionado: true,
    revisado: true,
    riscoOrigemId: null,
    origem: "manual",
    controles: [],
  };
}

// ---------------------------------------------------------------------------
// Etapa 2 — Atividades e riscos
// ---------------------------------------------------------------------------
export function StepAtividadesRiscos({
  draft,
  erros,
  atualizar,
  onRemoverAtividade,
  onAdicionarManual,
  onSelecionarBase,
}: StepProps & {
  onRemoverAtividade: (key: string) => void;
  onAdicionarManual: (nome: string) => void;
  onSelecionarBase: (id: number, nome: string, categoria: string | null) => Promise<void>;
}) {
  const atualizarRisco = (aKey: string, rKey: string, fn: (r: RiscoDraft) => RiscoDraft) =>
    atualizar((d) => ({
      ...d,
      atividades: d.atividades.map((a) => (a.key === aKey ? { ...a, riscos: a.riscos.map((r) => (r.key === rKey ? fn(r) : r)) } : a)),
    }));

  const adicionarRisco = (aKey: string, r: RiscoDraft) =>
    atualizar((d) => ({ ...d, atividades: d.atividades.map((a) => (a.key === aKey ? { ...a, riscos: [...a.riscos, r] } : a)) }));

  const removerRisco = (aKey: string, rKey: string) =>
    atualizar((d) => ({
      ...d,
      atividades: d.atividades.map((a) => (a.key === aKey ? { ...a, riscos: a.riscos.filter((r) => r.key !== rKey) } : a)),
    }));

  async function buscarRiscos(q: string): Promise<OpcaoAuto[]> {
    const res = await fetch(`/api/apr/riscos?q=${encodeURIComponent(q)}`);
    if (!res.ok) throw new Error();
    const data = (await res.json()) as { itens: { id: number; nome: string; descricao: string | null }[] };
    return data.itens.map((i) => ({ id: i.id, titulo: i.nome, subtitulo: i.descricao ?? undefined }));
  }

  async function buscarAtividades(q: string): Promise<OpcaoAuto[]> {
    const res = await fetch("/api/apr/busca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: q, registrar: false }),
    });
    if (!res.ok) throw new Error();
    const data = (await res.json()) as { sugestoes: { id: number; nome: string; categoria: string | null; qtdRiscos: number }[] };
    return data.sugestoes
      .filter((s) => !draft.atividades.some((a) => a.atividadeOrigemId === s.id))
      .map((s) => ({ id: s.id, titulo: s.nome, subtitulo: `${s.categoria ?? "Sem categoria"} · ${s.qtdRiscos} riscos`, extra: undefined }));
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all overflow-hidden p-4 sm:p-6">
        <h2 className="text-[16px] font-semibold text-slate-900 tracking-tight">Atividades da APR</h2>
        <p className="mt-1 text-sm text-slate-800-secondary">
          Use as sugestões do assistente ou busque diretamente na base. Cada atividade traz os riscos associados para sua avaliação.
        </p>
        <div className="mt-4">
          <Autocomplete
            label="Adicionar atividade"
            placeholder="Digite para buscar (ex.: solda, escavação, andaime)…"
            buscar={buscarAtividades}
            onSelecionar={(o) => {
              const [categoria] = (o.subtitulo ?? "").split(" · ");
              void onSelecionarBase(Number(o.id), o.titulo, categoria && categoria !== "Sem categoria" ? categoria : null);
            }}
            onCriar={onAdicionarManual}
            criarLabel="Adicionar atividade manual"
          />
        </div>
        {erros.atividades && <p className="text-red-500 text-xs mt-1 block mt-3">{erros.atividades}</p>}
      </section>

      {draft.atividades.length === 0 && (
        <Alert tone="neutral" title="Nenhuma atividade selecionada">
          Selecione uma sugestão do assistente ou use a busca acima para começar.
        </Alert>
      )}

      {draft.atividades.map((a, idx) => (
        <AtividadeCard
          key={a.key}
          atividade={a}
          indice={idx}
          erroPendente={erros[`riscos_${a.key}`]}
          erroVazio={erros[`riscos_vazio_${a.key}`]}
          onRemover={() => onRemoverAtividade(a.key)}
          onAtualizarRisco={(rKey, fn) => atualizarRisco(a.key, rKey, fn)}
          onRemoverRisco={(rKey) => removerRisco(a.key, rKey)}
          onAdicionarRisco={(r) => adicionarRisco(a.key, r)}
          buscarRiscos={buscarRiscos}
        />
      ))}
    </div>
  );
}

function AtividadeCard({
  atividade: a,
  indice,
  erroPendente,
  erroVazio,
  onRemover,
  onAtualizarRisco,
  onRemoverRisco,
  onAdicionarRisco,
  buscarRiscos,
}: {
  atividade: AtividadeDraft;
  indice: number;
  erroPendente?: string;
  erroVazio?: string;
  onRemover: () => void;
  onAtualizarRisco: (rKey: string, fn: (r: RiscoDraft) => RiscoDraft) => void;
  onRemoverRisco: (rKey: string) => void;
  onAdicionarRisco: (r: RiscoDraft) => void;
  buscarRiscos: (q: string) => Promise<OpcaoAuto[]>;
}) {
  const pendentes = a.riscos.filter((r) => !r.revisado).length;
  const aplicaveis = a.riscos.filter((r) => r.selecionado && r.revisado).length;

  async function selecionarRiscoBase(o: OpcaoAuto) {
    const res = await fetch(`/api/apr/riscos?id=${o.id}`);
    const data = (await res.json()) as { risco: RiscoBase | null };
    if (data.risco) {
      if (a.riscos.some((r) => r.riscoOrigemId === data.risco!.id)) return;
      onAdicionarRisco({ ...riscoBaseParaDraft(data.risco), revisado: true });
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all overflow-hidden overflow-hidden" aria-labelledby={`atv-${a.key}`}>
      <div className="flex flex-wrap items-center gap-2 border-b border-border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
        <span className="text-[11px] font-mono text-slate-400">{String(indice + 1).padStart(2, "0")}</span>
        <h3 id={`atv-${a.key}`} className="min-w-0 flex-1 text-sm font-semibold text-slate-900">
          {a.nome}
        </h3>
        {a.categoria && <Badge tone="neutral">{a.categoria}</Badge>}
        {a.origem === "manual" ? <Badge tone="neutral">Manual</Badge> : <Badge tone="info">Sugestão da base</Badge>}
        <Button size="sm" variant="ghost" onClick={onRemover} aria-label={`Remover atividade ${a.nome}`}>
          Remover
        </Button>
      </div>

      <div className="p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-800-secondary">
          <span className="font-medium text-slate-800">Riscos relacionados</span>
          <span aria-hidden>·</span>
          <span>{aplicaveis} aplicável(is)</span>
          {pendentes > 0 && (
            <Badge tone="warning">
              <span aria-hidden>◔</span> {pendentes} aguardando revisão
            </Badge>
          )}
        </div>
        {a.origem === "base" && a.riscos.some((r) => !r.revisado) && (
          <p className="mb-3 rounded-md bg-border-slate-400 ring-slate-400-soft px-3 py-2 text-xs text-blue-900">
            Os riscos abaixo são sugestões da base de conhecimento. Avalie cada um para a situação real desta frente de serviço.
          </p>
        )}
        {erroPendente && <p className="text-red-500 text-xs mt-1 block mb-3">{erroPendente}</p>}
        {erroVazio && <p className="text-red-500 text-xs mt-1 block mb-3">{erroVazio}</p>}

        <ul className="flex flex-col gap-3">
          {a.riscos.map((r) => (
            <RiscoCard
              key={r.key}
              risco={r}
              onAtualizar={(fn) => onAtualizarRisco(r.key, fn)}
              onRemover={() => onRemoverRisco(r.key)}
            />
          ))}
        </ul>

        <div className="mt-4">
          <Autocomplete
            label="Adicionar risco não listado"
            placeholder="Buscar risco na base ou digitar um novo…"
            buscar={buscarRiscos}
            onSelecionar={(o) => void selecionarRiscoBase(o)}
            onCriar={(nome) => onAdicionarRisco(riscoManual(nome))}
            criarLabel="Adicionar risco manual"
          />
        </div>
      </div>
    </section>
  );
}

function RiscoCard({
  risco: r,
  onAtualizar,
  onRemover,
}: {
  risco: RiscoDraft;
  onAtualizar: (fn: (r: RiscoDraft) => RiscoDraft) => void;
  onRemover: () => void;
}) {
  const estado = !r.revisado ? "pendente" : r.selecionado ? "aplicavel" : "nao_aplica";
  const borda =
    estado === "pendente" ? "border-amber-200 bg-bg-amber-50 text-amber-700/40" : estado === "aplicavel" ? "border-border-slate-200" : "border-border-slate-200 bg-slate-50 opacity-75";

  return (
    <li className={`rounded-lg border p-3 sm:p-4 ${borda}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-800">{r.nome}</span>
            {r.selecionado && <NivelBadge probabilidade={r.probabilidade} severidade={r.severidade} />}
            {estado === "pendente" && (
              <Badge tone="warning">
                <span aria-hidden>◔</span> Aguardando revisão
              </Badge>
            )}
            {estado === "aplicavel" && (
              <Badge tone="success">
                <span aria-hidden>✓</span> Aplicável
              </Badge>
            )}
            {estado === "nao_aplica" && <Badge tone="neutral">Não se aplica</Badge>}
            {r.origem === "manual" && <Badge tone="neutral">Manual</Badge>}
          </div>
          {r.nrs.length > 0 && (
            <p className="mt-1 text-xs text-slate-500">Normas: {r.nrs.join(", ")}</p>
          )}
          {r.selecionado && (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-sm">
              <Select
                label="Probabilidade"
                value={r.probabilidade}
                onChange={(e) => onAtualizar((x) => ({ ...x, probabilidade: e.target.value as Probabilidade, revisado: true }))}
              >
                {(Object.keys(PROBABILIDADE_LABEL) as Probabilidade[]).map((p) => (
                  <option key={p} value={p}>
                    {PROBABILIDADE_LABEL[p]}
                  </option>
                ))}
              </Select>
              <Select
                label="Severidade"
                value={r.severidade}
                onChange={(e) => onAtualizar((x) => ({ ...x, severidade: e.target.value as Severidade, revisado: true }))}
              >
                {(Object.keys(SEVERIDADE_LABEL) as Severidade[]).map((s) => (
                  <option key={s} value={s}>
                    {SEVERIDADE_LABEL[s]}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
          {estado !== "aplicavel" && (
            <Button size="sm" variant="primary" onClick={() => onAtualizar((x) => ({ ...x, selecionado: true, revisado: true }))}>
              Confirmar aplicável
            </Button>
          )}
          {estado !== "nao_aplica" && (
            <Button size="sm" variant="secondary" onClick={() => onAtualizar((x) => ({ ...x, selecionado: false, revisado: true }))}>
              Não se aplica
            </Button>
          )}
          {r.origem === "manual" && (
            <Button size="sm" variant="ghost" onClick={onRemover}>
              Remover
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Etapa 3 — Medidas de controle
// ---------------------------------------------------------------------------
export function StepMedidas({ draft, erros, atualizar }: StepProps) {
  const atualizarRisco = (aKey: string, rKey: string, fn: (r: RiscoDraft) => RiscoDraft) =>
    atualizar((d) => ({
      ...d,
      atividades: d.atividades.map((a) => (a.key === aKey ? { ...a, riscos: a.riscos.map((r) => (r.key === rKey ? fn(r) : r)) } : a)),
    }));

  const riscosSelecionados = draft.atividades.flatMap((a) => a.riscos.filter((r) => r.selecionado).map((r) => ({ a, r })));

  return (
    <div className="flex flex-col gap-5">
      <section className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all overflow-hidden p-4 sm:p-6">
        <h2 className="text-[16px] font-semibold text-slate-900 tracking-tight">Medidas de controle por risco</h2>
        <p className="mt-1 text-sm text-slate-800-secondary">
          Medidas obrigatórias vêm pré-marcadas. Remover uma medida obrigatória exige justificativa. Você pode incluir medidas adicionais em cada risco.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="font-medium text-slate-800-secondary">Hierarquia:</span>
          {TIPO_CONTROLE_ORDEM.map((t, i) => (
            <span key={t}>
              {i + 1}. {TIPO_CONTROLE_LABEL[t]}
            </span>
          ))}
        </div>
      </section>

      {riscosSelecionados.length === 0 && (
        <Alert tone="warning" title="Nenhum risco aplicável">
          Volte à etapa anterior e confirme ao menos um risco aplicável.
        </Alert>
      )}

      {riscosSelecionados.map(({ a, r }) => (
        <ControlesDoRisco
          key={r.key}
          atividade={a}
          risco={r}
          erros={erros}
          onAtualizar={(fn) => atualizarRisco(a.key, r.key, fn)}
        />
      ))}
    </div>
  );
}

function ControlesDoRisco({
  atividade,
  risco: r,
  erros,
  onAtualizar,
}: {
  atividade: AtividadeDraft;
  risco: RiscoDraft;
  erros: Erros;
  onAtualizar: (fn: (r: RiscoDraft) => RiscoDraft) => void;
}) {
  const [tipoManual, setTipoManual] = useState<TipoControle>("administrativo");
  const confirmadas = r.controles.filter((c) => c.selecionado).length;

  const setControle = (cKey: string, fn: (c: ControleDraft) => ControleDraft) =>
    onAtualizar((x) => ({ ...x, controles: x.controles.map((c) => (c.key === cKey ? fn(c) : c)) }));

  async function buscarControles(q: string): Promise<OpcaoAuto[]> {
    const res = await fetch(`/api/apr/controles?q=${encodeURIComponent(q)}`);
    if (!res.ok) throw new Error();
    const data = (await res.json()) as { itens: { id: number; nome: string; descricao: string | null; tipoControle: TipoControle }[] };
    return data.itens
      .filter((i) => !r.controles.some((c) => c.controleOrigemId === i.id))
      .map((i) => ({ id: i.id, titulo: i.nome, subtitulo: TIPO_CONTROLE_LABEL[i.tipoControle], extra: undefined }));
  }

  const tipoDoSubtitulo = (s?: string): TipoControle =>
    (TIPO_CONTROLE_ORDEM.find((t) => TIPO_CONTROLE_LABEL[t] === s) ?? "administrativo") as TipoControle;

  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all overflow-hidden overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-slate-500">{atividade.nome}</p>
          <h3 className="text-sm font-semibold text-slate-900">{r.nome}</h3>
        </div>
        <NivelBadge probabilidade={r.probabilidade} severidade={r.severidade} />
        <Badge tone={confirmadas ? "success" : "warning"}>
          {confirmadas ? `✓ ${confirmadas} confirmada(s)` : "Sem medidas"}
        </Badge>
      </div>
      <div className="p-4 sm:p-5">
        {erros[`controles_${r.key}`] && <p className="text-red-500 text-xs mt-1 block mb-3">{erros[`controles_${r.key}`]}</p>}

        {r.controles.length === 0 && <p className="text-sm text-slate-500">Nenhuma medida sugerida. Adicione abaixo.</p>}

        <ul className="flex flex-col gap-2">
          {TIPO_CONTROLE_ORDEM.flatMap((tipo) =>
            r.controles
              .filter((c) => c.tipoControle === tipo)
              .map((c) => {
                const removidaObrig = c.obrigatorio && !c.selecionado;
                return (
                  <li key={c.key} className={`rounded-lg border p-3 ${removidaObrig ? "border-amber-200 bg-bg-amber-50 text-amber-700/50" : c.selecionado ? "border-emerald-200 bg-bg-emerald-50 text-emerald-700/40" : "border-border-slate-200"}`}>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-5 w-5 shrink-0 accent-border-slate-400 ring-slate-400"
                        checked={c.selecionado}
                        onChange={(e) => setControle(c.key, (x) => ({ ...x, selecionado: e.target.checked, justificativa: e.target.checked ? undefined : x.justificativa }))}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm text-slate-800">{c.nome}</span>
                          <TipoControleBadge tipo={c.tipoControle} />
                          {c.obrigatorio && <Badge tone="info">Obrigatória</Badge>}
                          {c.origem === "manual" && <Badge tone="neutral">Manual</Badge>}
                          {c.selecionado && !c.obrigatorio && <span className="text-xs text-text-emerald-600">confirmada</span>}
                        </span>
                      </span>
                      {c.origem === "manual" && (
                        <button
                          type="button"
                          className="text-xs text-slate-500 hover:text-text-red-600"
                          onClick={() => onAtualizar((x) => ({ ...x, controles: x.controles.filter((k) => k.key !== c.key) }))}
                        >
                          Remover
                        </button>
                      )}
                    </label>
                    {removidaObrig && (
                      <div className="mt-2 pl-8">
                        <Textarea
                          label="Justificativa para remover a medida obrigatória"
                          required
                          rows={2}
                          value={c.justificativa ?? ""}
                          onChange={(e) => setControle(c.key, (x) => ({ ...x, justificativa: e.target.value }))}
                          error={erros[`justificativa_${c.key}`]}
                        />
                      </div>
                    )}
                  </li>
                );
              }),
          )}
        </ul>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <Autocomplete
            label="Adicionar medida de controle"
            placeholder="Buscar medida na base ou digitar uma nova…"
            buscar={buscarControles}
            onSelecionar={(o) =>
              onAtualizar((x) => ({
                ...x,
                controles: [
                  ...x.controles,
                  { key: novaKey("c"), nome: o.titulo, tipoControle: tipoDoSubtitulo(o.subtitulo), obrigatorio: false, selecionado: true, controleOrigemId: Number(o.id), origem: "base" },
                ],
              }))
            }
            onCriar={(nome) =>
              onAtualizar((x) => ({
                ...x,
                controles: [...x.controles, { key: novaKey("c"), nome, tipoControle: tipoManual, obrigatorio: false, selecionado: true, controleOrigemId: null, origem: "manual" }],
              }))
            }
            criarLabel="Adicionar medida manual"
          />
          <Select label="Tipo (para medida manual)" value={tipoManual} onChange={(e) => setTipoManual(e.target.value as TipoControle)} className="sm:w-56">
            {TIPO_CONTROLE_ORDEM.map((t) => (
              <option key={t} value={t}>
                {TIPO_CONTROLE_LABEL[t]}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </section>
  );
}
