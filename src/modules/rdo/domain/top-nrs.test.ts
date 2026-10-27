import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateTopNrs, normalizeNr } from "./top-nrs.ts";

describe("top-nrs domain calculations", () => {
  it("normalizes diverse NR inputs to canonical NR-XX format", () => {
    assert.equal(normalizeNr("NR 18"), "NR-18");
    assert.equal(normalizeNr("nr-35"), "NR-35");
    assert.equal(normalizeNr("NR-06 - EPI"), "NR-06");
    assert.equal(normalizeNr("NR12"), "NR-12");
  });

  it("returns empty array when records are empty or have invalid NRs", () => {
    assert.deepEqual(calculateTopNrs([]), []);
    assert.deepEqual(calculateTopNrs([{ nr: "" }, { nr: "   " }, { nr: "Outra" }]), []);
  });

  it("calculates top 3 NRs and breaks ties stably", () => {
    const records = [
      { id: 1, nr: "NR 18" },
      { id: 2, nr: "NR-18" },
      { id: 3, nr: "NR-35" },
      { id: 4, nr: "NR-35" },
      { id: 5, nr: "NR-06" },
      { id: 6, nr: "NR-12" },
      { id: 7, nr: "NR-18" },
      { id: 8, nr: "NR-10" },
    ];

    const result = calculateTopNrs(records);
    // NR-18: 3, NR-35: 2, NR-06: 1, NR-10: 1, NR-12: 1
    // Tie between NR-06, NR-10, NR-12 -> NR-06 comes first alphabetically
    assert.equal(result.length, 3);
    assert.deepEqual(result, [
      { rank: 1, nr: "NR-18", count: 3 },
      { rank: 2, nr: "NR-35", count: 2 },
      { rank: 3, nr: "NR-06", count: 1 },
    ]);
  });

  it("handles compound NRs without double-counting the same record", () => {
    const records = [
      { id: 1, nr: "NR-18, NR-35" },
      { id: 2, nr: "NR-18; NR-18" }, // duplicate in single record
      { id: 3, nr: "NR-35" },
    ];

    const result = calculateTopNrs(records);
    assert.deepEqual(result, [
      { rank: 1, nr: "NR-18", count: 2 },
      { rank: 2, nr: "NR-35", count: 2 },
    ]);
  });
});
