/**
 * Rate limits against brute force. Pure rules: the counters live behind RateLimitStore.
 * A counter holds only attempts that really tested a password, so a blocked request costs
 * nothing (no scrypt, no extra penalty) and a correct login gives its attempt back.
 */

export interface RateLimitRule {
  name: string;
  max: number; // attempts allowed inside the window
  windowSeconds: number;
}

/** Per address, whatever the e-mail: stops guessing many accounts (the account lockout only sees one). */
export const LOGIN_IP_RULES: readonly RateLimitRule[] = [
  { name: "login-ip-15min", max: 10, windowSeconds: 15 * 60 },
  { name: "login-ip-24h", max: 30, windowSeconds: 24 * 60 * 60 }, // slow attacks that respect the short window
];

/** Per account: a stolen session cannot be used to guess the current password. */
export const PASSWORD_CHANGE_RULES: readonly RateLimitRule[] = [
  { name: "troca-senha-15min", max: 5, windowSeconds: 15 * 60 },
];

export interface RateLimitHit {
  count: number;
  resetAtSeconds: number; // unix seconds
}

export interface RateLimitStore {
  /** Atomically counts one attempt, starting a new window when the previous one ended. */
  hit(key: string, windowSeconds: number, nowSeconds: number): Promise<RateLimitHit>;
  /** Gives one attempt back. */
  release(key: string): Promise<void>;
}

export type RateLimitResult = { allowed: true; keys: string[] } | { allowed: false; retryAfterSeconds: number };

export async function consumeRateLimit(
  store: RateLimitStore,
  rules: readonly RateLimitRule[],
  subject: string,
  nowSeconds: number
): Promise<RateLimitResult> {
  const keys = rules.map((rule) => `${rule.name}:${subject}`);
  const hits = await Promise.all(rules.map((rule, i) => store.hit(keys[i], rule.windowSeconds, nowSeconds)));
  const exceeded = hits.filter((hit, i) => hit.count > rules[i].max);
  if (!exceeded.length) return { allowed: true, keys };

  await Promise.all(keys.map((key) => store.release(key)));
  return { allowed: false, retryAfterSeconds: Math.max(1, ...exceeded.map((hit) => hit.resetAtSeconds - nowSeconds)) };
}

export function rateLimitMessage(retryAfterSeconds: number): string {
  const minutes = Math.ceil(retryAfterSeconds / 60);
  const wait = minutes < 60 ? `${minutes} min` : `${Math.ceil(minutes / 60)} h`;
  return `Muitas tentativas. Tente novamente em ${wait}.`;
}

const MEMORY_MAX_KEYS = 10_000;

/** Fallback while the database cannot be used. Per server instance, so weaker than the database store. */
export class MemoryRateLimitStore implements RateLimitStore {
  private readonly entries = new Map<string, RateLimitHit>();

  async hit(key: string, windowSeconds: number, nowSeconds: number): Promise<RateLimitHit> {
    if (this.entries.size >= MEMORY_MAX_KEYS) this.prune(nowSeconds);
    const current = this.entries.get(key);
    const entry =
      current && current.resetAtSeconds > nowSeconds
        ? { count: current.count + 1, resetAtSeconds: current.resetAtSeconds }
        : { count: 1, resetAtSeconds: nowSeconds + windowSeconds };
    this.entries.set(key, entry);
    return entry;
  }

  async release(key: string): Promise<void> {
    const current = this.entries.get(key);
    if (current) this.entries.set(key, { ...current, count: Math.max(0, current.count - 1) });
  }

  private prune(nowSeconds: number): void {
    for (const [key, entry] of this.entries) if (entry.resetAtSeconds <= nowSeconds) this.entries.delete(key);
    // Still full of live keys (attack with many addresses): drop the oldest instead of growing without limit.
    for (const key of this.entries.keys()) {
      if (this.entries.size < MEMORY_MAX_KEYS) break;
      this.entries.delete(key);
    }
  }
}

function ipv6Prefix(ip: string): string {
  const [head, tail = ""] = ip.split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const zeros = ip.includes("::") ? Array(Math.max(0, 8 - left.length - right.length)).fill("0") : [];
  return [...left, ...zeros, ...right]
    .slice(0, 4)
    .map((group) => group.replace(/^0+(?=.)/, "").toLowerCase())
    .join(":");
}

/**
 * Client address for rate limiting. Vercel overwrites these headers, so the client cannot forge them;
 * hosting elsewhere needs a proxy that does the same. IPv6 is reduced to the /64 network: one
 * connection owns billions of addresses of it and could otherwise change address at every attempt.
 */
export function clientAddress(getHeader: (name: string) => string | null): string {
  const raw = getHeader("x-real-ip") ?? getHeader("x-forwarded-for");
  const ip = raw?.split(",")[0].trim().replace(/^::ffff:(?=\d+\.)/i, "");
  if (!ip) return "desconhecido";
  return ip.includes(":") ? `${ipv6Prefix(ip)}::/64` : ip;
}
