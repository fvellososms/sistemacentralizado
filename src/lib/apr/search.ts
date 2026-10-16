import type { Relevancia } from "./types";

// ---------------------------------------------------------------------------
// Normalização de texto
// ---------------------------------------------------------------------------
const STOPWORDS = new Set([
  "a", "o", "as", "os", "de", "da", "do", "das", "dos", "em", "na", "no", "nas", "nos",
  "um", "uma", "uns", "umas", "e", "ou", "com", "sem", "para", "pra", "por", "ao", "aos",
  "que", "se", "ser", "sera", "vai", "vamos", "ir", "fazer", "executar", "execucao",
  "realizar", "realizacao", "servico", "servicos", "atividade", "atividades", "obra",
  "local", "area", "hoje", "amanha", "equipe", "pessoal", "trabalho", "trabalhos",
  "iremos", "faremos", "sobre", "ate", "apos", "depois", "antes", "durante", "entre",
  "junto", "tambem", "mesmo", "esta", "este", "isso", "aqui", "ali", "la", "onde",
]);

export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Radicalização leve (plural e sufixos comuns do português). */
export function radical(palavra: string): string {
  let p = palavra;
  if (p.length <= 3) return p;
  if (p.endsWith("coes")) return p.slice(0, -4) + "ca";
  if (p.endsWith("cao")) return p.slice(0, -3) + "ca";
  if (p.endsWith("oes")) return p.slice(0, -3) + "ao";
  if (p.endsWith("ais") || p.endsWith("eis") || p.endsWith("ois")) return p.slice(0, -2) + "l";
  if (p.endsWith("res") || p.endsWith("zes") || p.endsWith("ses")) p = p.slice(0, -2);
  else if (p.endsWith("s")) p = p.slice(0, -1);
  if (p.endsWith("mento")) p = p.slice(0, -5);
  else if (p.endsWith("agem")) p = p.slice(0, -4);
  else if (p.endsWith("ando") || p.endsWith("endo") || p.endsWith("indo")) p = p.slice(0, -4) + "a";
  return p;
}

export function tokens(texto: string): string[] {
  return normalizar(texto)
    .split(" ")
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map(radical);
}

// ---------------------------------------------------------------------------
// Similaridade por trigramas (equivalente ao pg_trgm, em memória)
// ---------------------------------------------------------------------------
function trigramas(s: string): Set<string> {
  const padded = `  ${s} `;
  const out = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++) out.add(padded.slice(i, i + 3));
  return out;
}

export function similaridadeTrigrama(a: string, b: string): number {
  const ta = trigramas(a);
  const tb = trigramas(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / (ta.size + tb.size - inter);
}

// ---------------------------------------------------------------------------
// Decomposição heurística da descrição em trechos (atividades compostas)
// ---------------------------------------------------------------------------
export function decompor(texto: string): string[] {
  const partes = texto
    .split(/[\n;.,]|\s+e\s+depois\s+|\s+em\s+seguida\s+|\s+depois\s+|\s+alem\s+de\s+|\s+além\s+de\s+|\s+e\s+tambem\s+|\s+e\s+também\s+|\s+e\s+/i)
    .map((p) => p.trim())
    .filter((p) => tokens(p).length > 0);
  return partes.length > 0 ? partes : [texto];
}

// ---------------------------------------------------------------------------
// Pontuação
// ---------------------------------------------------------------------------
export interface AtividadeIndexada {
  id: number;
  nome: string;
  categoria: string | null;
  descricao: string | null;
  termos: string[];
  qtdRiscos: number;
}

export interface ResultadoBusca {
  id: number;
  score: number;
  termosCorrespondentes: string[];
}

export const LIMIAR_SATISFATORIA = 0.32;
export const LIMIAR_EXIBICAO = 0.14;

export function relevanciaDe(score: number): Relevancia {
  if (score >= 0.6) return "alta";
  if (score >= LIMIAR_SATISFATORIA) return "possivel";
  return "baixa";
}

function pontuarTermo(termo: string, textoNorm: string, textoTokens: Set<string>): number {
  const termoNorm = normalizar(termo);
  if (!termoNorm) return 0;
  // Correspondência de frase completa
  if (termoNorm.length >= 4 && textoNorm.includes(termoNorm)) return 1;

  const termoTokens = tokens(termo);
  if (termoTokens.length === 0) return 0;

  // Sobreposição de tokens radicalizados
  let acertos = 0;
  let parcial = 0;
  for (const tt of termoTokens) {
    if (textoTokens.has(tt)) {
      acertos++;
      continue;
    }
    // aproximação por trigramas entre tokens (erros de digitação, variações)
    let melhor = 0;
    for (const xt of textoTokens) {
      if (Math.abs(xt.length - tt.length) > 3) continue;
      const s = similaridadeTrigrama(tt, xt);
      if (s > melhor) melhor = s;
    }
    if (melhor >= 0.5) parcial += melhor;
  }
  const cobertura = (acertos + parcial * 0.8) / termoTokens.length;
  // Termos de uma única palavra valem um pouco menos que expressões compostas
  const peso = termoTokens.length === 1 ? 0.75 : 0.95;
  return cobertura * peso;
}

export function buscarAtividades(texto: string, indice: AtividadeIndexada[]): ResultadoBusca[] {
  const textoNorm = normalizar(texto);
  const textoTokens = new Set(tokens(texto));
  if (textoTokens.size === 0) return [];

  const resultados: ResultadoBusca[] = [];
  for (const a of indice) {
    const candidatos = [a.nome, ...a.termos];
    let melhor = 0;
    const corresp: string[] = [];
    for (const termo of candidatos) {
      const s = pontuarTermo(termo, textoNorm, textoTokens);
      if (s >= 0.4) corresp.push(termo);
      if (s > melhor) melhor = s;
    }
    // bônus por múltiplos termos correspondentes (evidência acumulada)
    const bonus = Math.min(0.15, Math.max(0, corresp.length - 1) * 0.05);
    const score = Math.min(1, melhor + bonus);
    if (score >= LIMIAR_EXIBICAO) {
      resultados.push({ id: a.id, score, termosCorrespondentes: corresp.slice(0, 3) });
    }
  }
  return resultados.sort((x, y) => y.score - x.score);
}
