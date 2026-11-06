import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  LOGIN_IP_RULES,
  MemoryRateLimitStore,
  PASSWORD_CHANGE_RULES,
  clientAddress,
  consumeRateLimit,
  rateLimitMessage,
  type RateLimitRule,
} from "./rate-limit.ts";

const rule: RateLimitRule = { name: "teste", max: 3, windowSeconds: 60 };

describe("Rate limit", () => {
  it("allows up to the limit and blocks the next attempt until the window ends", async () => {
    const store = new MemoryRateLimitStore();
    for (let i = 0; i < 3; i++) assert.equal((await consumeRateLimit(store, [rule], "a", 1_000)).allowed, true);
    assert.deepEqual(await consumeRateLimit(store, [rule], "a", 1_010), { allowed: false, retryAfterSeconds: 50 });
    assert.equal((await consumeRateLimit(store, [rule], "a", 1_060)).allowed, true);
  });

  it("keeps each subject separate", async () => {
    const store = new MemoryRateLimitStore();
    for (let i = 0; i < 3; i++) await consumeRateLimit(store, [rule], "a", 1_000);
    assert.equal((await consumeRateLimit(store, [rule], "b", 1_000)).allowed, true);
  });

  it("does not count blocked requests", async () => {
    const long: RateLimitRule = { name: "longa", max: 5, windowSeconds: 3_600 };
    const store = new MemoryRateLimitStore();
    for (let i = 0; i < 3; i++) await consumeRateLimit(store, [rule, long], "a", 1_000);
    for (let i = 0; i < 20; i++) assert.equal((await consumeRateLimit(store, [rule, long], "a", 1_001)).allowed, false);
    // Hammering during the short block did not use up the long window.
    assert.equal((await consumeRateLimit(store, [rule, long], "a", 1_060)).allowed, true);
  });

  it("waits for the longest exceeded window", async () => {
    const long: RateLimitRule = { name: "longa", max: 2, windowSeconds: 3_600 };
    const store = new MemoryRateLimitStore();
    await consumeRateLimit(store, [rule, long], "a", 1_000);
    await consumeRateLimit(store, [rule, long], "a", 1_000);
    assert.deepEqual(await consumeRateLimit(store, [rule, long], "a", 1_000), { allowed: false, retryAfterSeconds: 3_600 });
  });

  it("gives released attempts back, so successful logins never add up", async () => {
    const store = new MemoryRateLimitStore();
    for (let i = 0; i < 50; i++) {
      const result = await consumeRateLimit(store, [rule], "escritorio", 1_000);
      assert.equal(result.allowed, true);
      if (result.allowed) await Promise.all(result.keys.map((k) => store.release(k)));
    }
  });

  it("uses strict limits on the password rules", () => {
    assert.deepEqual(LOGIN_IP_RULES.map((r) => r.max), [10, 30]);
    assert.equal(PASSWORD_CHANGE_RULES[0].max, 5);
  });

  it("tells how long to wait", () => {
    assert.equal(rateLimitMessage(61), "Muitas tentativas. Tente novamente em 2 min.");
    assert.equal(rateLimitMessage(7_200), "Muitas tentativas. Tente novamente em 2 h.");
  });
});

describe("Client address", () => {
  const from = (headers: Record<string, string>) => clientAddress((name) => headers[name] ?? null);

  it("reads the address set by the platform", () => {
    assert.equal(from({ "x-real-ip": "203.0.113.7" }), "203.0.113.7");
    assert.equal(from({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }), "203.0.113.7");
    assert.equal(from({ "x-real-ip": "::ffff:203.0.113.7" }), "203.0.113.7");
    assert.equal(from({}), "desconhecido");
  });

  it("treats a whole IPv6 network as one client", () => {
    const a = from({ "x-real-ip": "2001:db8:1:2:aaaa:bbbb:cccc:dddd" });
    assert.equal(a, "2001:db8:1:2::/64");
    assert.equal(from({ "x-real-ip": "2001:DB8:1:2::1" }), a);
    assert.equal(from({ "x-real-ip": "2001:0db8:0001:0002:0:0:0:9" }), a);
    assert.notEqual(from({ "x-real-ip": "2001:db8:1:3::1" }), a);
    assert.equal(from({ "x-real-ip": "::1" }), "0:0:0:0::/64");
  });
});
