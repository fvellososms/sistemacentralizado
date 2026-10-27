import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateOperationalEvolution,
  getMondayOfWeek,
} from "./operational-evolution.ts";

describe("Operational Evolution Domain Rules", () => {
  it("returns empty array when there are no records", () => {
    assert.deepEqual(calculateOperationalEvolution([]), []);
  });

  it("finds Monday correctly for any given day", () => {
    // 2026-10-14 is Wednesday -> Monday is 2026-10-12
    const monday = getMondayOfWeek("2026-10-14");
    assert.equal(monday.toISOString().slice(0, 10), "2026-10-12");

    // 2026-10-18 is Sunday -> Monday is 2026-10-12
    const mondaySun = getMondayOfWeek("2026-10-18");
    assert.equal(mondaySun.toISOString().slice(0, 10), "2026-10-12");

    // 2026-10-12 is Monday -> Monday is 2026-10-12
    const mondayMon = getMondayOfWeek("2026-10-12");
    assert.equal(mondayMon.toISOString().slice(0, 10), "2026-10-12");
  });

  it("calculates weekly average correctly across days with records without counting missing days as zero", () => {
    const records = [
      // Week 1 (Monday 2026-10-05)
      { date: "2026-10-05", totalHeadcount: 10 },
      { date: "2026-10-06", totalHeadcount: 20 },
      // Week 2 (Monday 2026-10-12)
      { date: "2026-10-12", totalHeadcount: 15 },
      { date: "2026-10-13", totalHeadcount: 25 },
      { date: "2026-10-14", totalHeadcount: 20 },
    ];

    const result = calculateOperationalEvolution(records);
    assert.equal(result.length, 2);

    assert.equal(result[0].weekLabel, "Sem. 1");
    // (10 + 20) / 2 = 15
    assert.equal(result[0].averageHeadcount, 15);
    assert.equal(result[0].daysRecorded, 2);

    assert.equal(result[1].weekLabel, "Sem. 2");
    // (15 + 25 + 20) / 3 = 20
    assert.equal(result[1].averageHeadcount, 20);
    assert.equal(result[1].daysRecorded, 3);
  });

  it("deduplicates multiple records on the same day by averaging them before weekly aggregation", () => {
    const records = [
      { date: "2026-10-05", totalHeadcount: 10 },
      { date: "2026-10-05", totalHeadcount: 20 }, // same day duplicate -> average 15
      { date: "2026-10-06", totalHeadcount: 25 }, // day 2 -> 25
    ];

    const result = calculateOperationalEvolution(records);
    assert.equal(result.length, 1);
    // (15 + 25) / 2 = 20
    assert.equal(result[0].averageHeadcount, 20);
    assert.equal(result[0].daysRecorded, 2);
  });
});
