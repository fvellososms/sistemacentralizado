import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateQualityScore } from "./calculations.ts";

describe("Quality Domain Rules (RN03)", () => {
  it("returns 100% when there are 0 occurrences", () => {
    assert.equal(calculateQualityScore(0), 100);
  });

  it("deducts 2.5% for each occurrence", () => {
    assert.equal(calculateQualityScore(2), 95);
    assert.equal(calculateQualityScore(4), 90);
  });

  it("never falls below 88% minimum floor", () => {
    assert.equal(calculateQualityScore(10), 88);
    assert.equal(calculateQualityScore(50), 88);
  });

  it("handles negative numbers safely by treating them as 0", () => {
    assert.equal(calculateQualityScore(-5), 100);
  });
});

