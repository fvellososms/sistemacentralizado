import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calcularNivel, NIVEL_SIMBOLO } from "./risk-matrix.ts";

describe("APR 3x3 Risk Matrix Rules (RN07)", () => {
  it("computes Nível I (Baixo) when product <= 2", () => {
    assert.equal(calcularNivel("baixa", "leve"), "baixo"); // 1 * 1 = 1
    assert.equal(calcularNivel("baixa", "moderada"), "baixo"); // 1 * 2 = 2
    assert.equal(calcularNivel("media", "leve"), "baixo"); // 2 * 1 = 2
    assert.equal(NIVEL_SIMBOLO["baixo"], "I");
  });

  it("computes Nível II (Moderado) when product is 3 or 4", () => {
    assert.equal(calcularNivel("baixa", "grave"), "moderado"); // 1 * 3 = 3
    assert.equal(calcularNivel("alta", "leve"), "moderado"); // 3 * 1 = 3
    assert.equal(calcularNivel("media", "moderada"), "moderado"); // 2 * 2 = 4
    assert.equal(NIVEL_SIMBOLO["moderado"], "II");
  });

  it("computes Nível III (Alto) when product is 5 or 6", () => {
    assert.equal(calcularNivel("media", "grave"), "alto"); // 2 * 3 = 6
    assert.equal(calcularNivel("alta", "moderada"), "alto"); // 3 * 2 = 6
    assert.equal(NIVEL_SIMBOLO["alto"], "III");
  });

  it("computes Nível IV (Crítico) when product is 9", () => {
    assert.equal(calcularNivel("alta", "grave"), "critico"); // 3 * 3 = 9
    assert.equal(NIVEL_SIMBOLO["critico"], "IV");
  });
});

