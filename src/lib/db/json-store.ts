import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";
import type { AppealCase, ClinicSettings, DemoUser, Store } from "@/lib/types";
import { DEMO_CASES, DEFAULT_SETTINGS, DEMO_USER } from "./seed";
import { DEMO_PASSWORD_HASH, isScryptHash } from "@/lib/auth/password";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

function migrateUser(u: DemoUser & { password?: string }): DemoUser {
  if (u.passwordHash && isScryptHash(u.passwordHash)) {
    return { id: u.id, email: u.email, name: u.name, passwordHash: u.passwordHash };
  }
  if (u.password === "demo1234" || (!u.passwordHash && u.email === DEMO_USER.email)) {
    return { id: u.id, email: u.email, name: u.name, passwordHash: DEMO_PASSWORD_HASH };
  }
  if (u.password && !isScryptHash(u.password)) {
    // leave plaintext in passwordHash temporarily; verifyCredentials will upgrade
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

function defaultStore(): Store {
  return {
    users: [DEMO_USER],
    settings: DEFAULT_SETTINGS,
    cases: [],
    seeded: false,
  };
}

function ensureStore(): Store {
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
  if (dirty) writeStore(parsed);
  return parsed;
}

function writeStore(store: Store) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

export function jsonGetStore(): Store {
  return ensureStore();
}

export function jsonSaveStore(store: Store) {
  writeStore(store);
}

export function jsonGetSettings(): ClinicSettings {
  return jsonGetStore().settings;
}

export function jsonUpdateSettings(patch: Partial<ClinicSettings>): ClinicSettings {
  const store = jsonGetStore();
  store.settings = { ...store.settings, ...patch };
  writeStore(store);
  return store.settings;
}

export function jsonListCases(): AppealCase[] {
  return jsonGetStore().cases.sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

export function jsonGetCase(id: string): AppealCase | undefined {
  return jsonGetStore().cases.find((c) => c.id === id);
}

export function jsonCreateCase(
  data: Omit<AppealCase, "id" | "created_at" | "updated_at" | "outcome"> & {
    outcome?: AppealCase["outcome"];
  }
): AppealCase {
  const store = jsonGetStore();
  const now = new Date().toISOString();
  const c: AppealCase = {
    ...data,
    id: uuid(),
    created_at: now,
    updated_at: now,
    outcome: data.outcome ?? { status: "draft" },
  };
  store.cases.push(c);
  writeStore(store);
  return c;
}

export function jsonUpdateCase(id: string, patch: Partial<AppealCase>): AppealCase | null {
  const store = jsonGetStore();
  const idx = store.cases.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  const updated: AppealCase = {
    ...store.cases[idx],
    ...patch,
    id,
    updated_at: new Date().toISOString(),
    outcome: patch.outcome
      ? { ...store.cases[idx].outcome, ...patch.outcome }
      : store.cases[idx].outcome,
  };
  store.cases[idx] = updated;
  writeStore(store);
  return updated;
}

export function jsonDeleteCase(id: string): boolean {
  const store = jsonGetStore();
  const before = store.cases.length;
  store.cases = store.cases.filter((c) => c.id !== id);
  writeStore(store);
  return store.cases.length < before;
}

export function jsonSeedDemoCases(force = false): AppealCase[] {
  const store = jsonGetStore();
  if (store.seeded && !force) return store.cases;
  if (force) {
    store.cases = store.cases.filter((c) => !c.id.startsWith("demo-"));
  }
  const now = new Date().toISOString();
  const seeded = DEMO_CASES.map((c) => ({
    ...c,
    created_at: c.created_at || now,
    updated_at: now,
  }));
  for (const c of seeded) {
    const i = store.cases.findIndex((x) => x.id === c.id);
    if (i >= 0) store.cases[i] = c;
    else store.cases.push(c);
  }
  store.seeded = true;
  // Ensure demo user hash is current
  const ui = store.users.findIndex((u) => u.id === DEMO_USER.id);
  if (ui >= 0) store.users[ui] = DEMO_USER;
  else store.users.push(DEMO_USER);
  writeStore(store);
  return seeded;
}

export function jsonStatusCounts() {
  const cases = jsonListCases();
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
  return jsonGetStore().users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
}

export function jsonMigrateUserPasswordHash(id: string, passwordHash: string): void {
  const store = jsonGetStore();
  const u = store.users.find((x) => x.id === id);
  if (!u) return;
  u.passwordHash = passwordHash;
  delete u.password;
  writeStore(store);
}
