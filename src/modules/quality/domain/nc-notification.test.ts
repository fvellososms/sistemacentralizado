import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildNcNotificationEmail, numeroNc, type NcNotificationData } from "./nc-notification.ts";
import { NC_FOTO_MAX_BYTES, parseImageDataUrl, validateNaoConformidade } from "./non-conformities.ts";

const PNG_1PX =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const nc: NcNotificationData = {
  id: 7,
  projectId: 1,
  projectName: "Residencial Aurora",
  tipo: "sst",
  grau: "grave",
  dataOcorrencia: "2026-10-25",
  localObra: "Bloco A · 5º pavimento",
  requisitoViolado: "NR-18, item 18.13.1",
  titulo: "Abertura de poço sem guarda-corpo",
  descricao: "Poço de ventilação aberto sem proteção coletiva <urgente>.",
  responsavelNome: "Eng. Roberto Albuquerque",
  responsavelEmail: " roberto@exemplo.com.br ",
  prazo: "2026-10-28",
};

describe("NC notification e-mail", () => {
  it("formats the NC number", () => {
    assert.equal(numeroNc(7), "NC-0007");
    assert.equal(numeroNc(12345), "NC-12345");
  });

  it("addresses the manager with every NC detail", () => {
    const msg = buildNcNotificationEmail(nc);
    assert.equal(msg.to, "roberto@exemplo.com.br");
    assert.equal(msg.subject, "Notificação de Não Conformidade NC-0007 – Abertura de poço sem guarda-corpo");
    assert.match(msg.text, /^Prezado\(a\) Eng\. Roberto Albuquerque,/);
    for (const trecho of [
      "Residencial Aurora",
      "Bloco A · 5º pavimento",
      "Segurança do trabalho (SST)",
      "Grau: Grave",
      "Data da ocorrência: 25/10/2026",
      "Requisito violado: NR-18, item 18.13.1",
      "Prazo para tratamento: 28/10/2026",
      nc.descricao,
      "Atenciosamente,",
    ]) {
      assert.ok(msg.text.includes(trecho), `texto deveria conter "${trecho}"`);
    }
    assert.deepEqual(msg.attachments, []);
    assert.ok(!msg.text.includes("anexo"));
  });

  it("escapes user content in the HTML body", () => {
    const { html } = buildNcNotificationEmail(nc);
    assert.ok(html.includes("&lt;urgente&gt;"));
    assert.ok(!html.includes("<urgente>"));
  });

  it("attaches the photo and shows it inline", () => {
    const msg = buildNcNotificationEmail({ ...nc, fotoUrl: PNG_1PX }, "Qualidade FVelloso");
    assert.equal(msg.attachments.length, 1);
    const [anexo] = msg.attachments;
    assert.equal(anexo.filename, "NC-0007.png");
    assert.equal(anexo.contentType, "image/png");
    assert.ok(msg.html.includes(`cid:${anexo.cid}`));
    assert.ok(msg.text.includes("Segue em anexo o registro fotográfico"));
    assert.ok(msg.text.includes("Qualidade FVelloso"));
  });
});

describe("NC photo rules", () => {
  it("parses supported image data URLs", () => {
    const foto = parseImageDataUrl(PNG_1PX);
    assert.equal(foto?.mimeType, "image/png");
    assert.ok(foto && foto.bytes > 0);
    assert.equal(parseImageDataUrl("data:text/plain;base64,aGVsbG8="), null);
    assert.equal(parseImageDataUrl("https://exemplo.com/foto.jpg"), null);
  });

  it("accepts an NC without photo or with a valid photo", () => {
    const { id: _id, ...input } = nc;
    assert.equal(validateNaoConformidade({ ...input, fotoUrl: null }, "2026-10-26").isValid, true);
    assert.equal(validateNaoConformidade({ ...input, fotoUrl: PNG_1PX }, "2026-10-26").isValid, true);
  });

  it("rejects non-image and oversized photos", () => {
    const { id: _id, ...input } = nc;
    const invalida = validateNaoConformidade({ ...input, fotoUrl: "data:application/pdf;base64,AAAA" }, "2026-10-26");
    assert.ok(invalida.errors.fotoUrl);
    const grande = "data:image/jpeg;base64," + "A".repeat(Math.ceil((NC_FOTO_MAX_BYTES * 4) / 3) + 8);
    assert.match(validateNaoConformidade({ ...input, fotoUrl: grande }, "2026-10-26").errors.fotoUrl ?? "", /5 MB/);
  });
});
