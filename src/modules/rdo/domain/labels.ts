/**
 * Display labels for RDO fields, shared by the screens and the generated PDF.
 */

import { isDayStopped, type ShiftConditions } from "./rules.ts";

export const WEATHER_LABELS: Record<string, string> = {
  sol: "Ensolarado",
  parcialmente_nublado: "Parcialmente nublado",
  nublado: "Nublado",
  chuva: "Chuva",
};

export const WORK_CONDITION_LABELS: Record<string, string> = {
  praticavel: "Praticável",
  impraticavel: "Impraticável",
};

export const RDO_ACTIVITY_STATUS_LABELS: Record<string, string> = {
  concluido: "Concluído",
  em_andamento: "Em andamento",
};

export const RDO_NC_SEVERITY_LABELS: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

export const RDO_NC_STATUS_LABELS: Record<string, string> = {
  resolvido: "Resolvido",
  pendente: "Pendente",
};

export type RdoSituation = "paralisado" | "com_ocorrencias" | "concluido";

export const RDO_SITUATION_LABELS: Record<RdoSituation, string> = {
  paralisado: "Paralisado",
  com_ocorrencias: "Com ocorrências",
  concluido: "Concluído",
};

/** Same precedence as the RDO badge: halted day first, then occurrences. */
export function getRdoSituation(
  rdo: ({ dayStatus?: string | null; workCondition?: string | null; hasOccurrences?: boolean | null } & ShiftConditions) | null | undefined
): RdoSituation {
  if (isDayStopped(rdo)) return "paralisado";
  return rdo?.hasOccurrences ? "com_ocorrencias" : "concluido";
}

/** Label lookup that falls back to the raw value (legacy records) or "—". */
export function labelOf(labels: Record<string, string>, value: string | null | undefined): string {
  if (!value) return "—";
  return labels[value] ?? value;
}
