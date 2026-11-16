import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { telaUsaObraAtiva } from "./obra-scope.ts";

describe("Active project scope", () => {
  it("applies to the records of a project", () => {
    for (const tela of ["/dashboard", "/rdo", "/apr", "/apr/3", "/rso", "/dashboard/qualidade/checklist-equipamentos"]) {
      assert.equal(telaUsaObraAtiva(tela), true, tela);
    }
  });
  it("does not apply to company-wide screens", () => {
    for (const tela of ["/espaco-trabalho", "/espaco-trabalho/tarefas", "/admin/obras", "/perfil"]) {
      assert.equal(telaUsaObraAtiva(tela), false, tela);
    }
  });
  it("matches whole path segments", () => {
    assert.equal(telaUsaObraAtiva("/administracao-falsa"), true);
  });
});
