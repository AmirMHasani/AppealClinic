import { NextResponse } from "next/server";
import { createSession, verifyCredentials } from "@/lib/auth/session";
import { getCase, getSettings, seedDemoCases, updateCase } from "@/lib/db";
import { generateAppeal } from "@/lib/generator/generateAppeal";

async function ensureDemoLetters() {
  const seeded = await seedDemoCases(false);
  const settings = await getSettings();
  for (const s of seeded) {
    const c = await getCase(s.id);
    if (c && !c.letter_markdown) {
      const result = await generateAppeal(c, settings);
      await updateCase(c.id, {
        letter_markdown: result.letter_markdown,
        checklist: result.checklist,
        gaps: result.gaps,
      });
    }
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "");
    const password = String(body.password || "");
    const user = await verifyCredentials(email, password);
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    await createSession(user);
    await ensureDemoLetters();
    return NextResponse.json({ ok: true, user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = message.includes("AUTH_SECRET") ? 500 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
