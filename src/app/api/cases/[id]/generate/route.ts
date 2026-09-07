import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getCase, getSettings, updateCase } from "@/lib/db";
import { generateAppeal } from "@/lib/generator/generateAppeal";
import {
  decideRedaction,
  redactionBlockedResponse,
} from "@/lib/redaction-guard";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const c = await getCase(id);
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Optional body may carry edited fields before generate; always scan case text.
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const decision = decideRedaction({
    meta: body.meta ?? c.meta,
    denial: body.denial ?? c.denial,
    clinical: body.clinical ?? c.clinical,
    letter_markdown: body.letter_markdown ?? c.letter_markdown,
  });

  if (decision.blocked) {
    return redactionBlockedResponse(decision.hits);
  }

  const result = await generateAppeal(c, await getSettings());
  const updated = await updateCase(id, {
    letter_markdown: result.letter_markdown,
    checklist: result.checklist,
    gaps: result.gaps,
    outcome: {
      ...c.outcome,
      status: c.outcome.status === "draft" ? "ready" : c.outcome.status,
    },
  });
  return NextResponse.json({
    case: updated,
    hits: decision.hits,
    redactionHits: decision.hits,
    redactionWarning: decision.softWarn,
  });
}
