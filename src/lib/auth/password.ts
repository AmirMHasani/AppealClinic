import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEYLEN = 64;
const PREFIX = "scrypt:";

/** Fixed salt so DEMO_USER hash is stable across restarts/seeds. */
export const DEMO_PASSWORD_SALT = "a1b2c3d4e5f60718293a4b5c6d7e8f90";

export function hashPassword(password: string, saltHex?: string): string {
  const salt = saltHex ?? randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEYLEN).toString("hex");
  return `${PREFIX}${salt}:${hash}`;
}

export function isScryptHash(stored: string): boolean {
  return stored.startsWith(PREFIX) && stored.split(":").length === 3;
}

/**
 * Constant-time compare for scrypt hashes.
  * Also accepts legacy plaintext (demo migration) with length-checked timingSafeEqual.
 */
export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;
  if (isScryptHash(stored)) {
    const parts = stored.split(":");
    const salt = parts[1];
    const hashHex = parts[2];
    if (!salt || !hashHex) return false;
    const derived = scryptSync(password, salt, KEYLEN);
    const expected = Buffer.from(hashHex, "hex");
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  }
  const a = Buffer.from(password, "utf8");
  const b = Buffer.from(stored, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const DEMO_PASSWORD_HASH = hashPassword("demo1234", DEMO_PASSWORD_SALT);
