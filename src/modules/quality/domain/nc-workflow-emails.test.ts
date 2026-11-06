import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildNcLembreteEmail, buildNcVerificacaoEmail } from "./nc-workflow-emails.ts";

const nc = {
  id: 12,
  titulo: "Abertura sem <guarda-corpo>",
  projectName: "Hotel Marina",
  localObra: "Bloco A",
  prazo: "2026-11-07",
  responsavelNome: "Eng. Roberto",
  responsavelEmail: " roberto@x.com ",
};

describe("NC workflow e-mails", () => {
  it("builds deadline reminders", () => {
    const soon = buildNcLembreteEmail(nc, "prazo_proximo", "2026-11-05");
    assert.equal(soon.to, "roberto@x.com");
    assert.match(soon.subject, /^Lembrete de prazo: NC-0012/);
    assert.match(soon.text, /vence em 2 dia\(s\), em 07\/11\/2026/);
    const late = buildNcLembreteEmail(nc, "vencida", "2026-11-10");
    assert.match(late.subject, /^Prazo vencido/);
    assert.match(late.text, /há 3 dia\(s\)/);
    assert.ok(late.html.includes("&lt;guarda-corpo&gt;"));
  });

  it("notifies the administrator about pending verification", () => {
    const m = buildNcVerificacaoEmail(nc, "admin@x.com", "Ana");
    assert.equal(m.to, "admin@x.com");
    assert.match(m.text, /enviadas para verificação por Ana/);
  });
});
