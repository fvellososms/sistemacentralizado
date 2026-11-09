import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CHECKLIST_ITENS_MAX,
  RESPOSTA_PADRAO,
  iconePublico,
  logoCandidatos,
  logoSlug,
  nomeDoModelo,
  parseChecklistCsv,
  validateInspecao,
  type InspecaoInput,
} from "./checklists.ts";

describe("Checklist templates (CSV)", () => {
  it("ignores the title line and keeps the questions in order", () => {
    const csv = "﻿cabo de Aço\r\nO cabo não apresenta corrosão\r\n\r\nTODOS EPIs?\r\n";
    assert.deepEqual(parseChecklistCsv(csv), [
      { pergunta: "O cabo não apresenta corrosão", icone: null },
      { pergunta: "TODOS EPIs?", icone: null },
    ]);
  });
  it("reads the optional icon column", () => {
    const csv = "Avaliação\tIcone\nUSO DO CAPACETE?\t01_capacete.svg\nSEM ÍCONE?\t\n";
    assert.deepEqual(parseChecklistCsv(csv), [
      { pergunta: "USO DO CAPACETE?", icone: "01_capacete.svg" },
      { pergunta: "SEM ÍCONE?", icone: null },
    ]);
  });
  it("tolerates leftover tabs and spreadsheet quotes", () => {
    assert.deepEqual(parseChecklistCsv('T\nCabos em boas condições?\t\t\t\t\n"Plug ""novo""?"\t'), [
      { pergunta: "Cabos em boas condições?", icone: null },
      { pergunta: 'Plug "novo"?', icone: null },
    ]);
  });
  it("keeps a quoted cell with line breaks as one question", () => {
    assert.deepEqual(parseChecklistCsv('T\n"Olhal sem trincas\nGirando livremente"\tx\nOutra?'), [
      { pergunta: "Olhal sem trincas Girando livremente", icone: null },
      { pergunta: "Outra?", icone: null },
    ]);
  });
  it("keeps quotes in the middle of a question", () => {
    assert.equal(parseChecklistCsv('T\nPROIBIDO realizar "rabicho" na extensão')[0].pergunta, 'PROIBIDO realizar "rabicho" na extensão');
  });
  it("never accepts a path as icon", () => {
    assert.equal(parseChecklistCsv("T\tIcone\nA?\t../../segredo.svg\n")[0].icone, null);
    assert.equal(iconePublico("01_capacete.svg"), "/checklist/icones/01_capacete.png");
  });
  it("names the template after the file", () => {
    assert.equal(nomeDoModelo("checklists/Checklist - Furadeira.csv"), "Checklist - Furadeira");
    assert.equal(nomeDoModelo("Checklist Munk.CSV"), "Checklist Munk");
  });
});

describe("Client logo", () => {
  it("turns the company name into the file name", () => {
    assert.equal(logoSlug("PETMAX"), "petmax");
    assert.equal(logoSlug("Hotel Marina"), "hotel-marina");
    assert.equal(logoSlug("Construção & Cia."), "construcao-cia");
  });
  it("tries the formats the PDF supports", () => {
    assert.deepEqual(logoCandidatos("PETMAX"), ["/logos-clientes/petmax.png", "/logos-clientes/petmax.jpg", "/logos-clientes/petmax.jpeg"]);
  });
  it("has no logo for a project without client company", () => {
    assert.deepEqual(logoCandidatos(null), []);
    assert.deepEqual(logoCandidatos("  "), []);
  });
});

describe("Inspection validation", () => {
  const valida: InspecaoInput = {
    clientId: "3f2b8c1e-7a41-4c2d-9f10-1a2b3c4d5e6f",
    modeloId: 1,
    modeloNome: "Checklist - Furadeira",
    projectId: 1,
    numero: "",
    revisao: "",
    contratada: "",
    subcontratada: "",
    local: "",
    grupo: "",
    frente: "",
    objeto: "",
    tag: "",
    periodicidade: "Rotineira",
    inspetor: "",
    dataInspecao: "2026-11-09",
    nomeTecnico: "",
    nomeOperador: "",
    assinaturaTecnico: null,
    assinaturaOperador: null,
    respostas: [{ pergunta: "Plug ok?", icone: null, resposta: RESPOSTA_PADRAO, comentario: "" }],
  };
  it("starts every answer as Conforme and allows blank document fields", () => {
    assert.equal(RESPOSTA_PADRAO, "Conforme");
    assert.equal(validateInspecao(valida), null);
  });
  it("needs a device id, project, date and valid answers", () => {
    assert.ok(validateInspecao({ ...valida, clientId: "1" }));
    assert.ok(validateInspecao({ ...valida, projectId: 0 }));
    assert.ok(validateInspecao({ ...valida, dataInspecao: "2026-02-31" }));
    assert.ok(validateInspecao({ ...valida, respostas: [] }));
    assert.ok(validateInspecao({ ...valida, respostas: [{ ...valida.respostas[0], resposta: "Talvez" }] }));
    assert.ok(validateInspecao({ ...valida, respostas: Array(CHECKLIST_ITENS_MAX + 1).fill(valida.respostas[0]) }));
  });
  it("accepts only PNG signatures", () => {
    assert.equal(validateInspecao({ ...valida, assinaturaTecnico: "data:image/png;base64,iVBORw0KGgo=" }), null);
    assert.ok(validateInspecao({ ...valida, assinaturaTecnico: "data:text/html;base64,PGI+" }));
  });
});
