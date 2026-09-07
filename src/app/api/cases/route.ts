import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createCase, listCases, seedDemoCases, statusCounts } from "@/lib/db";
import {
  decideRedaction,
  redactionBlockedResponse,
} from "@/lib/redaction-guard";
import type { AppealCase } from "@/lib/types";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await seedDemoCases(false);
  return NextResponse.json({
    cases: await listCases(),
    stats: await statusCounts(),
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

  const c = await createCase({
    meta: body.meta,
    denial: body.denial,
    clinical: body.clinical,
    letter_markdown: body.letter_markdown,
    checklist: body.checklist,
    gaps: body.gaps,
    outcome: body.outcome,
  } as Omit<AppealCase, "id" | "created_at" | "updated_at">);

  return NextResponse.json({
    case: c,
    hits: decision.hits,
    redactionHits: decision.hits,
    redactionWarning: decision.softWarn,
  });
}
