export interface LoginValidationResult {
  valid: boolean;
  error?: string;
}

export function normalizeEmail(email: string): string {
  return (email || "").trim().toLowerCase();
}

export function validateLoginCredentialsInput(
  email: string,
  password: string
): LoginValidationResult {
  const normalized = normalizeEmail(email);
  if (!normalized || !password) {
    return {
      valid: false,
      error: "Preencha o e-mail e a senha corporativa.",
    };
  }
  if (!normalized.includes("@")) {
    return {
      valid: false,
      error: "Informe um endereço de e-mail válido.",
    };
  }
  return { valid: true };
}

export function verifyPasswordMatch(
  storedPassword: string | null | undefined,
  providedPassword: string
): boolean {
  if (!storedPassword || !providedPassword) {
    return false;
  }
  return storedPassword === providedPassword;
}

