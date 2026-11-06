import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatCnpj, isValidCnpj, normalizeClientCompany, validateClientCompany } from "./client-companies.ts";

describe("Client companies", () => {
  it("validates CNPJ check digits", () => {
    assert.equal(isValidCnpj("11.222.333/0001-81"), true);
    assert.equal(isValidCnpj("11222333000181"), true);
    assert.equal(isValidCnpj("11.222.333/0001-82"), false);
    assert.equal(isValidCnpj("11.111.111/1111-11"), false);
    assert.equal(isValidCnpj("123"), false);
  });

  it("formats CNPJ", () => {
    assert.equal(formatCnpj("11222333000181"), "11.222.333/0001-81");
    assert.equal(formatCnpj("abc"), "abc");
  });

  it("requires the name and checks optional fields", () => {
    assert.equal(validateClientCompany({ name: "Hotel Marina" }).isValid, true);
    const { errors } = validateClientCompany({ name: " ", cnpj: "123", contactEmail: "x@" });
    assert.ok(errors.name && errors.cnpj && errors.contactEmail);
  });

  it("normalizes the record", () => {
    assert.deepEqual(normalizeClientCompany({ name: "  Grupo   CTV ", cnpj: "11222333000181", contactEmail: " A@B.COM ", contactName: " " }), {
      name: "Grupo CTV",
      cnpj: "11.222.333/0001-81",
      contactName: null,
      contactEmail: "a@b.com",
      contactPhone: null,
      active: true,
    });
  });
});
