import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ESO_CSV_TEMPLATE, parseCsv, parseEsoCsv } from "./eso-import.ts";

describe("ESO CSV Import", () => {
  it("parses quoted cells, escaped quotes, CRLF and BOM", () => {
    const rows = parseCsv('﻿a;b\r\n"x;1";"diz ""oi"""\r\n\r\n2;3');
    assert.deepEqual(rows, [["a", "b"], ["x;1", 'diz "oi"'], ["2", "3"]]);
  });

  it("detects comma as delimiter", () => {
    assert.deepEqual(parseCsv("a,b\n1,2\n"), [["a", "b"], ["1", "2"]]);
  });

  it("accepts the downloadable template", () => {
    const { records, errors } = parseEsoCsv(ESO_CSV_TEMPLATE);
    assert.deepEqual(errors, []);
    assert.equal(records.length, 1);
    assert.equal(records[0].externalId, "exemplo-001");
    assert.equal(records[0].quantity, 10);
    assert.equal(records[0].submittedQuantity, 8);
  });

  it("reports missing columns", () => {
    const { errors } = parseEsoCsv("external_id;occurred_on\nx;2026-01-01");
    assert.match(errors[0], /Colunas ausentes: company/);
  });

  it("reports invalid rows with the spreadsheet line number", () => {
    const csv = ESO_CSV_TEMPLATE + "exemplo-002;2026-09-01;Empresa;Pessoa;Eventos eSocial;S-9999;5;6;pending;\n";
    const { records, errors } = parseEsoCsv(csv);
    assert.equal(records.length, 1);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /^Linha 3: /);
  });

  it("reports an empty file", () => {
    assert.deepEqual(parseEsoCsv("").errors, ["O arquivo está vazio."]);
  });
});
