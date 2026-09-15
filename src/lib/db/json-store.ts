import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";
import type {
  AppealCase,
  AuditEventRecord,
  ClinicRecord,
  DemoUser,
  MembershipRecord,
  MembershipRole,
} from "@/lib/types";
import { DEMO_CLINIC_ID } from "@/lib/tenancy";
import { DEMO_CASES, DEMO_USER } from "./seed";
import type { AuditWriteInput } from "./audit";
import { makeAuditRecord } from "./audit";
import {
  ensureStore,
  writeStore,
  nowIso,
  ensureTenancyInStore,
  jsonGetStore,
  jsonListCases,
  DATA_DIR,
} from "./json-store-tenancy";

export {
  jsonGetStore,
  jsonSaveStore,
  jsonGetMembershipForUser,
  jsonGetSettings,
  jsonUpdateSettings,
  jsonListCases,
  jsonGetCase,
  jsonCreateCase,
} from "./json-store-tenancy";

export function jsonUpdateCase(
  clinicId: string,
  id: string,
  patch: Partial<AppealCase>
): AppealCase | null {
  const store = ensureStore();
  const idx = store.cases.findIndex((c) => c.id === id && c.clinicId === clinicId);
  if (idx < 0) return null;
  const updated: AppealCase = {
    ...store.cases[idx],
    ...patch,
    id,
    clinicId,
    updated_at: nowIso(),
    outcome: patch.outcome
      ? { ...store.cases[idx].outcome, ...patch.outcome }
      : store.cases[idx].outcome,
  };
  store.cases[idx] = updated;
  writeStore(store);
  return updated;
}

export function jsonDeleteCase(clinicId: string, id: string): boolean {
  const store = ensureStore();
  const before = store.cases.length;
  store.cases = store.cases.filter((c) => !(c.id === id && c.clinicId === clinicId));
  writeStore(store);
  return store.cases.length < before;
}

export function jsonSeedDemoCases(clinicId: string, force = false): AppealCase[] {
  const store = ensureStore();
  const target = clinicId || DEMO_CLINIC_ID;
  if (store.seeded && !force) return jsonListCases(target);
  if (force) {
    store.cases = store.cases.filter(
      (c) => !(c.clinicId === target && c.id.startsWith("demo-"))
    );
  }
  const now = nowIso();
  const seeded = DEMO_CASES.map((c) => ({
    ...c,
    clinicId: target,
    created_at: c.created_at || now,
    updated_at: now,
  }));
  for (const c of seeded) {
    const i = store.cases.findIndex((x) => x.id === c.id);
    if (i >= 0) store.cases[i] = c;
    else store.cases.push(c);
  }
  store.seeded = true;
  const ui = store.users.findIndex((u) => u.id === DEMO_USER.id);
  if (ui >= 0) store.users[ui] = DEMO_USER;
  else store.users.push(DEMO_USER);
  ensureTenancyInStore(store);
  writeStore(store);
  return seeded;
}

export function jsonStatusCounts(clinicId: string) {
  const cases = jsonListCases(clinicId);
  const counts: Record<string, number> = {
    draft: 0,
    ready: 0,
    submitted: 0,
    won: 0,
    partial: 0,
    lost: 0,
    abandoned: 0,
  };
  for (const c of cases) {
    counts[c.outcome.status] = (counts[c.outcome.status] || 0) + 1;
  }
  return { total: cases.length, counts };
}

export function jsonFindUserByEmail(email: string): DemoUser | undefined {
  return jsonGetStore().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function jsonMigrateUserPasswordHash(id: string, passwordHash: string): void {
  const store = jsonGetStore();
  const u = store.users.find((x) => x.id === id);
  if (!u) return;
  u.passwordHash = passwordHash;
  delete u.password;
  writeStore(store);
}

export function jsonListUsers(): DemoUser[] {
  return jsonGetStore().users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    passwordHash: u.passwordHash,
  }));
}

export function jsonListUsersForClinic(clinicId: string): DemoUser[] {
  const store = ensureStore();
  const userIds = new Set(
    store.memberships.filter((m) => m.clinicId === clinicId).map((m) => m.userId)
  );
  return store.users
    .filter((u) => userIds.has(u.id))
    .map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      passwordHash: u.passwordHash,
    }));
}

export function jsonCreateUser(user: DemoUser): DemoUser {
  return jsonCreateUserInClinic(DEMO_CLINIC_ID, user, "coordinator");
}

export function jsonCreateUserInClinic(
  clinicId: string,
  user: DemoUser,
  role: MembershipRole = "coordinator"
): DemoUser {
  const store = ensureStore();
  const exists = store.users.some((u) => u.email.toLowerCase() === user.email.toLowerCase());
  if (exists) throw new Error("DUPLICATE_EMAIL");
  const row: DemoUser = {
    id: user.id,
    email: user.email.toLowerCase(),
    name: user.name,
    passwordHash: user.passwordHash,
  };
  store.users.push(row);
  store.memberships.push({
    id: `mem-${uuid().slice(0, 12)}`,
    userId: row.id,
    clinicId,
    role,
    created_at: nowIso(),
  });
  writeStore(store);
  return row;
}

export function jsonWriteAudit(input: AuditWriteInput): void {
  const store = ensureStore();
  const rec = makeAuditRecord(input);
  store.auditEvents.push(rec);
  // Cap audit log size in JSON path
  if (store.auditEvents.length > 2000) {
    store.auditEvents = store.auditEvents.slice(-1500);
  }
  writeStore(store);
}

export function jsonDeleteClinicData(clinicId: string): { deletedCases: number } {
  const store = ensureStore();
  const before = store.cases.length;
  store.cases = store.cases.filter((c) => c.clinicId !== clinicId);
  if (clinicId === DEMO_CLINIC_ID) store.seeded = false;
  writeStore(store);
  return { deletedCases: before - store.cases.length };
}

export function jsonListAuditEvents(clinicId: string, limit = 100): AuditEventRecord[] {
  return ensureStore()
    .auditEvents.filter((e) => e.clinicId === clinicId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

export type SubscriptionEntitlement = {
  planEntitled: boolean;
  subscriptionStatus: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

const META_PATH = path.join(DATA_DIR, "app-meta.json");

function defaultMeta(): SubscriptionEntitlement {
  return {
    planEntitled: false,
    subscriptionStatus: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
  };
}

function readMeta(): SubscriptionEntitlement {
  if (!fs.existsSync(META_PATH)) return defaultMeta();
  try {
    return { ...defaultMeta(), ...JSON.parse(fs.readFileSync(META_PATH, "utf8")) };
  } catch {
    return defaultMeta();
  }
}

function writeMeta(meta: SubscriptionEntitlement) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2));
}

export function jsonGetSubscriptionEntitlement(): SubscriptionEntitlement {
  return readMeta();
}

export function jsonSetSubscriptionEntitlement(
  patch: Partial<SubscriptionEntitlement>
): SubscriptionEntitlement {
  const next = { ...readMeta(), ...patch };
  writeMeta(next);
  return next;
}

// re-export types used elsewhere
export type { ClinicRecord, MembershipRecord };
