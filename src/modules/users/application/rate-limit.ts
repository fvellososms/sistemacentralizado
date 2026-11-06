import { createHash } from "node:crypto";
import { AppError } from "@/shared/errors/AppError";
import { consumeRateLimit, rateLimitMessage, type RateLimitRule, type RateLimitStore } from "../domain/rate-limit";
import { defaultRateLimitStore } from "../infrastructure/rate-limit-repository";

/** Addresses and accounts are stored only as a hash: the counters are not a log of who accessed the system. */
const hashSubject = (subject: string) => createHash("sha256").update(subject).digest("base64url").slice(0, 32);

/**
 * Counts one attempt or throws 429 with the wait time. The caller gives the attempt back with
 * `release()` when no password was guessed wrong (correct password, invalid form, database down).
 */
export async function enforceRateLimit(
  rules: readonly RateLimitRule[],
  subject: string,
  store: RateLimitStore = defaultRateLimitStore,
  now = new Date()
): Promise<{ release: () => Promise<void> }> {
  const result = await consumeRateLimit(store, rules, hashSubject(subject), Math.floor(now.getTime() / 1000));
  if (!result.allowed) {
    console.warn(`Limite de tentativas atingido (${rules[0].name}).`);
    throw AppError.tooManyRequests(rateLimitMessage(result.retryAfterSeconds), result.retryAfterSeconds);
  }
  return {
    release: async () => {
      await Promise.all(result.keys.map((key) => store.release(key)));
    },
  };
}
