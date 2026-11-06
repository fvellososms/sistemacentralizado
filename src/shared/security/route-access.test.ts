import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isCrossSiteMutation, resolveRouteAccess, safeNextPath } from "./route-access.ts";
import type { SessionClaims } from "./session-token.ts";

const user: SessionClaims = { uid: 2, name: "Ana", email: "ana@x.com", lvl: "usuario", exp: 9e9 };
const admin: SessionClaims = { ...user, uid: 1, lvl: "admin" };
const temp: SessionClaims = { ...user, mcp: true };

describe("Route access", () => {
  it("sends visitors without session to the login", () => {
    assert.deepEqual(resolveRouteAccess("/rdo", null), { type: "redirect", to: "/login" });
    assert.equal(resolveRouteAccess("/api/rdos", null).type, "deny");
    assert.deepEqual(resolveRouteAccess("/login", null), { type: "allow" });
    assert.deepEqual(resolveRouteAccess("/api/auth/login", null), { type: "allow" });
    // There is no public way to create a session without the password.
    assert.equal(resolveRouteAccess("/api/auth/session", null).type, "deny");
    assert.deepEqual(resolveRouteAccess("/api/cron/nc-lembretes", null), { type: "allow" });
  });

  it("lets logged users in and sends them away from the login page", () => {
    assert.deepEqual(resolveRouteAccess("/rdo", user), { type: "allow" });
    assert.deepEqual(resolveRouteAccess("/login", user), { type: "redirect", to: "/dashboard" });
    assert.deepEqual(resolveRouteAccess("/", user), { type: "redirect", to: "/dashboard" });
  });

  it("restricts the admin area", () => {
    assert.deepEqual(resolveRouteAccess("/admin/usuarios", user), { type: "redirect", to: "/dashboard" });
    assert.deepEqual(resolveRouteAccess("/api/admin/usuarios", user), { type: "deny", status: 403, message: "Acesso restrito ao administrador." });
    assert.deepEqual(resolveRouteAccess("/admin", admin), { type: "allow" });
    assert.deepEqual(resolveRouteAccess("/administracao-falsa", user), { type: "allow" });
  });

  it("forces the temporary password to be replaced first", () => {
    assert.deepEqual(resolveRouteAccess("/dashboard", temp), { type: "redirect", to: "/alterar-senha" });
    assert.equal(resolveRouteAccess("/api/rdos", temp).type, "deny");
    assert.deepEqual(resolveRouteAccess("/alterar-senha", temp), { type: "allow" });
    assert.deepEqual(resolveRouteAccess("/api/auth/alterar-senha", temp), { type: "allow" });
    assert.deepEqual(resolveRouteAccess("/login", temp), { type: "redirect", to: "/alterar-senha" });
  });
});

describe("Cross-site requests", () => {
  const host = "sms.fvelloso.com.br";
  it("blocks data changes sent from other sites", () => {
    assert.equal(isCrossSiteMutation("POST", "/api/rdos", "https://evil.example", host), true);
    assert.equal(isCrossSiteMutation("DELETE", "/api/rdos/1", "null", host), true);
    assert.equal(isCrossSiteMutation("POST", "/api/auth/login", "https://sms.fvelloso.com.br.evil.example", host), true);
  });
  it("allows the site itself, reads and clients without Origin", () => {
    assert.equal(isCrossSiteMutation("POST", "/api/rdos", "https://sms.fvelloso.com.br", host), false);
    assert.equal(isCrossSiteMutation("GET", "/api/rdos", "https://evil.example", host), false);
    assert.equal(isCrossSiteMutation("POST", "/api/rdos", null, host), false);
    assert.equal(isCrossSiteMutation("POST", "/login", "https://evil.example", host), false);
  });
});

describe("Login redirect target", () => {
  it("keeps internal paths", () => {
    assert.equal(safeNextPath("/rdo?mes=2026-11"), "/rdo?mes=2026-11");
    assert.equal(safeNextPath(null), "/dashboard");
  });
  it("rejects other sites in every disguise", () => {
    for (const next of ["https://evil.example", "//evil.example", "/\\evil.example", "\\evil.example", "/\tevil", "evil"]) {
      assert.equal(safeNextPath(next), "/dashboard", next);
    }
  });
});
