import fs from "node:fs";
import path from "node:path";
import { DEFAULT_PROFILE } from "../domain/constants";
import { mergeUserProfile } from "../domain/rules";
import type { UserProfile } from "../domain/types";

interface FallbackData {
  profile: UserProfile;
  customPassword?: string | null;
}

const globalForProfile = globalThis as typeof globalThis & {
  __fvellosoFallbackData?: FallbackData;
  __fvellosoDbDownUntil?: number;
};

const CACHE_FILE_PATH = path.join(process.cwd(), ".next", "cache", "fvelloso-profile-fallback.json");

function loadFromDisk(): FallbackData | null {
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const raw = fs.readFileSync(CACHE_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && parsed.profile) {
        return {
          profile: mergeUserProfile(DEFAULT_PROFILE, parsed.profile),
          customPassword: parsed.customPassword ?? null,
        };
      }
    }
  } catch {
    // ignore disk read errors
  }
  return null;
}

function saveToDisk(data: FallbackData): void {
  try {
    const dir = path.dirname(CACHE_FILE_PATH);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // ignore disk write errors
  }
}

function ensureFallbackData(): FallbackData {
  if (!globalForProfile.__fvellosoFallbackData) {
    const fromDisk = loadFromDisk();
    globalForProfile.__fvellosoFallbackData = fromDisk ?? {
      profile: { ...DEFAULT_PROFILE },
      customPassword: null,
    };
  }
  return globalForProfile.__fvellosoFallbackData;
}

export function getFallbackProfile(): UserProfile {
  return { ...ensureFallbackData().profile };
}

export function saveFallbackProfile(
  patch: Partial<UserProfile>,
  newPassword?: string | null
): UserProfile {
  const current = ensureFallbackData();
  const updatedProfile = mergeUserProfile(current.profile, patch);
  const updatedData: FallbackData = {
    profile: updatedProfile,
    customPassword:
      newPassword && newPassword.trim().length > 0
        ? newPassword.trim()
        : current.customPassword ?? null,
  };
  // Called on every profile read: only touch the disk when something actually changed.
  const changed = JSON.stringify(updatedData) !== JSON.stringify(current);
  globalForProfile.__fvellosoFallbackData = updatedData;
  if (changed) saveToDisk(updatedData);
  return { ...updatedProfile };
}

export function getFallbackPasswords(): string[] {
  const current = ensureFallbackData();
  const base = ["123456", "senha12345678"];
  if (current.customPassword && !base.includes(current.customPassword)) {
    return [current.customPassword, ...base];
  }
  return base;
}

export function isDbRecentlyDown(): boolean {
  const until = globalForProfile.__fvellosoDbDownUntil ?? 0;
  return Date.now() < until;
}

export function markDbDown(cooldownMs = 20_000): void {
  globalForProfile.__fvellosoDbDownUntil = Date.now() + cooldownMs;
}

