import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { adicionarAtividadesSemDuplicar, isAtividadeDuplicada } from "./activities.ts";

describe("APR Activities Rules", () => {
  const existentes = [
    { atividadeOrigemId: 13, nome: "Solda elétrica e oxicorte" },
    { atividadeOrigemId: null, nome: "Limpeza do canteiro" },
  ];

  it("detects the same knowledge-base activity", () => {
    assert.equal(isAtividadeDuplicada(existentes, { atividadeOrigemId: 13, nome: "Outro nome" }), true);
  });

  it("detects the same name ignoring case, accents and spacing", () => {
    assert.equal(isAtividadeDuplicada(existentes, { atividadeOrigemId: null, nome: "  solda  eletrica e OXICORTE " }), true);
    assert.equal(isAtividadeDuplicada(existentes, { atividadeOrigemId: 99, nome: "Limpeza do Canteiro" }), true);
  });

  it("accepts a different activity", () => {
    assert.equal(isAtividadeDuplicada(existentes, { atividadeOrigemId: 7, nome: "Escavação manual de valas" }), false);
    assert.equal(isAtividadeDuplicada([], { atividadeOrigemId: null, nome: "Qualquer" }), false);
  });

  it("appends only non-duplicated activities, also among the new ones", () => {
    const res = adicionarAtividadesSemDuplicar(existentes, [
      { atividadeOrigemId: 13, nome: "Solda elétrica e oxicorte" },
      { atividadeOrigemId: 7, nome: "Escavação manual de valas" },
      { atividadeOrigemId: 7, nome: "Escavação manual de valas" },
    ]);
    assert.deepEqual(
      res.map((a) => a.nome),
      ["Solda elétrica e oxicorte", "Limpeza do canteiro", "Escavação manual de valas"]
    );
  });
});
