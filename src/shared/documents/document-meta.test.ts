import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildDocumentCode,
  buildDocumentFileName,
  formatDocumentDate,
  formatDocumentDateTime,
  toCodeSegment,
} from "./document-meta.ts";

describe("Document metadata helpers", () => {
  it("normalizes code segments", () => {
    assert.equal(toCodeSegment(" Hotel Marina / Bloco A "), "HOTELMARINABLOCOA");
    assert.equal(toCodeSegment("Não-conformidade"), "NAOCONFORMIDADE");
    assert.equal(toCodeSegment(null), "");
  });

  it("builds document codes with padded numbers", () => {
    assert.equal(buildDocumentCode("RDO", "HM-01", 139), "RDO-HM01-0139");
    assert.equal(buildDocumentCode("NC", null, "7"), "NC-0007");
    assert.equal(buildDocumentCode("RSO", "HM-01", "2026-10-19"), "RSO-HM01-20261019");
  });

  it("builds safe file names", () => {
    assert.equal(buildDocumentFileName("RDO-HM01-0139", "2026-10-20"), "RDO-HM01-0139_2026-10-20.pdf");
    assert.equal(buildDocumentFileName("APR-2026-0001"), "APR-2026-0001.pdf");
    assert.equal(buildDocumentFileName("../x y", "20/10/2026"), "xy.pdf");
    assert.equal(buildDocumentFileName(""), "DOCUMENTO.pdf");
  });

  it("formats dates for documents", () => {
    assert.equal(formatDocumentDate("2026-10-20"), "20/10/2026");
    assert.equal(formatDocumentDate("2026-10-20T15:00:00.000Z"), "20/10/2026");
    assert.equal(formatDocumentDate(""), "—");
    assert.equal(formatDocumentDateTime("2026-10-20T17:05:00.000Z"), "20/10/2026 14:05");
    assert.equal(formatDocumentDateTime("inválida"), "—");
  });
});
