/**
 * Pure rules for the full non-conformity (NC) treatment cycle:
 * aberta → em tratamento (análise de causa + plano 5W2H) → aguardando verificação → encerrada,
 * with reopening when the actions are not effective, deadline extension and cancellation.
 */

import { diasAtePrazo, parseImageDataUrl, NC_FOTO_MAX_BYTES } from "./non-conformities.ts";

export const NC_STATUS = {
  aberta: "Aberta",
  em_tratamento: "Em tratamento",
  aguardando_verificacao: "Aguardando verificação",
  encerrada: "Encerrada",
  cancelada: "Cancelada",
} as const;

export type NcStatusFluxo = keyof typeof NC_STATUS;

/** Statuses in which the deadline still runs (used for "vencida" and reminders). */
export const NC_STATUS_EM_PRAZO: readonly NcStatusFluxo[] = ["aberta", "em_tratamento"];
export const NC_STATUS_FINAIS: readonly NcStatusFluxo[] = ["encerrada", "cancelada"];

/** Older records used "resolvida"; they count as closed. */
export function normalizeNcStatus(status: string | null | undefined): NcStatusFluxo {
  if (status === "resolvida") return "encerrada";
  return status && status in NC_STATUS ? (status as NcStatusFluxo) : "aberta";
}

export const NC_CAUSA_METODOS = {
  cinco_porques: "5 Porquês",
  ishikawa: "Diagrama de Ishikawa (6M)",
  outro: "Outro método",
} as const;

export type NcCausaMetodo = keyof typeof NC_CAUSA_METODOS;

export const NC_VERIFICACAO_RESULTADOS = {
  eficaz: "Eficaz — encerrar a NC",
  ineficaz: "Ineficaz — reabrir o tratamento",
} as const;

export type NcVerificacaoResultado = keyof typeof NC_VERIFICACAO_RESULTADOS;

export const NC_EVENTOS = {
  criada: "NC registrada",
  plano_definido: "Análise de causa e plano de ação definidos",
  plano_atualizado: "Plano de ação atualizado",
  acao_concluida: "Ação concluída",
  enviada_verificacao: "Enviada para verificação de eficácia",
  encerrada: "NC encerrada (ação eficaz)",
  reaberta: "Tratamento reaberto (ação ineficaz)",
  prazo_prorrogado: "Prazo prorrogado",
  cancelada: "NC cancelada",
  lembrete_enviado: "Lembrete de prazo enviado",
} as const;

export type NcEventoTipo = keyof typeof NC_EVENTOS;

export const NC_ACOES_MAX = 20;
export const NC_PORQUES_MAX = 5;

export interface NcAcaoInput {
  id?: number; // existing pending action being edited
  oQue: string; // What
  porQue: string; // Why
  onde?: string | null; // Where
  quem: string; // Who
  quando: string; // When (YYYY-MM-DD)
  como: string; // How
  quanto?: string | null; // How much (optional)
}

export interface NcAcao extends NcAcaoInput {
  id: number;
  status: "pendente" | "concluida";
  concluidaEm: string | null;
  evidencia: string | null;
  evidenciaFotoUrl: string | null;
}

export interface PlanoAcaoInput {
  acaoImediata?: string | null;
  causaMetodo: NcCausaMetodo;
  porques?: string[];
  causaRaiz: string;
  acoes: NcAcaoInput[];
}

export type NcAcaoErrors = Partial<Record<keyof NcAcaoInput, string>>;

export interface PlanoAcaoErrors {
  causaMetodo?: string;
  porques?: string;
  causaRaiz?: string;
  acoes?: string;
  acoesItens?: Record<number, NcAcaoErrors>;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const filled = (v: unknown, min = 1) => typeof v === "string" && v.trim().length >= min;

export function validateAcao5w2h(acao: Partial<NcAcaoInput>, dataOcorrencia: string): NcAcaoErrors {
  const errors: NcAcaoErrors = {};
  if (!filled(acao.oQue, 5)) errors.oQue = "Descreva o que será feito.";
  if (!filled(acao.porQue, 5)) errors.porQue = "Informe por que a ação é necessária.";
  if (!filled(acao.quem, 3)) errors.quem = "Informe o responsável.";
  if (!DATE_RE.test(acao.quando ?? "")) errors.quando = "Informe o prazo da ação.";
  else if (acao.quando! < dataOcorrencia) errors.quando = "O prazo não pode ser anterior à ocorrência.";
  if (!filled(acao.como, 5)) errors.como = "Explique como a ação será executada.";
  if ((acao.quanto ?? "").length > 100) errors.quanto = "Até 100 caracteres.";
  return errors;
}

export function validatePlanoAcao(input: Partial<PlanoAcaoInput>, dataOcorrencia: string): { isValid: boolean; errors: PlanoAcaoErrors } {
  const errors: PlanoAcaoErrors = {};
  if (!input.causaMetodo || !(input.causaMetodo in NC_CAUSA_METODOS)) errors.causaMetodo = "Selecione o método de análise de causa.";
  const porques = (input.porques ?? []).filter((p) => p?.trim());
  if (input.causaMetodo === "cinco_porques" && porques.length < 2) errors.porques = "Registre pelo menos dois porquês.";
  if ((input.porques ?? []).length > NC_PORQUES_MAX) errors.porques = `No máximo ${NC_PORQUES_MAX} porquês.`;
  if (!filled(input.causaRaiz, 10)) errors.causaRaiz = "Descreva a causa raiz (mínimo de 10 caracteres).";

  const acoes = input.acoes ?? [];
  if (acoes.length === 0) errors.acoes = "Inclua pelo menos uma ação no plano.";
  else if (acoes.length > NC_ACOES_MAX) errors.acoes = `No máximo ${NC_ACOES_MAX} ações.`;
  acoes.forEach((acao, i) => {
    const e = validateAcao5w2h(acao, dataOcorrencia);
    if (Object.keys(e).length) (errors.acoesItens ??= {})[i] = e;
  });
  if (errors.acoesItens && !errors.acoes) errors.acoes = "Corrija os campos destacados nas ações.";
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateConclusaoAcao(input: { evidencia?: string | null; evidenciaFotoUrl?: string | null }): string | null {
  if (!filled(input.evidencia, 10)) return "Descreva a evidência da execução (mínimo de 10 caracteres).";
  if (input.evidenciaFotoUrl) {
    const foto = parseImageDataUrl(input.evidenciaFotoUrl);
    if (!foto) return "A foto deve ser uma imagem JPEG, PNG ou WebP.";
    if (foto.bytes > NC_FOTO_MAX_BYTES) return "A foto excede o tamanho máximo de 5 MB.";
  }
  return null;
}

export function validateVerificacao(input: { resultado?: string; observacao?: string | null }): string | null {
  if (!input.resultado || !(input.resultado in NC_VERIFICACAO_RESULTADOS)) return "Selecione o resultado da verificação.";
  if (!filled(input.observacao, 10)) return "Registre o que foi verificado (mínimo de 10 caracteres).";
  return null;
}

export function validateProrrogacao(
  input: { novoPrazo?: string; justificativa?: string | null },
  prazoAtual: string,
  hoje: string
): string | null {
  if (!DATE_RE.test(input.novoPrazo ?? "")) return "Informe o novo prazo.";
  if (input.novoPrazo! <= prazoAtual) return "O novo prazo deve ser posterior ao prazo atual.";
  if (input.novoPrazo! < hoje) return "O novo prazo não pode estar no passado.";
  if (!filled(input.justificativa, 10)) return "Justifique a prorrogação (mínimo de 10 caracteres).";
  return null;
}

export function validateCancelamento(motivo: string | null | undefined): string | null {
  return filled(motivo, 10) ? null : "Informe o motivo do cancelamento (mínimo de 10 caracteres).";
}

export type NcFluxoAcao = "definir_plano" | "concluir_acao" | "enviar_verificacao" | "verificar" | "prorrogar" | "cancelar";

export const NC_FLUXO_ACOES_ADMIN: readonly NcFluxoAcao[] = ["verificar", "prorrogar", "cancelar"];

/** Whether the action can be done now; `reason` explains why not. */
export function canPerformNcAction(
  acao: NcFluxoAcao,
  nc: { status: string; acoes?: Pick<NcAcao, "status">[] },
  isAdmin: boolean
): { allowed: boolean; reason?: string } {
  const status = normalizeNcStatus(nc.status);
  if (NC_FLUXO_ACOES_ADMIN.includes(acao) && !isAdmin) return { allowed: false, reason: "Somente o administrador (SMS) pode fazer isso." };
  if (NC_STATUS_FINAIS.includes(status)) return { allowed: false, reason: `A NC está ${NC_STATUS[status].toLowerCase()}.` };

  switch (acao) {
    case "definir_plano":
      return status === "aberta" || status === "em_tratamento"
        ? { allowed: true }
        : { allowed: false, reason: "O plano não pode ser alterado durante a verificação." };
    case "concluir_acao":
      return status === "em_tratamento" ? { allowed: true } : { allowed: false, reason: "Defina o plano de ação antes de concluir ações." };
    case "enviar_verificacao": {
      if (status !== "em_tratamento") return { allowed: false, reason: "A NC precisa estar em tratamento." };
      const acoes = nc.acoes ?? [];
      if (!acoes.length) return { allowed: false, reason: "O plano de ação não tem ações." };
      const pendentes = acoes.filter((a) => a.status !== "concluida").length;
      return pendentes ? { allowed: false, reason: `Ainda há ${pendentes} ação(ões) pendente(s).` } : { allowed: true };
    }
    case "verificar":
      return status === "aguardando_verificacao" ? { allowed: true } : { allowed: false, reason: "A NC não está aguardando verificação." };
    case "prorrogar":
    case "cancelar":
      return { allowed: true };
  }
}

export type NcSituacaoFluxo = NcStatusFluxo | "vencida";

export const NC_SITUACOES_FLUXO: Record<NcSituacaoFluxo, string> = {
  aberta: "Aberta",
  em_tratamento: "Em tratamento",
  vencida: "Vencida",
  aguardando_verificacao: "Aguardando verificação",
  encerrada: "Encerrada",
  cancelada: "Cancelada",
};

/** Status shown to the user: an NC whose deadline is still running and has passed is "vencida". */
export function getNcSituacaoFluxo(nc: { status: string; prazo: string }, hoje: string): NcSituacaoFluxo {
  const status = normalizeNcStatus(nc.status);
  return NC_STATUS_EM_PRAZO.includes(status) && nc.prazo < hoje ? "vencida" : status;
}

export type NcLembrete = "prazo_proximo" | "vencida";
export const NC_LEMBRETE_DIAS_ANTES = 2;

/** Which reminder is due today (each one is sent once per deadline). */
export function ncLembreteDevido(
  nc: { status: string; prazo: string; lembretePrazoEm?: unknown; lembreteVencidaEm?: unknown },
  hoje: string
): NcLembrete | null {
  if (!NC_STATUS_EM_PRAZO.includes(normalizeNcStatus(nc.status))) return null;
  const dias = diasAtePrazo(nc.prazo, hoje);
  if (dias < 0) return nc.lembreteVencidaEm ? null : "vencida";
  if (dias <= NC_LEMBRETE_DIAS_ANTES) return nc.lembretePrazoEm ? null : "prazo_proximo";
  return null;
}

export interface NcIndicadores {
  total: number;
  porSituacao: Record<NcSituacaoFluxo, number>;
  encerradasNoPrazo: number | null; // % of closed NCs closed by the deadline
  tempoMedioEncerramentoDias: number | null;
}

export function calcularIndicadoresNc(
  ncs: { status: string; prazo: string; dataOcorrencia: string; encerradaEm?: string | null; resolvidaEm?: string | null }[],
  hoje: string
): NcIndicadores {
  const porSituacao = Object.fromEntries(Object.keys(NC_SITUACOES_FLUXO).map((k) => [k, 0])) as Record<NcSituacaoFluxo, number>;
  let encerradas = 0, noPrazo = 0, somaDias = 0;
  for (const nc of ncs) {
    porSituacao[getNcSituacaoFluxo(nc, hoje)]++;
    const fim = (nc.encerradaEm ?? nc.resolvidaEm)?.slice(0, 10);
    if (normalizeNcStatus(nc.status) === "encerrada" && fim) {
      encerradas++;
      if (fim <= nc.prazo) noPrazo++;
      somaDias += Math.max(0, diasAtePrazo(fim, nc.dataOcorrencia)); // days from occurrence to closing
    }
  }
  return {
    total: ncs.length,
    porSituacao,
    encerradasNoPrazo: encerradas ? Math.round((noPrazo / encerradas) * 100) : null,
    tempoMedioEncerramentoDias: encerradas ? Math.round((somaDias / encerradas) * 10) / 10 : null,
  };
}

/** Progress of the action plan, e.g. { concluidas: 2, total: 3 }. */
export function progressoPlano(acoes: Pick<NcAcao, "status">[]): { concluidas: number; total: number } {
  return { concluidas: acoes.filter((a) => a.status === "concluida").length, total: acoes.length };
}
