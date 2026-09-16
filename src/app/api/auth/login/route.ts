import { NextResponse, after } from "next/server";
import { createSession, verifyCredentials } from "@/lib/auth/session";
import { getCase, getSettings, seedDemoCases, updateCase, writeAudit } from "@/lib/db";
import { generateAppeal } from "@/lib/generator/generateAppeal";

async function ensureDemoLetters(clinicId: string) {
  const seeded = await seedDemoCases(clinicId, false);
  const settings = await getSettings(clinicId);
  for (const s of seeded) {
    try {
      const c = await getCase(clinicId, s.id);
      if (c && !c.letter_markdown) {
        const result = await generateAppeal(c, settings);
        await updateCase(clinicId, c.id, {
          letter_markdown: result.letter_markdown,
          checklist: result.checklist,
          gaps: result.gaps,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[ensureDemoLetters] Skipping case ${s.id}: ${message}`);
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
    await writeAudit({
      clinicId: user.clinicId,
      userId: user.id,
      action: "login",
      entityType: "user",
      entityId: user.id,
    });
    // Do not block the session response on demo letter backfill (was ~20s+).
    after(() => {
      void ensureDemoLetters(user.clinicId).catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[ensureDemoLetters] deferred failed: ${message}`);
      });
    });
    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        clinicId: user.clinicId,
        role: user.role,
        clinicName: user.clinicName,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
