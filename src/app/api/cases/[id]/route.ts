import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { deleteCase, getCase, updateCase } from "@/lib/db";
import {
  decideRedaction,
  redactionBlockedResponse,
} from "@/lib/redaction-guard";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const c = await getCase(id);
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ case: c });
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json();

  const decision = decideRedaction({
    meta: body.meta,
    denial: body.denial,
    clinical: body.clinical,
    letter_markdown: body.letter_markdown,
  });

  if (decision.blocked) {
    return redactionBlockedResponse(decision.hits);
  }

  const updated = await updateCase(id, body);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    case: updated,
    hits: decision.hits,
    redactionHits: decision.hits,
    redactionWarning: decision.softWarn,
  });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await deleteCase(id);
  return NextResponse.json({ ok: true });
}
