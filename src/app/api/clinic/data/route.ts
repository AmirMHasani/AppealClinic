import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { deleteClinicData, writeAudit } from "@/lib/db";

/**
 * Owner-only: wipe all appeal cases for the actor's clinic.
 * Does not delete users, memberships, or letterhead settings.
 * See docs/retention.md.
 */
export async function DELETE() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "owner") {
    return NextResponse.json(
      { error: "Only clinic owners can delete clinic case data" },
      { status: 403 }
    );
  }

  const result = await deleteClinicData(user.clinicId);
  await writeAudit({
    clinicId: user.clinicId,
    userId: user.id,
    action: "clinic.delete_data",
    entityType: "clinic",
    entityId: user.clinicId,
    meta: { deletedCases: result.deletedCases },
  });

  return NextResponse.json({
    ok: true,
    clinicId: user.clinicId,
    deletedCases: result.deletedCases,
  });
}
