import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeEmail,
  validateLoginCredentialsInput,
  verifyPasswordMatch,
  parseStoredUserSession,
  mergeUserProfile,
} from "./rules.ts";
import { DEFAULT_PROFILE } from "./constants.ts";

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

  it("parses valid stored user session and rejects invalid JSON", () => {
    const validRaw = JSON.stringify({
      email: "fvellososms@gmail.com",
      name: "Alberto Martins",
      role: "Encarregado Geral de Obra",
      avatarUrl: "data:image/jpeg;base64,abc",
    });
    const session = parseStoredUserSession(validRaw);
    assert.ok(session);
    assert.equal(session.email, "fvellososms@gmail.com");
    assert.equal(session.avatarUrl, "data:image/jpeg;base64,abc");

    assert.equal(parseStoredUserSession(null), null);
    assert.equal(parseStoredUserSession("not-json"), null);
    assert.equal(parseStoredUserSession(JSON.stringify({ email: "sem-arroba" })), null);
  });

  it("merges user profile updates preserving existing fields", () => {
    const updated = mergeUserProfile(DEFAULT_PROFILE, {
      name: "Alberto Martins Atualizado",
      avatarUrl: "data:image/png;base64,custom",
    });
    assert.equal(updated.name, "Alberto Martins Atualizado");
    assert.equal(updated.avatarUrl, "data:image/png;base64,custom");
    assert.equal(updated.email, DEFAULT_PROFILE.email);
  });
});

describe("Avatar URL", async () => {
  const { isValidAvatarUrl } = await import("./rules.ts");
  it("accepts uploaded images, https addresses and empty", () => {
    assert.equal(isValidAvatarUrl("data:image/jpeg;base64,/9j/4AAQ"), true);
    assert.equal(isValidAvatarUrl("https://images.pexels.com/photos/1.jpeg?w=800"), true);
    assert.equal(isValidAvatarUrl(null), true);
  });
  it("refuses other schemes and content", () => {
    assert.equal(isValidAvatarUrl("javascript:alert(1)"), false);
    assert.equal(isValidAvatarUrl("data:text/html;base64,PHNjcmlwdD4="), false);
    assert.equal(isValidAvatarUrl("http://inseguro.example/a.png"), false);
    assert.equal(isValidAvatarUrl("data:image/svg+xml;base64,PHN2Zz4="), false);
  });
});
