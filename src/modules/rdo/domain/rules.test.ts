import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeDayOfWeek, validateRdoCreation } from "./rules.ts";

describe("RDO Domain Rules", () => {
  it("computes day of week accurately without timezone shift", () => {
    // 2026-10-16 is Friday ("sex")
    assert.equal(computeDayOfWeek("2026-10-16"), "sex");
    // 2026-10-17 is Saturday ("sáb")
    assert.equal(computeDayOfWeek("2026-10-17"), "sáb");
    // 2026-10-18 is Sunday ("dom")
    assert.equal(computeDayOfWeek("2026-10-18"), "dom");
    // 2026-10-19 is Monday ("seg")
    assert.equal(computeDayOfWeek("2026-10-19"), "seg");
  });

  it("fails validation if projectId is missing or invalid", () => {
    const res = validateRdoCreation({
      date: "2026-10-16",
      activities: [{ description: "Alvenaria" }],
    });
    assert.equal(res.isValid, false);
    assert.ok(res.errors.some((e) => e.includes("projectId")));
  });

  it("fails validation if date is empty", () => {
    const res = validateRdoCreation({
      projectId: 1,
      date: "",
      activities: [{ description: "Alvenaria" }],
    });
    assert.equal(res.isValid, false);
    assert.ok(res.errors.some((e) => e.includes("Data")));
  });

  it("fails validation if there are no activities with descriptions", () => {
    const res = validateRdoCreation({
      projectId: 1,
      date: "2026-10-16",
      activities: [{ description: "   " }],
    });
    assert.equal(res.isValid, false);
    assert.ok(res.errors.some((e) => e.includes("atividade")));
  });

  it("succeeds validation when all mandatory fields are provided", () => {
    const res = validateRdoCreation({
      projectId: 1,
      date: "2026-10-16",
      activities: [{ description: "Armação de vigas e pilares" }],
    });
    assert.equal(res.isValid, true);
    assert.equal(res.errors.length, 0);
  });
});
