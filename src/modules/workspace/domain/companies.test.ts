import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { WORKSPACE_CLIENT_COMPANIES, mergeNames } from "./companies.ts";

describe("Workspace client companies", () => {
  it("has no blank or duplicated names", () => {
    assert.deepEqual(mergeNames(WORKSPACE_CLIENT_COMPANIES).length, WORKSPACE_CLIENT_COMPANIES.length);
  });

  it("merges lists sorted, ignoring case, accents and extra spaces", () => {
    assert.deepEqual(
      mergeNames(["Grupo Aurora", "Atlas Logística"], ["atlas logistica", "  Beta   Ltda ", ""]),
      ["Atlas Logística", "Beta Ltda", "Grupo Aurora"]
    );
  });
});
