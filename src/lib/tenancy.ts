/** Shared clinic tenancy constants and types (Phase 2). */

export const DEMO_CLINIC_ID = "clinic-demo";
export const DEMO_CLINIC_NAME = "Demo Clinic";

export type MembershipRole = "owner" | "coordinator";

export function isMembershipRole(v: unknown): v is MembershipRole {
  return v === "owner" || v === "coordinator";
}
