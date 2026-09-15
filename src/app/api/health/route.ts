import { NextResponse } from "next/server";
import { usingPostgres } from "@/lib/db";

/** Lightweight keep-alive / smoke probe — no secrets. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    db: usingPostgres(),
  });
}
