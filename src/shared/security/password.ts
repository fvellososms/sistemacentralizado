/**
 * Password hashing with scrypt (node:crypto). Server-only.
 * Stored format: scrypt$<N>$<r>$<p>$<salt base64>$<hash base64>.
 * Older records kept the password in plain text; they are still accepted once and flagged for rehash.
 */

import { randomBytes, randomInt, scrypt, timingSafeEqual } from "node:crypto";

const PREFIX = "scrypt";
const N = 16384;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

function deriveKey(password: string, salt: Buffer, n: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, { N: n, r, p, maxmem: 64 * 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(key)
    );
  });
}

export function isPasswordHash(stored: string | null | undefined): boolean {
  return typeof stored === "string" && stored.startsWith(`${PREFIX}$`);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await deriveKey(password, salt, N, R, P);
  return [PREFIX, N, R, P, salt.toString("base64"), key.toString("base64")].join("$");
}

/** `needsRehash` is true for legacy plain-text passwords that matched. */
export async function verifyPassword(
  stored: string | null | undefined,
  password: string
): Promise<{ valid: boolean; needsRehash: boolean }> {
  if (!stored || !password) return { valid: false, needsRehash: false };

  if (!isPasswordHash(stored)) {
    const a = Buffer.from(stored);
    const b = Buffer.from(password);
    const valid = a.length === b.length && timingSafeEqual(a, b);
    return { valid, needsRehash: valid };
  }

  const [, n, r, p, saltB64, hashB64] = stored.split("$");
  const expected = Buffer.from(hashB64 ?? "", "base64");
  if (!expected.length) return { valid: false, needsRehash: false };
  const key = await deriveKey(password, Buffer.from(saltB64 ?? "", "base64"), Number(n), Number(r), Number(p));
  const valid = key.length === expected.length && timingSafeEqual(key, expected);
  return { valid, needsRehash: valid && (Number(n) !== N || Number(r) !== R || Number(p) !== P) };
}

/** Spends the same time as a real check, so unknown e-mails cannot be told apart by response time. */
let dummyHash: Promise<string> | null = null;
export async function burnPasswordCheck(password: string): Promise<void> {
  dummyHash ??= hashPassword("senha-inexistente-para-tempo-constante");
  await verifyPassword(await dummyHash, password || "x");
}

const TEMP_ALPHABET_LETTERS = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
const TEMP_ALPHABET_DIGITS = "23456789";

/** Readable temporary password (no 0/O, 1/l/I) with letters and digits, e.g. "fV7k-Q2mx-9a". */
export function generateTemporaryPassword(): string {
  const all = TEMP_ALPHABET_LETTERS + TEMP_ALPHABET_DIGITS;
  const chars = Array.from({ length: 10 }, () => all[randomInt(all.length)]);
  // Guarantees at least one digit and one letter, in two different positions.
  const digitPos = randomInt(10);
  const letterPos = (digitPos + 1 + randomInt(9)) % 10;
  chars[digitPos] = TEMP_ALPHABET_DIGITS[randomInt(TEMP_ALPHABET_DIGITS.length)];
  chars[letterPos] = TEMP_ALPHABET_LETTERS[randomInt(TEMP_ALPHABET_LETTERS.length)];
  const s = chars.join("");
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`;
}
