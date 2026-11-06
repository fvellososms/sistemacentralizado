import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { WEATHER_LABELS, getRdoSituation, labelOf } from "./labels.ts";

describe("RDO labels", () => {
  it("derives the situation with halted days first", () => {
    assert.equal(getRdoSituation({ workConditionMorning: "impraticavel", hasOccurrences: true }), "paralisado");
    assert.equal(getRdoSituation({ dayStatus: "paralisado_chuva" }), "paralisado");
    assert.equal(getRdoSituation({ hasOccurrences: true }), "com_ocorrencias");
    assert.equal(getRdoSituation({}), "concluido");
    assert.equal(getRdoSituation(null), "concluido");
  });

  it("falls back to the raw value or a dash", () => {
    assert.equal(labelOf(WEATHER_LABELS, "chuva"), "Chuva");
    assert.equal(labelOf(WEATHER_LABELS, "granizo"), "granizo");
    assert.equal(labelOf(WEATHER_LABELS, null), "—");
  });
});
