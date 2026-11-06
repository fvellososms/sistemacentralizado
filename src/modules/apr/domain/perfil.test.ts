import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolvePerfilApr } from "./perfil.ts";

describe("APR role of the logged user", () => {
  it("never grants more than the account allows", () => {
    assert.equal(resolvePerfilApr(undefined, "usuario"), "colaborador");
    assert.equal(resolvePerfilApr("colaborador", "usuario"), "colaborador");
  });
  it("keeps the role designated in the APR users table", () => {
    assert.equal(resolvePerfilApr("aprovador", "usuario"), "aprovador");
    assert.equal(resolvePerfilApr("aprovador", "admin"), "aprovador");
    assert.equal(resolvePerfilApr("admin_sst", "usuario"), "admin_sst");
  });
  it("lets system administrators manage the APR base", () => {
    assert.equal(resolvePerfilApr(undefined, "admin"), "admin_sst");
    assert.equal(resolvePerfilApr("colaborador", "admin"), "admin_sst");
  });
});
