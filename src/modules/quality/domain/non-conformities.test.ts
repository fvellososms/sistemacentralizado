import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { diasAtePrazo, getNcSituacao, validateNaoConformidade, type NaoConformidadeInput } from "./non-conformities.ts";

const HOJE = "2026-10-26";

const valida: NaoConformidadeInput = {
  projectId: 1,
  tipo: "sst",
  grau: "grave",
  dataOcorrencia: "2026-10-25",
  localObra: "Bloco A · 5º pavimento",
  requisitoViolado: "NR-18, item 18.13.1",
  titulo: "Abertura de poço sem guarda-corpo",
  descricao: "Poço de ventilação aberto sem proteção coletiva, observado às 9h.",
  responsavelNome: "Eng. Roberto Albuquerque",
  responsavelEmail: "roberto@exemplo.com.br",
  prazo: "2026-10-28",
};

describe("Quality Non-Conformity Rules", () => {
  it("accepts a complete NC", () => {
    const res = validateNaoConformidade(valida, HOJE);
    assert.equal(res.isValid, true);
    assert.deepEqual(res.errors, {});
  });

  it("requires every field", () => {
    const res = validateNaoConformidade({}, HOJE);
    assert.equal(res.isValid, false);
    for (const campo of [
      "projectId", "tipo", "grau", "dataOcorrencia", "localObra", "requisitoViolado",
      "titulo", "descricao", "responsavelNome", "responsavelEmail", "prazo",
    ]) {
      assert.ok(campo in res.errors, `missing error for ${campo}`);
    }
  });

  it("rejects blank text, unknown type and grade", () => {
    const res = validateNaoConformidade(
      { ...valida, titulo: "   ", tipo: "outro" as never, grau: "critica" as never },
      HOJE
    );
    assert.ok(res.errors.titulo);
    assert.ok(res.errors.tipo);
    assert.ok(res.errors.grau);
  });

  it("rejects an invalid e-mail", () => {
    const res = validateNaoConformidade({ ...valida, responsavelEmail: "roberto@exemplo" }, HOJE);
    assert.equal(res.errors.responsavelEmail, "E-mail inválido.");
  });

  it("rejects a future occurrence and a deadline before the occurrence", () => {
    assert.ok(validateNaoConformidade({ ...valida, dataOcorrencia: "2026-10-27" }, HOJE).errors.dataOcorrencia);
    assert.ok(validateNaoConformidade({ ...valida, prazo: "2026-10-24" }, HOJE).errors.prazo);
    assert.equal(validateNaoConformidade({ ...valida, prazo: valida.dataOcorrencia }, HOJE).isValid, true);
  });

  it("computes the situation from status and deadline", () => {
    assert.equal(getNcSituacao({ status: "aberta", prazo: "2026-10-26" }, HOJE), "aberta");
    assert.equal(getNcSituacao({ status: "aberta", prazo: "2026-10-25" }, HOJE), "vencida");
    assert.equal(getNcSituacao({ status: "resolvida", prazo: "2026-10-01" }, HOJE), "resolvida");
  });

  it("counts days until the deadline", () => {
    assert.equal(diasAtePrazo("2026-10-28", HOJE), 2);
    assert.equal(diasAtePrazo("2026-10-26", HOJE), 0);
    assert.equal(diasAtePrazo("2026-10-20", HOJE), -6);
  });
});
