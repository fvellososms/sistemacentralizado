"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Badge, Spinner, type Tone } from "@/components/ui";
import { calcularNivel, NIVEL_LABEL, NIVEL_SIMBOLO } from "@/lib/apr/risco";
import {
  PROBABILIDADE_LABEL,
  SEVERIDADE_LABEL,
  STATUS_LABEL,
  TIPO_CONTROLE_LABEL,
  type AprStatus,
  type Probabilidade,
  type Relevancia,
  type Severidade,
  type TipoControle,
} from "@/lib/apr/types";

// ---------------------------------------------------------------------------
// Status da APR
// ---------------------------------------------------------------------------
const STATUS_TONE: Record<AprStatus, Tone> = {
  rascunho: "neutral",
  aguardando_aprovacao: "info",
  aprovada: "success",
  reprovada: "warning",
};

export function AprStatusBadge({ status, etapa }: { status: AprStatus; etapa?: number }) {
  if (status === "rascunho" && etapa && etapa < 4) {
    return (
      <Badge tone="neutral" title={`Em elaboração – etapa ${etapa} de 4`}>
        <span className="flex items-center gap-1" aria-hidden>
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className={`h-1.5 w-1.5 rounded-full ${i <= etapa ? "bg-border-slate-400 ring-slate-400" : "bg-border-slate-200"}`} />
          ))}
        </span>
        Em elaboração
      </Badge>
    );
  }
  const icon: Record<AprStatus, string> = { rascunho: "○", aguardando_aprovacao: "◔", aprovada: "✓", reprovada: "!" };
  return (
    <Badge tone={STATUS_TONE[status]}>
      <span aria-hidden>{icon[status]}</span>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Nível de risco (cor + símbolo textual)
// ---------------------------------------------------------------------------
export function NivelBadge({ probabilidade, severidade }: { probabilidade: Probabilidade; severidade: Severidade }) {
  const nivel = calcularNivel(probabilidade, severidade);
  const tone: Tone = nivel === "baixo" ? "success" : nivel === "moderado" ? "warning" : "danger";
  return (
    <Badge
      tone={tone}
      title={`Probabilidade ${PROBABILIDADE_LABEL[probabilidade].toLowerCase()} × severidade ${SEVERIDADE_LABEL[severidade].toLowerCase()}`}
    >
      <span className="font-semibold" aria-hidden>
        {NIVEL_SIMBOLO[nivel]}
      </span>
      Risco {NIVEL_LABEL[nivel].toLowerCase()}
    </Badge>
  );
}

export function TipoControleBadge({ tipo }: { tipo: TipoControle }) {
  return <Badge tone="neutral">{TIPO_CONTROLE_LABEL[tipo]}</Badge>;
}

export function RelevanciaBadge({ relevancia }: { relevancia: Relevancia }) {
  if (relevancia === "alta") return <Badge tone="info">● Alta relevância</Badge>;
  if (relevancia === "possivel") return <Badge tone="neutral">◐ Possível</Badge>;
  return <Badge tone="neutral">○ Baixa</Badge>;
}

export function OrigemBadge({ origem }: { origem: "base" | "manual" | "ia" }) {
  if (origem === "manual") return <Badge tone="neutral">Adicionado manualmente</Badge>;
  if (origem === "ia") return <Badge tone="info">Sugestão</Badge>;
  return <Badge tone="neutral">Base de conhecimento</Badge>;
}

// ---------------------------------------------------------------------------
// Indicador de etapas
// ---------------------------------------------------------------------------
export const ETAPAS = [
  { n: 1, titulo: "Identificação", curto: "Identificação" },
  { n: 2, titulo: "Atividades e riscos", curto: "Riscos" },
  { n: 3, titulo: "Medidas de controle", curto: "Controles" },
  { n: 4, titulo: "Revisão e aprovação", curto: "Revisão" },
];

export function StepIndicator({
  atual,
  maxAlcancada,
  onIr,
}: {
  atual: number;
  maxAlcancada: number;
  onIr: (n: number) => void;
}) {
  return (
    <ol className="flex items-center gap-1 sm:gap-2" aria-label="Etapas da elaboração">
      {ETAPAS.map((e, i) => {
        const done = e.n < atual;
        const ativo = e.n === atual;
        const habilitado = e.n <= maxAlcancada;
        return (
          <li key={e.n} className="flex flex-1 items-center gap-1 sm:gap-2">
            <button
              type="button"
              disabled={!habilitado}
              onClick={() => onIr(e.n)}
              aria-current={ativo ? "step" : undefined}
              className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors sm:px-3 ${
                ativo ? "bg-border-slate-400 ring-slate-400-soft" : habilitado ? "hover:bg-slate-50" : "cursor-not-allowed opacity-60"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  done
                    ? "bg-text-emerald-600 text-white"
                    : ativo
                      ? "bg-border-slate-400 ring-slate-400 text-white"
                      : "border border-border-slate-200 bg-bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all overflow-hidden text-slate-800-secondary"
                }`}
                aria-hidden
              >
                {done ? "✓" : e.n}
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] uppercase tracking-wide text-slate-500">Etapa {e.n}</span>
                <span className={`block truncate text-sm font-medium ${ativo ? "text-border-slate-400 ring-slate-400" : "text-slate-800"}`}>
                  <span className="sm:hidden">{e.curto}</span>
                  <span className="hidden sm:inline">{e.titulo}</span>
                </span>
              </span>
            </button>
            {i < ETAPAS.length - 1 && <span className="hidden h-px w-4 shrink-0 bg-border-slate-200 md:block" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Autocomplete (busca com sugestões, navegação por teclado)
// ---------------------------------------------------------------------------
export interface OpcaoAuto {
  id: number | string;
  titulo: string;
  subtitulo?: string;
  extra?: ReactNode;
}

export function Autocomplete({
  label,
  placeholder,
  buscar,
  onSelecionar,
  onCriar,
  criarLabel = "Adicionar",
  help,
  required,
}: {
  label: string;
  placeholder?: string;
  buscar: (q: string) => Promise<OpcaoAuto[]>;
  onSelecionar: (o: OpcaoAuto) => void;
  onCriar?: (texto: string) => void;
  criarLabel?: string;
  help?: string;
  required?: boolean;
}) {
  const id = useId();
  const [q, setQ] = useState("");
  const [opcoes, setOpcoes] = useState<OpcaoAuto[]>([]);
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ativo, setAtivo] = useState(-1);
  const wrap = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!aberto) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [aberto]);

  function disparar(valor: string) {
    if (timer.current) clearTimeout(timer.current);
    if (valor.trim().length < 2) {
      setOpcoes([]);
      return;
    }
    timer.current = setTimeout(async () => {
      setCarregando(true);
      setErro(null);
      try {
        const r = await buscar(valor.trim());
        setOpcoes(r);
        setAtivo(r.length ? 0 : -1);
      } catch {
        setErro("Falha ao consultar. Tente novamente.");
      } finally {
        setCarregando(false);
      }
    }, 220);
  }

  const podeCriar = Boolean(onCriar && q.trim().length >= 3);
  const total = opcoes.length + (podeCriar ? 1 : 0);

  function escolher(idx: number) {
    if (idx < opcoes.length) {
      onSelecionar(opcoes[idx]);
    } else if (podeCriar && onCriar) {
      onCriar(q.trim());
    }
    setQ("");
    setOpcoes([]);
    setAberto(false);
  }

  return (
    <div ref={wrap} className="relative">
      <label htmlFor={id} className="block text-sm font-medium mb-1 text-slate-700">
        {label}
        {required && (
          <span className="ml-0.5 text-text-red-600" aria-hidden>
            *
          </span>
        )}
      </label>
      <div className="relative">
        <input
          id={id}
          className="border border-slate-300 rounded p-2 w-full focus:ring-2 focus:ring-slate-900 focus:outline-none text-[13px] pr-10"
          role="combobox"
          aria-expanded={aberto}
          aria-controls={`${id}-lista`}
          aria-autocomplete="list"
          aria-activedescendant={ativo >= 0 ? `${id}-op-${ativo}` : undefined}
          autoComplete="off"
          placeholder={placeholder}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setAberto(true);
            disparar(e.target.value);
          }}
          onFocus={() => q && setAberto(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setAberto(true);
              setAtivo((a) => (total ? (a + 1) % total : -1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setAtivo((a) => (total ? (a - 1 + total) % total : -1));
            } else if (e.key === "Enter") {
              if (aberto && ativo >= 0) {
                e.preventDefault();
                escolher(ativo);
              } else if (podeCriar) {
                e.preventDefault();
                escolher(opcoes.length);
              }
            } else if (e.key === "Escape") {
              setAberto(false);
            }
          }}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
          {carregando ? (
            <Spinner />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
          )}
        </span>
      </div>
      {help && <p className="text-slate-500 text-xs mt-1 block">{help}</p>}
      {erro && <p className="text-red-500 text-xs mt-1 block">{erro}</p>}

      {aberto && q.trim().length >= 2 && (
        <ul
          id={`${id}-lista`}
          role="listbox"
          className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all overflow-hidden absolute left-0 right-0 z-20 mt-1 max-h-72 overflow-y-auto p-1 shadow-lg"
        >
          {opcoes.length === 0 && !carregando && (
            <li className="px-3 py-2 text-sm text-slate-500">Nenhum item encontrado na base.</li>
          )}
          {opcoes.map((o, i) => (
            <li
              key={o.id}
              id={`${id}-op-${i}`}
              role="option"
              aria-selected={ativo === i}
              onMouseEnter={() => setAtivo(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => escolher(i)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 ${
                ativo === i ? "bg-border-slate-400 ring-slate-400-soft" : ""
              }`}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-slate-800">{o.titulo}</span>
                {o.subtitulo && <span className="block truncate text-xs text-slate-500">{o.subtitulo}</span>}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {o.extra}
                <span className="text-xs font-medium text-border-slate-400 ring-slate-400">Selecionar</span>
              </span>
            </li>
          ))}
          {podeCriar && (
            <li
              id={`${id}-op-${opcoes.length}`}
              role="option"
              aria-selected={ativo === opcoes.length}
              onMouseEnter={() => setAtivo(opcoes.length)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => escolher(opcoes.length)}
              className={`mt-1 flex cursor-pointer items-center justify-between gap-3 rounded-md border-t border-border-slate-200 px-3 py-2 ${
                ativo === opcoes.length ? "bg-border-slate-400 ring-slate-400-soft" : ""
              }`}
            >
              <span className="text-sm text-slate-800">
                {criarLabel} <span className="font-medium">“{q.trim()}”</span>
                <span className="block text-xs text-slate-500">Item manual, fora da base de conhecimento</span>
              </span>
              <span className="text-xs font-medium text-border-slate-400 ring-slate-400">Adicionar</span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
