import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";
import type {
  AppealCase,
  ClinicSettings,
  DemoUser,
  MembershipRole,
  Store,
} from "@/lib/types";
import { DEMO_CLINIC_ID, DEMO_CLINIC_NAME } from "@/lib/tenancy";
import { DEFAULT_SETTINGS, DEMO_USER } from "./seed";
import { DEMO_PASSWORD_HASH, isScryptHash } from "@/lib/auth/password";

export const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

export function migrateUser(u: DemoUser & { password?: string }): DemoUser {
  if (u.passwordHash && isScryptHash(u.passwordHash)) {
    return { id: u.id, email: u.email, name: u.name, passwordHash: u.passwordHash };
  }
  if (u.password === "demo1234" || (!u.passwordHash && u.email === DEMO_USER.email)) {
    return { id: u.id, email: u.email, name: u.name, passwordHash: DEMO_PASSWORD_HASH };
  }
  if (u.password && !isScryptHash(u.password)) {
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      passwordHash: u.password,
      password: u.password,
    };
  }
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    passwordHash: u.passwordHash || u.password || DEMO_PASSWORD_HASH,
  };
}

export function nowIso() {
  return new Date().toISOString();
}

export function defaultStore(): Store {
  const ts = nowIso();
  return {
    users: [DEMO_USER],
    clinics: [
      {
        id: DEMO_CLINIC_ID,
        name: DEMO_CLINIC_NAME,
        created_at: ts,
        updated_at: ts,
      },
    ],
    memberships: [
      {
        id: "mem-demo-owner",
        userId: DEMO_USER.id,
        clinicId: DEMO_CLINIC_ID,
        role: "owner",
        created_at: ts,
      },
    ],
    settingsByClinic: { [DEMO_CLINIC_ID]: { ...DEFAULT_SETTINGS } },
    cases: [],
    auditEvents: [],
    seeded: false,
  };
}

export function ensureTenancyInStore(store: Store): boolean {
  let dirty = false;
  const ts = nowIso();

  if (!store.clinics) {
    store.clinics = [];
    dirty = true;
  }
  if (!store.memberships) {
    store.memberships = [];
    dirty = true;
  }
  if (!store.settingsByClinic) {
    store.settingsByClinic = {};
    dirty = true;
  }
  if (!store.auditEvents) {
    store.auditEvents = [];
    dirty = true;
  }

  // Migrate legacy single settings → settingsByClinic
  if (store.settings && !store.settingsByClinic[DEMO_CLINIC_ID]) {
    store.settingsByClinic[DEMO_CLINIC_ID] = store.settings;
    dirty = true;
  }
  delete store.settings;

  if (!store.clinics.find((c) => c.id === DEMO_CLINIC_ID)) {
    store.clinics.push({
      id: DEMO_CLINIC_ID,
      name: DEMO_CLINIC_NAME,
      created_at: ts,
      updated_at: ts,
    });
    dirty = true;
  }

  if (!store.settingsByClinic[DEMO_CLINIC_ID]) {
    store.settingsByClinic[DEMO_CLINIC_ID] = { ...DEFAULT_SETTINGS };
    dirty = true;
  }

  // Backfill clinicId on cases
  for (const c of store.cases || []) {
    if (!c.clinicId) {
      c.clinicId = DEMO_CLINIC_ID;
      dirty = true;
    }
  }

  // Memberships for all users
  for (const u of store.users || []) {
    const existing = store.memberships.find(
      (m) => m.userId === u.id && m.clinicId === DEMO_CLINIC_ID
    );
    const role: MembershipRole =
      u.email.toLowerCase() === DEMO_USER.email.toLowerCase() ? "owner" : "coordinator";
    if (!existing) {
      store.memberships.push({
        id: `mem-${uuid().slice(0, 12)}`,
        userId: u.id,
        clinicId: DEMO_CLINIC_ID,
        role,
        created_at: ts,
      });
      dirty = true;
    } else if (role === "owner" && existing.role !== "owner") {
      existing.role = "owner";
      dirty = true;
    }
  }

  return dirty;
}

export function ensureStore(): Store {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) {
    const initial = defaultStore();
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  const raw = fs.readFileSync(STORE_PATH, "utf8");
  const parsed = JSON.parse(raw) as Store;
  let dirty = false;
  parsed.users = (parsed.users || []).map((u) => {
    const m = migrateUser(u as DemoUser & { password?: string });
    if (m.passwordHash !== (u as DemoUser).passwordHash) dirty = true;
    return m;
  });
  if (!parsed.users.length) {
    parsed.users = [DEMO_USER];
    dirty = true;
  }
  if (ensureTenancyInStore(parsed)) dirty = true;
  if (dirty) writeStore(parsed);
  return parsed;
}

export function writeStore(store: Store) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

export function jsonGetStore(): Store {
  return ensureStore();
}

export function jsonSaveStore(store: Store) {
  writeStore(store);
}

export function jsonGetMembershipForUser(
  userId: string
): { clinicId: string; role: MembershipRole; clinicName: string } | null {
  const store = ensureStore();
  const m = store.memberships.find((x) => x.userId === userId);
  if (!m) return null;
  const clinic = store.clinics.find((c) => c.id === m.clinicId);
  return {
    clinicId: m.clinicId,
    role: m.role,
    clinicName: clinic?.name ?? DEMO_CLINIC_NAME,
  };
}

export function jsonGetSettings(clinicId: string): ClinicSettings {
  const store = ensureStore();
  if (!store.settingsByClinic[clinicId]) {
    store.settingsByClinic[clinicId] = { ...DEFAULT_SETTINGS };
    writeStore(store);
  }
  return store.settingsByClinic[clinicId];
}

export function jsonUpdateSettings(
  clinicId: string,
  patch: Partial<ClinicSettings>
): ClinicSettings {
  const store = ensureStore();
  const current = store.settingsByClinic[clinicId] || { ...DEFAULT_SETTINGS };
  store.settingsByClinic[clinicId] = { ...current, ...patch };
  writeStore(store);
  return store.settingsByClinic[clinicId];
}

export function jsonListCases(clinicId: string): AppealCase[] {
  return ensureStore()
    .cases.filter((c) => c.clinicId === clinicId)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

export function jsonGetCase(clinicId: string, id: string): AppealCase | undefined {
  return ensureStore().cases.find((c) => c.id === id && c.clinicId === clinicId);
}

export function jsonCreateCase(
  clinicId: string,
  data: Omit<AppealCase, "id" | "created_at" | "updated_at" | "outcome" | "clinicId"> & {
    outcome?: AppealCase["outcome"];
  }
): AppealCase {
  const store = ensureStore();
  const now = nowIso();
  const c: AppealCase = {
    ...data,
    id: uuid(),
    clinicId,
    created_at: now,
    updated_at: now,
    outcome: data.outcome ?? { status: "draft" },
  };
  store.cases.push(c);
  writeStore(store);
  return c;
}
