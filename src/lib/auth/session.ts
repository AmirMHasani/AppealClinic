import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { DEMO_PASSWORD_HASH, hashPassword, isScryptHash, verifyPassword } from "@/lib/auth/password";
import { findUserByEmail, migrateUserPasswordHash } from "@/lib/db";
import { getAppMode } from "@/lib/env";

export const SESSION_COOKIE = "ac_session";

const WEAK_SECRETS = new Set([
  "",
  "dev-secret-change-me",
  "appealclinic-dev-secret",
]);

function isProductionLike(): boolean {
  return getAppMode() === "production" || process.env.NODE_ENV === "production";
}

/** Resolve AUTH_SECRET; refuse weak/missing secrets outside demo. */
export function resolveAuthSecret(): Uint8Array {
  const raw = process.env.AUTH_SECRET?.trim() ?? "";
  if (isProductionLike()) {
    if (!raw || WEAK_SECRETS.has(raw)) {
      throw new Error(
        "AUTH_SECRET is missing or uses a known weak default. Set a strong secret before running in production."
      );
    }
  }
  const value = raw || "appealclinic-dev-secret";
  return new TextEncoder().encode(value);
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(resolveAuthSecret());

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, resolveAuthSecret());
    return {
      id: String(payload.sub),
      email: String(payload.email),
      name: String(payload.name),
    };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionUser> {
  const s = await getSession();
  if (!s) throw new Error("UNAUTHORIZED");
  return s;
}

export async function verifyCredentials(
  email: string,
  password: string
): Promise<SessionUser | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const stored = user.passwordHash || user.password || "";
  if (!verifyPassword(password, stored)) return null;

  // Upgrade legacy plaintext to scrypt hash
  if (!isScryptHash(stored)) {
    const next = stored === "demo1234" ? DEMO_PASSWORD_HASH : hashPassword(password);
    await migrateUserPasswordHash(user.id, next);
  }

  return { id: user.id, email: user.email, name: user.name };
}
