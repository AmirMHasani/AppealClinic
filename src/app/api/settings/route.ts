import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { DEFAULT_SETTINGS, getSettings, updateSettings } from "@/lib/db";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ settings: await getSettings() });
}

export async function PUT(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (body?.reset === true) {
    // Full demo defaults (clear optional letterhead fields left over from prior edits)
    const settings = await updateSettings({
      ...DEFAULT_SETTINGS,
      address_line2: "",
    });
    return NextResponse.json({ settings });
  }
  const { reset: _reset, ...patch } = body ?? {};
  const settings = await updateSettings(patch);
  return NextResponse.json({ settings });
}
