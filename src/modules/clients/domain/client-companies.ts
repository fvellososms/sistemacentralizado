/**
 * Pure rules for the consultancy's client companies.
 */

export interface ClientCompany {
  id: number;
  name: string;
  cnpj: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  active: boolean;
}

export type ClientCompanyInput = Partial<Omit<ClientCompany, "id">>;
export type ClientCompanyErrors = Partial<Record<keyof ClientCompanyInput, string>>;

export const COMPANY_NAME_MAX_LENGTH = 180;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const onlyDigits = (value: string | null | undefined) => (value ?? "").replace(/\D/g, "");

/** Checks the two CNPJ verification digits. */
export function isValidCnpj(value: string | null | undefined): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) return false;
  const check = (length: number) => {
    const weights = length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((acc, w, i) => acc + Number(digits[i]) * w, 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return check(12) === Number(digits[12]) && check(13) === Number(digits[13]);
}

/** "12345678000195" → "12.345.678/0001-95" (other values are returned unchanged). */
export function formatCnpj(value: string | null | undefined): string {
  const d = onlyDigits(value);
  return d.length === 14 ? `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}` : value ?? "";
}

export function validateClientCompany(input: ClientCompanyInput): { isValid: boolean; errors: ClientCompanyErrors } {
  const errors: ClientCompanyErrors = {};
  const name = input.name?.trim() ?? "";
  if (!name || name.length > COMPANY_NAME_MAX_LENGTH) errors.name = "Informe o nome da empresa (até 180 caracteres).";
  if (input.cnpj?.trim() && !isValidCnpj(input.cnpj)) errors.cnpj = "CNPJ inválido.";
  if (input.contactEmail?.trim() && !EMAIL_RE.test(input.contactEmail.trim())) errors.contactEmail = "E-mail de contato inválido.";
  return { isValid: Object.keys(errors).length === 0, errors };
}

/** Trims texts and stores the CNPJ formatted. Call after `validateClientCompany`. */
export function normalizeClientCompany(input: ClientCompanyInput): Omit<ClientCompany, "id"> {
  const text = (v: string | null | undefined) => v?.trim() || null;
  return {
    name: input.name!.trim().replace(/\s+/g, " "),
    cnpj: input.cnpj?.trim() ? formatCnpj(input.cnpj) : null,
    contactName: text(input.contactName),
    contactEmail: text(input.contactEmail)?.toLowerCase() ?? null,
    contactPhone: text(input.contactPhone),
    active: input.active ?? true,
  };
}
