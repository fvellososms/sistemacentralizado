import { eq, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { rateLimits } from "@/db/schema";
import { MemoryRateLimitStore, type RateLimitHit, type RateLimitStore } from "../domain/rate-limit";

const DB_RETRY_AFTER_MS = 30_000;
const CLEANUP_CHANCE = 0.01;

/**
 * Counters in Postgres, shared by every serverless instance (memory alone would give each instance
 * its own limit). Never fails the login: without the table (migration 0008 not applied) or with the
 * database down it counts in memory and tries the database again after 30 s, so a paused
 * Supabase does not add a connection timeout to every attempt.
 */
export class DrizzleRateLimitStore implements RateLimitStore {
  private readonly memory = new MemoryRateLimitStore();
  private skipDatabaseUntil = 0;

  private useMemory(error: unknown): void {
    console.warn("Limite de tentativas: usando a memória do servidor.", error);
    this.skipDatabaseUntil = Date.now() + DB_RETRY_AFTER_MS;
  }

  async hit(key: string, windowSeconds: number, nowSeconds: number): Promise<RateLimitHit> {
    if (Date.now() < this.skipDatabaseUntil) return this.memory.hit(key, windowSeconds, nowSeconds);
    try {
      const expired = sql`${rateLimits.resetAt} <= ${nowSeconds}`;
      const [row] = await db
        .insert(rateLimits)
        .values({ key, count: 1, resetAt: nowSeconds + windowSeconds })
        .onConflictDoUpdate({
          target: rateLimits.key,
          set: {
            count: sql`CASE WHEN ${expired} THEN 1 ELSE ${rateLimits.count} + 1 END`,
            resetAt: sql`CASE WHEN ${expired} THEN excluded.reset_at ELSE ${rateLimits.resetAt} END`,
          },
        })
        .returning({ count: rateLimits.count, resetAtSeconds: rateLimits.resetAt });
      if (Math.random() < CLEANUP_CHANCE) {
        await db.delete(rateLimits).where(lt(rateLimits.resetAt, nowSeconds)).catch(() => undefined);
      }
      return row;
    } catch (error) {
      this.useMemory(error);
      return this.memory.hit(key, windowSeconds, nowSeconds);
    }
  }

  async release(key: string): Promise<void> {
    if (Date.now() < this.skipDatabaseUntil) return this.memory.release(key);
    try {
      await db
        .update(rateLimits)
        .set({ count: sql`GREATEST(${rateLimits.count} - 1, 0)` })
        .where(eq(rateLimits.key, key));
    } catch (error) {
      this.useMemory(error);
    }
  }
}

export const defaultRateLimitStore: RateLimitStore = new DrizzleRateLimitStore();
