import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getSettings, updateSettings } from "@/lib/db";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ settings: await getSettings() });
}

export async function PUT(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const settings = await updateSettings(body);
  return NextResponse.json({ settings });
}
