import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { listAuditEvents } from "@/lib/db";

/** Clinic-scoped audit trail (login, case ops, settings, retention). */
export async function GET(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") || 100), 500);
  const events = await listAuditEvents(user.clinicId, limit);
  return NextResponse.json({ clinicId: user.clinicId, events });
}
