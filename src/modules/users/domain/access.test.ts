import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  LOCK_MINUTES,
  MAX_FAILED_LOGINS,
  isBootstrapAdmin,
  legacyPasswordDecision,
  isLocked,
  minutesUntilUnlock,
  registerFailedLogin,
  resolveAccessLevel,
  validatePasswordStrength,
  validateUserAccount,
} from "./access.ts";

const ADMIN = "fvellososms@gmail.com";
const NOW = new Date("2026-11-04T12:00:00Z");

describe("Users access rules", () => {
  it("enforces the password policy", () => {
    assert.equal(validatePasswordStrength("Obra2026segura", "ana@empresa.com"), null);
    assert.match(validatePasswordStrength("abc1", null)!, /pelo menos 8/);
    assert.match(validatePasswordStrength("somenteletras", null)!, /letras e números/);
    assert.match(validatePasswordStrength("senha123", null)!, /muito comum/);
    assert.match(validatePasswordStrength("joaosilva2026", "joaosilva@x.com")!, /e-mail/);
  });

  it("keeps the main administrator as admin", () => {
    assert.equal(isBootstrapAdmin(" FVelloSoSMS@gmail.com ", ADMIN), true);
    assert.equal(resolveAccessLevel("usuario", ADMIN, ADMIN), "admin");
    assert.equal(resolveAccessLevel("admin", "ana@x.com", ADMIN), "admin");
    assert.equal(resolveAccessLevel(null, "ana@x.com", ADMIN), "usuario");
  });

  it("locks the account after too many wrong passwords", () => {
    let state = { failedLoginAttempts: 0, lockedUntil: null as Date | null };
    for (let i = 1; i < MAX_FAILED_LOGINS; i++) {
      state = registerFailedLogin(state.failedLoginAttempts, NOW);
      assert.equal(state.lockedUntil, null);
    }
    state = registerFailedLogin(state.failedLoginAttempts, NOW);
    assert.equal(state.failedLoginAttempts, 0);
    assert.equal(state.lockedUntil!.getTime(), NOW.getTime() + LOCK_MINUTES * 60_000);
    assert.equal(isLocked(state.lockedUntil, NOW), true);
    assert.equal(isLocked(state.lockedUntil, new Date(NOW.getTime() + LOCK_MINUTES * 60_000)), false);
    assert.equal(minutesUntilUnlock(state.lockedUntil!, NOW), LOCK_MINUTES);
  });

  it("validates user accounts", () => {
    const ok = validateUserAccount({ name: "Ana", email: "ana@x.com", role: "Técnica", department: "SMS", accessLevel: "usuario" });
    assert.equal(ok.isValid, true);
    const bad = validateUserAccount({ email: "ana", accessLevel: "root" as never, password: "123" });
    for (const field of ["name", "email", "role", "department", "accessLevel", "password"]) {
      assert.ok(field in bad.errors, `missing error for ${field}`);
    }
    assert.ok(validateUserAccount({}, { requirePassword: true }).errors.password);
  });
});

describe("Legacy plain-text passwords", () => {
  it("refuses weak old passwords of regular users", () => {
    assert.equal(legacyPasswordDecision("123456", "ana@x.com", false), "recusar");
    assert.equal(legacyPasswordDecision("12345678", "ana@x.com", false), "recusar");
  });
  it("accepts strong ones only to replace them", () => {
    assert.equal(legacyPasswordDecision("Obra2026segura", "ana@x.com", false), "trocar");
  });
  it("never locks the main administrator out", () => {
    assert.equal(legacyPasswordDecision("123456", "dono@x.com", true), "trocar");
  });
});
