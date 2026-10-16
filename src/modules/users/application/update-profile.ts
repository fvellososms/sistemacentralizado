import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DEFAULT_PROFILE } from "../domain/constants";
import type { UserProfile } from "../domain/types";

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  role?: string;
  cpf?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  address?: string | null;
  department?: string;
  avatarUrl?: string | null;
  newPassword?: string | null;
}

export async function updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
  try {
    const profiles = await db.select().from(userProfiles).limit(1);
    if (!profiles.length) {
      return { ...DEFAULT_PROFILE, ...input };
    }

    const currentId = profiles[0].id;
    const updateData: Record<string, unknown> = {
      name: input.name ?? profiles[0].name,
      email: input.email ?? profiles[0].email,
      role: input.role ?? profiles[0].role,
      cpf: input.cpf ?? profiles[0].cpf,
      phone: input.phone ?? profiles[0].phone,
      birthDate: input.birthDate ?? profiles[0].birthDate,
      address: input.address ?? profiles[0].address,
      department: input.department ?? profiles[0].department,
      avatarUrl: input.avatarUrl ?? profiles[0].avatarUrl,
      updatedAt: new Date(),
    };

    if (input.newPassword && input.newPassword.trim().length > 0) {
      updateData.passwordHash = input.newPassword;
    }

    const [updated] = await db
      .update(userProfiles)
      .set(updateData)
      .where(eq(userProfiles.id, currentId))
      .returning();

    return updated as UserProfile;
  } catch (error) {
    console.warn("updateProfile: database unavailable, returning merged fallback profile.");
    return { ...DEFAULT_PROFILE, ...input };
  }
}

