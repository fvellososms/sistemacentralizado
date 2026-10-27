import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateTotalWorkers,
  calculateStandardHours,
  calculateTotalOvertime,
  calculateTotalHh,
  calculateStandardHoursByShift,
} from "./calculations.ts";

describe("RDO Domain Calculations", () => {
  it("calculates total headcount correctly (own + contractors)", () => {
    const total = calculateTotalWorkers(5, [
      { workerCount: 3 },
      { workerCount: "4" },
    ]);
    assert.equal(total, 12);
  });

  it("handles null and undefined safely in calculateTotalWorkers", () => {
    assert.equal(calculateTotalWorkers(undefined, []), 0);
    assert.equal(calculateTotalWorkers(null, undefined), 0);
  });

  it("returns correct standard hours per day status", () => {
    assert.equal(calculateStandardHours("trabalhando"), 8);
    assert.equal(calculateStandardHours("paralisado_chuva"), 4);
    assert.equal(calculateStandardHours("nao_trabalhando"), 0);
  });

  it("sums overtime only for activities with hasOvertime true", () => {
    const overtime = calculateTotalOvertime([
      { hasOvertime: true, overtimeHours: 2.5 },
      { hasOvertime: false, overtimeHours: 5 },
      { hasOvertime: true, overtimeHours: "1.5" },
    ]);
    assert.equal(overtime, 4.0);
  });

  it("calculates normal working day total HH without overtime", () => {
    const hh = calculateTotalHh({
      dayStatus: "trabalhando",
      ownTeamCount: 10,
      contractors: [],
      activities: [],
    });
    assert.equal(hh, "80.0");
  });

  it("calculates rain halted day total HH (4 standard hours)", () => {
    const hh = calculateTotalHh({
      dayStatus: "paralisado_chuva",
      ownTeamCount: 10,
      contractors: [],
      activities: [],
    });
    assert.equal(hh, "40.0");
  });

  it("calculates non working day total HH (0 standard hours)", () => {
    const hh = calculateTotalHh({
      dayStatus: "nao_trabalhando",
      ownTeamCount: 10,
      contractors: [],
      activities: [],
    });
    assert.equal(hh, "0.0");
  });

  it("includes overtime in total HH when workers exist", () => {
    const hh = calculateTotalHh({
      dayStatus: "trabalhando",
      ownTeamCount: 2,
      contractors: [{ workerCount: 2 }], // 4 total workers * 8 = 32
      activities: [
        { hasOvertime: true, overtimeHours: 2 },
        { hasOvertime: true, overtimeHours: 1.5 },
      ], // + 3.5 = 35.5
    });
    assert.equal(hh, "35.5");
  });

  it("does not add overtime if total workers is 0", () => {
    const hh = calculateTotalHh({
      dayStatus: "trabalhando",
      ownTeamCount: 0,
      contractors: [],
      activities: [{ hasOvertime: true, overtimeHours: 10 }],
    });
    assert.equal(hh, "0.0");
  });

  it("computes standard hours by impracticable shifts", () => {
    assert.equal(calculateStandardHoursByShift({ workConditionMorning: "praticavel", workConditionAfternoon: "praticavel" }), 8);
    assert.equal(calculateStandardHoursByShift({ workConditionMorning: "impraticavel", workConditionAfternoon: "praticavel" }), 4);
    assert.equal(calculateStandardHoursByShift({ workConditionMorning: "praticavel", workConditionAfternoon: "impraticavel" }), 4);
    assert.equal(calculateStandardHoursByShift({ workConditionMorning: "impraticavel", workConditionAfternoon: "impraticavel" }), 0);
  });

  it("uses shift conditions over day status for total HH when shifts are given", () => {
    const halfDay = calculateTotalHh({
      dayStatus: "paralisado_chuva",
      workConditionMorning: "praticavel",
      workConditionAfternoon: "impraticavel",
      ownTeamCount: 10,
    });
    assert.equal(halfDay, "40.0");
    const fullDay = calculateTotalHh({
      dayStatus: "paralisado_chuva",
      workConditionMorning: "impraticavel",
      workConditionAfternoon: "impraticavel",
      ownTeamCount: 10,
      activities: [{ hasOvertime: true, overtimeHours: 2 }],
    });
    assert.equal(fullDay, "2.0");
  });
});
