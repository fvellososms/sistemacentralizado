import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateRsoSummary } from "./calculations.ts";

describe("RSO Domain Calculations", () => {
  it("calculates summary correctly for empty RDO list", () => {
    const summary = calculateRsoSummary([], 0);
    assert.deepEqual(summary, {
      totalRdos: 0,
      totalDaysWorked: 0,
      totalDaysHalted: 0,
      totalHh: "0.0",
      totalOccurrences: 0,
      avgHeadcount: 0,
    });
  });

  it("calculates working days, halted days, total HH and average headcount", () => {
    const rdos = [
      { dayStatus: "trabalhando", totalHh: "80.0", totalHeadcount: 10 },
      { dayStatus: "trabalhando", totalHh: "88.0", totalHeadcount: 10 },
      { dayStatus: "paralisado_chuva", totalHh: "40.0", totalHeadcount: 10 },
      { dayStatus: "trabalhando", totalHh: "96.5", totalHeadcount: 12 },
      { dayStatus: "nao_trabalhando", totalHh: "0.0", totalHeadcount: 0 },
    ];

    const summary = calculateRsoSummary(rdos, 3);

    assert.equal(summary.totalRdos, 5);
    assert.equal(summary.totalDaysWorked, 3);
    assert.equal(summary.totalDaysHalted, 1);
    assert.equal(summary.totalHh, "304.5");
    assert.equal(summary.totalOccurrences, 3);
    // (10 + 10 + 10 + 12 + 0) / 5 = 42 / 5 = 8.4 => round(8.4) = 8
    assert.equal(summary.avgHeadcount, 8);
  });
});

