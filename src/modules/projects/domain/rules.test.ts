import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateProject } from "./rules.ts";

const valid = {
  name: "Hotel Marina",
  code: "HM-01",
  address: "Av. Beira Mar, 1200",
  companyName: "Construtora Aliança",
  managerName: "Eng. Roberto",
  status: "Em andamento",
  startDate: "2026-09-01",
  clientCompanyId: 2,
};

describe("Project rules", () => {
  it("accepts a complete project, with or without client company", () => {
    assert.equal(validateProject(valid).isValid, true);
    assert.equal(validateProject({ ...valid, clientCompanyId: null }).isValid, true);
  });

  it("reports every invalid field", () => {
    const { errors } = validateProject({ status: "Outra", startDate: "01/09/2026", clientCompanyId: -1 });
    for (const f of ["name", "code", "address", "companyName", "managerName", "status", "startDate", "clientCompanyId"]) {
      assert.ok(f in errors, `missing error for ${f}`);
    }
  });
});
