import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getCase, getSettings, updateCase, writeAudit } from "@/lib/db";
import { generateAppeal } from "@/lib/generator/generateAppeal";
import {
  decideRedaction,
  redactionBlockedResponse,
  refusePhiWorkflowIfNeeded,
} from "@/lib/redaction-guard";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await ctx.params;
    const c = await getCase(user.clinicId, id);
    if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const phiBlock = refusePhiWorkflowIfNeeded(req, body);
    if (phiBlock) return phiBlock;

    const decision = decideRedaction({
      meta: body.meta ?? c.meta,
      denial: body.denial ?? c.denial,
      clinical: body.clinical ?? c.clinical,
      letter_markdown: body.letter_markdown ?? c.letter_markdown,
    });

    if (decision.blocked) {
      return redactionBlockedResponse(decision.hits);
    }

    const result = await generateAppeal(c, await getSettings(user.clinicId));
    const updated = await updateCase(user.clinicId, id, {
      letter_markdown: result.letter_markdown,
      checklist: result.checklist,
      gaps: result.gaps,
      outcome: {
        ...c.outcome,
        status: c.outcome.status === "draft" ? "ready" : c.outcome.status,
      },
    });

    await writeAudit({
      clinicId: user.clinicId,
      userId: user.id,
      action: "case.generate",
      entityType: "case",
      entityId: id,
    });

    return NextResponse.json({
      case: updated,
      hits: decision.hits,
      redactionHits: decision.hits,
      redactionWarning: decision.softWarn,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    console.error("[cases/generate]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
