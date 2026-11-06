import { isDatabaseUnavailableError } from "@/shared/errors/database-errors";
import { AppError } from "@/shared/errors/AppError";
import { DEFAULT_PROFILE } from "../domain/constants";
import { isBootstrapAdmin } from "../domain/access";
import type { UserProfile } from "../domain/types";
import { defaultUserRepository, type UserRepository } from "../infrastructure/user-repository";
import { getFallbackProfile, saveFallbackProfile } from "../infrastructure/profile-fallback-store";
import { MAIN_ADMIN_EMAIL, type SessionUser } from "./session";
import { toUserProfile } from "./user-mapper";

/** Profile of the logged-in user. Without the database, falls back to what the session carries. */
export async function getProfile(session: SessionUser, repo: UserRepository = defaultUserRepository): Promise<UserProfile> {
  try {
    const row = await repo.findById(session.id);
    if (!row) throw AppError.unauthorized("Usuário não encontrado. Entre novamente.");
    const profile = toUserProfile(row);
    if (isBootstrapAdmin(profile.email, MAIN_ADMIN_EMAIL)) saveFallbackProfile(profile);
    return profile;
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) throw error;
    console.warn("getProfile: banco indisponível, usando os dados da sessão.");
    const base = isBootstrapAdmin(session.email, MAIN_ADMIN_EMAIL) ? getFallbackProfile() : DEFAULT_PROFILE;
    return {
      ...base,
      id: session.id,
      name: session.name,
      email: session.email,
      accessLevel: session.accessLevel,
      mustChangePassword: session.mustChangePassword,
    };
  }
}
