/**
 * Persistence facade.
 *
 * - DATABASE_URL unset → JSON only (`data/store.json`): local laptop, CI, and
 *   ephemeral Render Free demos. Data does not survive sleep/redeploy.
 * - DATABASE_URL set → Prisma Postgres: **required** production path for
 *   multi-user / durable hosted demos (Neon free or Render Postgres).
 *
 * Phase 2: all case/settings ops are clinic-scoped (clinicId required).
 */
import type { AppealCase, ClinicSettings, DemoUser, MembershipRole, Store } from "@/lib/types";
import { DEMO_CLINIC_ID } from "@/lib/tenancy";
import * as json from "./json-store";

export { DEMO_CASES, DEFAULT_SETTINGS, DEMO_USER } from "./seed";
export { DEMO_CLINIC_ID, DEMO_CLINIC_NAME } from "@/lib/tenancy";
export { writeAudit } from "./audit";
export type { AuditAction, AuditWriteInput } from "./audit";

export function usingPostgres(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

async function pg() {
  return import("./prisma-store");
}

export async function getStore(): Promise<Store> {
  if (usingPostgres()) {
    const p = await pg();
    await p.ensureTenancy();
    const [settings, cases, users] = await Promise.all([
      p.prismaGetSettings(DEMO_CLINIC_ID),
      p.prismaListCases(DEMO_CLINIC_ID),
      p.prismaListUsersForClinic(DEMO_CLINIC_ID),
    ]);
    return {
      users,
      clinics: [
        {
          id: DEMO_CLINIC_ID,
          name: "Demo Clinic",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      memberships: [],
      settingsByClinic: { [DEMO_CLINIC_ID]: settings },
      cases,
      auditEvents: [],
      seeded: true,
    };
  }
  return json.jsonGetStore();
}

export function getStoreSync(): Store {
  if (usingPostgres()) {
    throw new Error("getStoreSync unavailable when DATABASE_URL is set");
  }
  return json.jsonGetStore();
}

export async function saveStore(store: Store): Promise<void> {
  if (usingPostgres()) {
    throw new Error("saveStore is JSON-only");
  }
  json.jsonSaveStore(store);
}

export async function getMembershipForUser(
  userId: string
): Promise<{ clinicId: string; role: MembershipRole; clinicName: string } | null> {
  if (usingPostgres()) return (await pg()).prismaGetMembershipForUser(userId);
  return json.jsonGetMembershipForUser(userId);
}

export async function getSettings(clinicId: string): Promise<ClinicSettings> {
  if (usingPostgres()) return (await pg()).prismaGetSettings(clinicId);
  return json.jsonGetSettings(clinicId);
}

export async function updateSettings(
  clinicId: string,
  patch: Partial<ClinicSettings>
): Promise<ClinicSettings> {
  if (usingPostgres()) return (await pg()).prismaUpdateSettings(clinicId, patch);
  return json.jsonUpdateSettings(clinicId, patch);
}

export async function listCases(clinicId: string): Promise<AppealCase[]> {
  if (usingPostgres()) return (await pg()).prismaListCases(clinicId);
  return json.jsonListCases(clinicId);
}

export async function getCase(
  clinicId: string,
  id: string
): Promise<AppealCase | undefined> {
  if (usingPostgres()) return (await pg()).prismaGetCase(clinicId, id);
  return json.jsonGetCase(clinicId, id);
}

export async function createCase(
  clinicId: string,
  data: Omit<AppealCase, "id" | "created_at" | "updated_at" | "outcome" | "clinicId"> & {
    outcome?: AppealCase["outcome"];
  }
): Promise<AppealCase> {
  if (usingPostgres()) return (await pg()).prismaCreateCase(clinicId, data);
  return json.jsonCreateCase(clinicId, data);
}

export async function updateCase(
  clinicId: string,
  id: string,
  patch: Partial<AppealCase>
): Promise<AppealCase | null> {
  if (usingPostgres()) return (await pg()).prismaUpdateCase(clinicId, id, patch);
  return json.jsonUpdateCase(clinicId, id, patch);
}

export async function deleteCase(clinicId: string, id: string): Promise<boolean> {
  if (usingPostgres()) return (await pg()).prismaDeleteCase(clinicId, id);
  return json.jsonDeleteCase(clinicId, id);
}

export async function seedDemoCases(
  clinicId: string = DEMO_CLINIC_ID,
  force = false
): Promise<AppealCase[]> {
  if (usingPostgres()) return (await pg()).prismaSeedDemoCases(clinicId, force);
  return json.jsonSeedDemoCases(clinicId, force);
}

export async function statusCounts(clinicId: string) {
  if (usingPostgres()) return (await pg()).prismaStatusCounts(clinicId);
  return json.jsonStatusCounts(clinicId);
}

export async function findUserByEmail(email: string): Promise<DemoUser | undefined> {
  if (usingPostgres()) return (await pg()).prismaFindUserByEmail(email);
  return json.jsonFindUserByEmail(email);
}

export async function migrateUserPasswordHash(
  id: string,
  passwordHash: string
): Promise<void> {
  if (usingPostgres()) {
    await (await pg()).prismaMigrateUserPasswordHash(id, passwordHash);
    return;
  }
  json.jsonMigrateUserPasswordHash(id, passwordHash);
}

export async function listUsers(clinicId?: string): Promise<DemoUser[]> {
  if (clinicId) {
    if (usingPostgres()) return (await pg()).prismaListUsersForClinic(clinicId);
    return json.jsonListUsersForClinic(clinicId);
  }
  if (usingPostgres()) return (await pg()).prismaListUsers();
  return json.jsonListUsers();
}

export async function createUser(
  user: DemoUser,
  clinicId: string = DEMO_CLINIC_ID,
  role: MembershipRole = "coordinator"
): Promise<DemoUser> {
  if (usingPostgres()) {
    return (await pg()).prismaCreateUserInClinic(clinicId, user, role);
  }
  return json.jsonCreateUserInClinic(clinicId, user, role);
}

export async function deleteClinicData(
  clinicId: string
): Promise<{ deletedCases: number }> {
  if (usingPostgres()) return (await pg()).prismaDeleteClinicData(clinicId);
  return json.jsonDeleteClinicData(clinicId);
}

export async function listAuditEvents(clinicId: string, limit = 100) {
  if (usingPostgres()) return (await pg()).prismaListAuditEvents(clinicId, limit);
  return json.jsonListAuditEvents(clinicId, limit);
}

export type SubscriptionEntitlement = {
  planEntitled: boolean;
  subscriptionStatus: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

export async function getSubscriptionEntitlement(): Promise<SubscriptionEntitlement> {
  if (usingPostgres()) return (await pg()).prismaGetSubscriptionEntitlement();
  return json.jsonGetSubscriptionEntitlement();
}

export async function setSubscriptionEntitlement(
  patch: Partial<SubscriptionEntitlement>
): Promise<SubscriptionEntitlement> {
  if (usingPostgres()) return (await pg()).prismaSetSubscriptionEntitlement(patch);
  return json.jsonSetSubscriptionEntitlement(patch);
}
