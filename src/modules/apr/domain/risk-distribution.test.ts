import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateRiskDistribution,
  normalizeRiskCategory,
  RISK_COLORS,
} from "./risk-distribution.ts";

describe("risk-distribution domain calculations", () => {
  it("normalizes levels correctly, ignoring critico", () => {
    assert.equal(normalizeRiskCategory("baixo"), "Baixo");
    assert.equal(normalizeRiskCategory("moderado"), "Médio");
    assert.equal(normalizeRiskCategory("medio"), "Médio");
    assert.equal(normalizeRiskCategory("médio"), "Médio");
    assert.equal(normalizeRiskCategory("alto"), "Alto");
    assert.equal(normalizeRiskCategory("critico"), null);
    assert.equal(normalizeRiskCategory("desconhecido"), null);
  });

  it("calculates distribution proportions correctly based on max category count", () => {
    const risks = [
      ...Array(16).fill({ nivel: "baixo" }),
      ...Array(9).fill({ nivel: "moderado" }),
      ...Array(4).fill({ nivel: "alto" }),
      ...Array(5).fill({ nivel: "critico" }), // must be excluded
    ];

    const result = calculateRiskDistribution(risks);

    assert.equal(result.length, 3);
    assert.deepEqual(result, [
      {
        category: "Baixo",
        count: 16,
        percentage: 100,
        color: RISK_COLORS.Baixo,
      },
      {
        category: "Médio",
        count: 9,
        percentage: 56.25,
        color: RISK_COLORS.Médio,
      },
      {
        category: "Alto",
        count: 4,
        percentage: 25,
        color: RISK_COLORS.Alto,
      },
    ]);
  });

  it("handles empty lists with 0% across all 3 categories", () => {
    const result = calculateRiskDistribution([]);
    assert.deepEqual(result, [
      { category: "Baixo", count: 0, percentage: 0, color: "#57A98B" },
      { category: "Médio", count: 0, percentage: 0, color: "#D6AE58" },
      { category: "Alto", count: 0, percentage: 0, color: "#DF7953" },
    ]);
  });
});
