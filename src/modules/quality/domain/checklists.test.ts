import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateChecklistCompliance,
  calculateOverdueInspections,
} from "./checklists.ts";

describe("checklists domain calculations", () => {
  it("calculates compliance percentage accurately excluding N/A and unanswered", () => {
    const items = [
      { id: 1, status: "conforme" },
      { id: 2, status: "conforme" },
      { id: 3, status: "conforme" },
      { id: 4, status: "nao_conforme" },
      { id: 5, status: "nao_se_aplica" }, // excluded
      { id: 6, status: "pendente" }, // excluded
    ];

    const result = calculateChecklistCompliance(items);
    // 3 conformes / 4 avaliados = 75%
    assert.deepEqual(result, {
      percentage: 75,
      conformCount: 3,
      nonConformCount: 1,
      evaluatedCount: 4,
    });
  });

  it("returns null percentage when no items have been evaluated", () => {
    assert.deepEqual(calculateChecklistCompliance([]), {
      percentage: null,
      conformCount: 0,
      nonConformCount: 0,
      evaluatedCount: 0,
    });

    assert.deepEqual(
      calculateChecklistCompliance([
        { id: 1, status: "nao_se_aplica" },
        { id: 2, status: "" },
      ]),
      {
        percentage: null,
        conformCount: 0,
        nonConformCount: 0,
        evaluatedCount: 0,
      }
    );
  });

  it("calculates overdue inspections based on deadline and completion status", () => {
    const ref = new Date("2026-10-15T12:00:00Z");
    const inspections = [
      {
        id: 1,
        dataLimite: "2026-10-10T00:00:00Z", // overdue
        status: "pendente",
      },
      {
        id: 2,
        dataLimite: "2026-10-12T00:00:00Z", // overdue
        concluidaEm: null,
      },
      {
        id: 3,
        dataLimite: "2026-10-11T00:00:00Z", // was overdue, but concluded
        status: "concluida",
      },
      {
        id: 4,
        dataLimite: "2026-10-20T00:00:00Z", // future
        status: "pendente",
      },
    ];

    const result = calculateOverdueInspections(inspections, ref);
    assert.equal(result.overdueCount, 2);
    assert.equal(result.totalPending, 3);
  });
});
