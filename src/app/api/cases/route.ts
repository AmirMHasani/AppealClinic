import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createCase, listCases, seedDemoCases, statusCounts, writeAudit } from "@/lib/db";
import {
  decideRedaction,
  redactionBlockedResponse,
} from "@/lib/redaction-guard";
import type { AppealCase } from "@/lib/types";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await seedDemoCases(user.clinicId, false);
  return NextResponse.json({
    cases: await listCases(user.clinicId),
    stats: await statusCounts(user.clinicId),
    clinicId: user.clinicId,
  });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  const decision = decideRedaction({
    meta: body.meta,
    denial: body.denial,
    clinical: body.clinical,
  });

  if (decision.blocked) {
    return redactionBlockedResponse(decision.hits);
  }

  const c = await createCase(user.clinicId, {
    meta: body.meta,
    denial: body.denial,
    clinical: body.clinical,
    letter_markdown: body.letter_markdown,
    checklist: body.checklist,
    gaps: body.gaps,
    outcome: body.outcome,
  } as Omit<AppealCase, "id" | "created_at" | "updated_at" | "clinicId">);

  await writeAudit({
    clinicId: user.clinicId,
    userId: user.id,
    action: "case.create",
    entityType: "case",
    entityId: c.id,
    meta: { internal_case_id: c.meta?.internal_case_id },
  });

  return NextResponse.json({
    case: c,
    hits: decision.hits,
    redactionHits: decision.hits,
    redactionWarning: decision.softWarn,
  });
}
