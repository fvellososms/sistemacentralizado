import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isDatabaseUnavailableError } from "./database-errors.ts";

describe("isDatabaseUnavailableError", () => {
  it("detects Supabase pooler error for paused or missing project", () => {
    const error = Object.assign(
      new Error("(ENOTFOUND) tenant/user postgres.ipwnlrdzelsinndwdvts not found"),
      { code: "XX000" }
    );
    assert.equal(isDatabaseUnavailableError(error), true);
  });

  it("detects network error codes", () => {
    for (const code of ["ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT"]) {
      assert.equal(isDatabaseUnavailableError(Object.assign(new Error("falha"), { code })), true);
    }
  });

  it("detects connection timeouts from pg", () => {
    assert.equal(isDatabaseUnavailableError(new Error("Connection terminated unexpectedly")), true);
    assert.equal(isDatabaseUnavailableError(new Error("timeout exceeded when trying to connect")), true);
  });

  it("detects errors wrapped in cause (DrizzleQueryError)", () => {
    const pgError = Object.assign(new Error("(ENOTFOUND) tenant/user postgres.abc not found"), {
      code: "XX000",
    });
    const wrapped = new Error('Failed query: select * from "user_profiles"', { cause: pgError });
    assert.equal(isDatabaseUnavailableError(wrapped), true);
  });

  it("ignores query errors and non-error values", () => {
    const missingTable = Object.assign(new Error('relation "user_profiles" does not exist'), {
      code: "42P01",
    });
    assert.equal(isDatabaseUnavailableError(missingTable), false);
    assert.equal(isDatabaseUnavailableError(null), false);
    assert.equal(isDatabaseUnavailableError("ENOTFOUND"), false);
  });
});
