import type { UserProfile } from "./types.ts";

export interface LoginValidationResult {
  valid: boolean;
  error?: string;
}

export interface StoredUserSession extends Partial<UserProfile> {
  email: string;
  name: string;
  role: string;
  loggedAt?: string;
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

export function parseStoredUserSession(raw: string | null | undefined): StoredUserSession | null {
  if (!raw || typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.email === "string" &&
      parsed.email.trim().includes("@")
    ) {
      return parsed as StoredUserSession;
    }
    return null;
  } catch {
    return null;
  }
}

export function mergeUserProfile(
  base: UserProfile,
  patch?: Partial<UserProfile> | null
): UserProfile {
  if (!patch) return { ...base };
  return {
    id: patch.id ?? base.id,
    name: patch.name?.trim() ? patch.name : base.name,
    email: patch.email?.trim() ? patch.email : base.email,
    role: patch.role?.trim() ? patch.role : base.role,
    cpf: patch.cpf !== undefined ? patch.cpf : base.cpf,
    phone: patch.phone !== undefined ? patch.phone : base.phone,
    birthDate: patch.birthDate !== undefined ? patch.birthDate : base.birthDate,
    address: patch.address !== undefined ? patch.address : base.address,
    department: patch.department?.trim() ? patch.department : base.department,
    avatarUrl: patch.avatarUrl !== undefined && patch.avatarUrl !== null && patch.avatarUrl !== ""
      ? patch.avatarUrl
      : base.avatarUrl,
  };
}

/** Avatar stored as a data URL from the profile upload (phone photos included) or an https address. */
export const AVATAR_MAX_LENGTH = 8 * 1024 * 1024;

export function isValidAvatarUrl(value: string | null | undefined): boolean {
  if (value === null || value === undefined || value === "") return true;
  if (typeof value !== "string" || value.length > AVATAR_MAX_LENGTH) return false;
  const image = /^data:image\/([a-z0-9.+-]+);base64,[A-Za-z0-9+/=]+$/.exec(value);
  if (image) return image[1] !== "svg+xml"; // SVG can carry scripts if opened directly
  try {
    return new URL(value).protocol === "https:" && value.length <= 2048;
  } catch {
    return false;
  }
}
