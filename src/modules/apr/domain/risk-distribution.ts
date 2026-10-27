/**
 * Pure domain rules for calculating the 3-bar Risk Distribution chart.
 * Follows exact specifications:
 * - Exactly 3 categories: "Baixo", "Médio", "Alto"
 * - Does NOT include "Crítico"
 * - Mandatory hex colors:
 *   - Baixo: #57A98B
 *   - Médio: #D6AE58
 *   - Alto: #DF7953
 * - Width % = (count / max(counts)) * 100 (0% if max is 0)
 */

export interface RiskInput {
  nivel?: string | null;
  probabilidade?: string | null;
  severidade?: string | null;
}

export interface RiskCategoryDistribution {
  category: "Baixo" | "Médio" | "Alto";
  count: number;
  percentage: number;
  color: string;
}

export const RISK_COLORS = {
  Baixo: "#57A98B",
  Médio: "#D6AE58",
  Alto: "#DF7953",
} as const;

/**
 * Normalizes any risk level representation into "Baixo" | "Médio" | "Alto" | null.
 * "moderado" and "medio" map to "Médio".
 * "critico" returns null (ignored per spec).
 */
export function normalizeRiskCategory(
  nivelOrProb: string | null | undefined,
  sev?: string | null
): "Baixo" | "Médio" | "Alto" | null {
  if (!nivelOrProb) return null;

  const clean = nivelOrProb.trim().toLowerCase();

  // If prob and sev are provided directly
  if (sev) {
    const p = clean;
    const s = sev.trim().toLowerCase();
    const pVal = p === "alta" ? 3 : p === "media" ? 2 : 1;
    const sVal = s === "grave" ? 3 : s === "moderada" ? 2 : 1;
    const prod = pVal * sVal;
    if (prod <= 2) return "Baixo";
    if (prod <= 4) return "Médio";
    if (prod <= 6) return "Alto";
    return null; // critico ignored
  }

  if (clean === "baixo") return "Baixo";
  if (clean === "moderado" || clean === "medio" || clean === "médio") return "Médio";
  if (clean === "alto") return "Alto";
  // critico or unknown ignored
  return null;
}

/**
 * Calculates distribution of risks for the 3 categories.
 */
export function calculateRiskDistribution(
  risks: RiskInput[]
): RiskCategoryDistribution[] {
  let baixoCount = 0;
  let medioCount = 0;
  let altoCount = 0;

  for (const r of risks || []) {
    const category = normalizeRiskCategory(
      r.nivel || r.probabilidade,
      r.nivel ? undefined : r.severidade
    );

    if (category === "Baixo") baixoCount++;
    else if (category === "Médio") medioCount++;
    else if (category === "Alto") altoCount++;
  }

  const maxCount = Math.max(baixoCount, medioCount, altoCount);

  const calcPercentage = (count: number) => {
    if (maxCount === 0) return 0;
    return Math.round((count / maxCount) * 10000) / 100;
  };

  return [
    {
      category: "Baixo",
      count: baixoCount,
      percentage: calcPercentage(baixoCount),
      color: RISK_COLORS.Baixo,
    },
    {
      category: "Médio",
      count: medioCount,
      percentage: calcPercentage(medioCount),
      color: RISK_COLORS.Médio,
    },
    {
      category: "Alto",
      count: altoCount,
      percentage: calcPercentage(altoCount),
      color: RISK_COLORS.Alto,
    },
  ];
}

