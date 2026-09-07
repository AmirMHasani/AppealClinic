import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { seedDemoCases } from "@/lib/db";

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const cases = await seedDemoCases(Boolean(body.force));
  return NextResponse.json({ ok: true, count: cases.length, cases });
}
