import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { createUser, listUsers } from "@/lib/db";

const MIN_PASSWORD = 8;

/** Public staff profile — never include password hashes. */
function publicUser(u: { id: string; email: string; name: string }) {
  return { id: u.id, email: u.email, name: u.name };
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const users = await listUsers();
  return NextResponse.json({
    users: users.map(publicUser),
    note: "Single demo clinic (APP_MODE=demo) — no clinicId tenancy yet (Phase 2).",
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string; email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = (body.name || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";

  if (!name || name.length < 2) {
    return NextResponse.json(
      { error: "Name is required (min 2 characters)" },
      { status: 400 }
    );
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD} characters` },
      { status: 400 }
    );
  }

  try {
    const user = await createUser({
      id: `user-${uuid().slice(0, 8)}`,
      email,
      name,
      passwordHash: hashPassword(password),
    });
    return NextResponse.json({ user: publicUser(user) }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create user";
    if (msg === "DUPLICATE_EMAIL") {
      return NextResponse.json(
        { error: "A user with that email already exists" },
        { status: 409 }
      );
    }
    console.error("[api/users]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
