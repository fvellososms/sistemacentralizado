import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { AppError } from "@/shared/errors/AppError";
import {
  normalizeEmail,
  validateLoginCredentialsInput,
  verifyPasswordMatch,
} from "../domain/rules";
import type { UserProfile } from "../domain/types";

export interface AuthenticateUserInput {
  email: string;
  password: string;
}

export async function authenticateUser(
  input: AuthenticateUserInput
): Promise<UserProfile> {
  const validation = validateLoginCredentialsInput(input.email, input.password);
  if (!validation.valid) {
    throw AppError.badRequest(validation.error || "Credenciais inválidas.");
  }

  const normalizedEmail = normalizeEmail(input.email);

  const [userRecord] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.email, normalizedEmail))
    .limit(1);

  if (!userRecord || !verifyPasswordMatch(userRecord.passwordHash, input.password)) {
    throw AppError.unauthorized("E-mail ou senha inválidos.");
  }

  return {
    id: userRecord.id,
    name: userRecord.name,
    email: userRecord.email,
    role: userRecord.role,
    cpf: userRecord.cpf,
    phone: userRecord.phone,
    birthDate: userRecord.birthDate,
    address: userRecord.address,
    department: userRecord.department,
    avatarUrl: userRecord.avatarUrl,
  };
}

