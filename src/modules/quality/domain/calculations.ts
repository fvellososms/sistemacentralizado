/**
 * Calculates Quality Score for the Dashboard (RN03):
 * Score = max(88, 100 - 2.5 * occurrencesCount)
 */
export function calculateQualityScore(occurrencesCount = 0): number {
  const safeCount = Math.max(0, occurrencesCount);
  const score = 100 - 2.5 * safeCount;
  return Math.max(88, Math.round(score));
}

