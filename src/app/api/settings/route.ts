import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { DEFAULT_SETTINGS, getSettings, updateSettings, writeAudit } from "@/lib/db";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    settings: await getSettings(user.clinicId),
    clinicId: user.clinicId,
    clinicName: user.clinicName,
    role: user.role,
  });
}

export async function PUT(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (body?.reset === true) {
    const settings = await updateSettings(user.clinicId, {
      ...DEFAULT_SETTINGS,
      address_line2: "",
    });
    await writeAudit({
      clinicId: user.clinicId,
      userId: user.id,
      action: "settings.update",
      entityType: "settings",
      entityId: user.clinicId,
      meta: { reset: true },
    });
    return NextResponse.json({ settings });
  }
  const { reset: _reset, ...patch } = body ?? {};
  const settings = await updateSettings(user.clinicId, patch);
  await writeAudit({
    clinicId: user.clinicId,
    userId: user.id,
    action: "settings.update",
    entityType: "settings",
    entityId: user.clinicId,
  });
  return NextResponse.json({ settings });
}
