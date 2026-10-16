import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canTransitionAprStatus } from "./state-machine.ts";

describe("APR State Machine Rules", () => {
  it("allows transition from rascunho to aguardando_aprovacao", () => {
    const res = canTransitionAprStatus("rascunho", "aguardando_aprovacao");
    assert.equal(res.allowed, true);
  });

  it("allows transition from reprovada to rascunho for re-elaboration", () => {
    const res = canTransitionAprStatus("reprovada", "rascunho");
    assert.equal(res.allowed, true);
  });

  it("allows approver to approve from aguardando_aprovacao to aprovada", () => {
    const res = canTransitionAprStatus("aguardando_aprovacao", "aprovada");
    assert.equal(res.allowed, true);
  });

  it("blocks reproval if motivo is not provided", () => {
    const res = canTransitionAprStatus("aguardando_aprovacao", "reprovada", { hasMotivo: false });
    assert.equal(res.allowed, false);
    assert.ok(res.reason?.includes("motivo"));
  });

  it("allows reproval if motivo is provided", () => {
    const res = canTransitionAprStatus("aguardando_aprovacao", "reprovada", { hasMotivo: true });
    assert.equal(res.allowed, true);
  });

  it("blocks ANY transition from aprovada (immutable snapshot)", () => {
    assert.equal(canTransitionAprStatus("aprovada", "rascunho").allowed, false);
    assert.equal(canTransitionAprStatus("aprovada", "reprovada").allowed, false);
    assert.equal(canTransitionAprStatus("aprovada", "aguardando_aprovacao").allowed, false);
  });

  it("blocks illegal direct transitions", () => {
    assert.equal(canTransitionAprStatus("rascunho", "aprovada").allowed, false);
  });
});

