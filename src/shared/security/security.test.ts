import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateTemporaryPassword, hashPassword, isPasswordHash, verifyPassword } from "./password.ts";
import { signSession, verifySession, type SessionClaims } from "./session-token.ts";

describe("Password hashing", () => {
  it("hashes with a random salt and verifies", async () => {
    const a = await hashPassword("Obra2026segura");
    const b = await hashPassword("Obra2026segura");
    assert.ok(isPasswordHash(a));
    assert.notEqual(a, b);
    assert.deepEqual(await verifyPassword(a, "Obra2026segura"), { valid: true, needsRehash: false });
    assert.equal((await verifyPassword(a, "obra2026segura")).valid, false);
  });

  it("accepts legacy plain-text passwords once and asks for rehash", async () => {
    assert.deepEqual(await verifyPassword("senha12345678", "senha12345678"), { valid: true, needsRehash: true });
    assert.deepEqual(await verifyPassword("senha12345678", "senha"), { valid: false, needsRehash: false });
    assert.equal((await verifyPassword(null, "x")).valid, false);
  });

  it("generates readable temporary passwords with letters and digits", () => {
    for (let i = 0; i < 50; i++) {
      const p = generateTemporaryPassword();
      assert.match(p, /^[A-Za-z2-9]{4}-[A-Za-z2-9]{4}-[A-Za-z2-9]{2}$/);
      assert.match(p, /\d/);
      assert.match(p, /[A-Za-z]/);
      assert.doesNotMatch(p, /[01OIl]/);
    }
  });
});

describe("Session token", () => {
  const claims: SessionClaims = { uid: 7, name: "Ana", email: "ana@x.com", lvl: "usuario", exp: 2_000 };

  it("round-trips valid tokens", async () => {
    const token = await signSession(claims, "segredo-a");
    assert.deepEqual(await verifySession(token, "segredo-a", 1_000), claims);
  });

  it("rejects expired, tampered and wrongly signed tokens", async () => {
    const token = await signSession(claims, "segredo-a");
    assert.equal(await verifySession(token, "segredo-a", 2_000), null);
    assert.equal(await verifySession(token, "segredo-b", 1_000), null);
    const [payload, signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ ...claims, lvl: "admin" })).toString("base64url");
    assert.equal(await verifySession(`${forged}.${signature}`, "segredo-a", 1_000), null);
    assert.equal(await verifySession(`${payload}.${signature}.x`, "segredo-a", 1_000), null);
    assert.equal(await verifySession("lixo", "segredo-a", 1_000), null);
  });
});

describe("Session renewal", () => {
  it("keeps a 7-day period and renews (re-checking the account) tokens older than an hour", async () => {
    const { SESSION_TTL_SECONDS, renewSessionClaims, shouldRenewSession } = await import("./session-token.ts");
    assert.equal(SESSION_TTL_SECONDS, 7 * 24 * 60 * 60);
    const now = 1_000_000;
    const fresh: SessionClaims = { uid: 1, name: "A", email: "a@x.com", lvl: "usuario", exp: now + SESSION_TTL_SECONDS - 60 };
    const dayOld: SessionClaims = { ...fresh, exp: now + SESSION_TTL_SECONDS - 61 * 60 };
    assert.equal(shouldRenewSession(fresh, now), false);
    assert.equal(shouldRenewSession(dayOld, now), true);
    assert.equal(renewSessionClaims(dayOld, now).exp, now + SESSION_TTL_SECONDS);
  });
});

describe("Password fingerprint", () => {
  it("changes with the password hash and does not expose it", async () => {
    const { passwordFingerprint } = await import("./session-token.ts");
    const a = await passwordFingerprint("scrypt$16384$8$1$c2FsdA$aGFzaA");
    assert.equal(a, await passwordFingerprint("scrypt$16384$8$1$c2FsdA$aGFzaA"));
    assert.notEqual(a, await passwordFingerprint("scrypt$16384$8$1$b3V0cm8$aGFzaA"));
    assert.equal(a.length, 16);
    assert.ok(!a.includes("aGFzaA"));
  });
});
