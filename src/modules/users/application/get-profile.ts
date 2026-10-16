import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { DEFAULT_PROFILE } from "../domain/constants";
import type { UserProfile } from "../domain/types";

export async function getProfile(): Promise<UserProfile> {
  try {
    const profiles = await db.select().from(userProfiles).limit(1);
    if (!profiles.length) {
      const [newProfile] = await db
        .insert(userProfiles)
        .values({
          ...DEFAULT_PROFILE,
          passwordHash: "123456",
        })
        .returning();
      return newProfile as UserProfile;
    }
    return profiles[0] as UserProfile;
  } catch (error) {
    console.warn("getProfile: database unavailable, returning default profile.");
    return DEFAULT_PROFILE;
  }
}

