import type { Probabilidade, Severidade } from "./types";

export type NivelRisco = "baixo" | "moderado" | "alto" | "critico";

const P: Record<Probabilidade, number> = { baixa: 1, media: 2, alta: 3 };
const S: Record<Severidade, number> = { leve: 1, moderada: 2, grave: 3 };

/** Matriz 3x3: produto probabilidade x severidade. */
export function calcularNivel(prob: Probabilidade, sev: Severidade): NivelRisco {
  const v = P[prob] * S[sev];
  if (v <= 2) return "baixo";
  if (v <= 4) return "moderado";
  if (v <= 6) return "alto";
  return "critico";
}

export const NIVEL_LABEL: Record<NivelRisco, string> = {
  baixo: "Baixo",
  moderado: "Moderado",
  alto: "Alto",
  critico: "Crítico",
};

/** Símbolo textual para não depender somente de cor (acessibilidade). */
export const NIVEL_SIMBOLO: Record<NivelRisco, string> = {
  baixo: "I",
  moderado: "II",
  alto: "III",
  critico: "IV",
};

export function isProbabilidade(v: unknown): v is Probabilidade {
  return v === "baixa" || v === "media" || v === "alta";
}
export function isSeveridade(v: unknown): v is Severidade {
  return v === "leve" || v === "moderada" || v === "grave";
}
