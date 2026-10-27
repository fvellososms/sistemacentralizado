import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeEmail,
  validateLoginCredentialsInput,
  verifyPasswordMatch,
} from "./rules.ts";

describe("Users Domain Rules", () => {
  it("normalizes email by trimming and lowercasing", () => {
    assert.equal(normalizeEmail("  FVellosoSMS@gmail.com "), "fvellososms@gmail.com");
  });

  it("rejects empty email or password", () => {
    const res1 = validateLoginCredentialsInput("", "senha12345678");
    assert.equal(res1.valid, false);
    assert.equal(res1.error, "Preencha o e-mail e a senha corporativa.");

    const res2 = validateLoginCredentialsInput("fvellososms@gmail.com", "");
    assert.equal(res2.valid, false);
  });

  it("rejects invalid email format without @", () => {
    const res = validateLoginCredentialsInput("fvellososms.gmail.com", "senha12345678");
    assert.equal(res.valid, false);
    assert.equal(res.error, "Informe um endereço de e-mail válido.");
  });

  it("accepts valid email and password inputs", () => {
    const res = validateLoginCredentialsInput("fvellososms@gmail.com", "senha12345678");
    assert.equal(res.valid, true);
    assert.equal(res.error, undefined);
  });

  it("verifies password match accurately", () => {
    assert.equal(verifyPasswordMatch("senha12345678", "senha12345678"), true);
    assert.equal(verifyPasswordMatch("senha12345678", "123456"), false);
    assert.equal(verifyPasswordMatch(null, "senha12345678"), false);
  });
});

