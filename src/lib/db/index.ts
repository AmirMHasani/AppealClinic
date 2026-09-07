/**
 * Persistence facade.
 * - No DATABASE_URL → local JSON (data/store.json) — local demo + Render Free default.
 * - DATABASE_URL set → Prisma Postgres (Neon free or Render Postgres).
 */
import type { AppealCase, ClinicSettings, DemoUser, Store } from "@/lib/types";
import * as json from "./json-store";

export { DEMO_CASES, DEFAULT_SETTINGS, DEMO_USER } from "./seed";

export function usingPostgres(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

async function pg() {
  return import("./prisma-store");
}

export async function getStore(): Promise<Store> {
  if (usingPostgres()) {
    const p = await pg();
    const [settings, cases, users] = await Promise.all([
      p.prismaGetSettings(),
      p.prismaListCases(),
      // reconstruct minimal store shape for debug
      Promise.resolve([] as DemoUser[]),
    ]);
    const demo = await p.prismaFindUserByEmail("demo@appealclinic.local");
    return {
      users: demo ? [demo] : users,
      settings,
      cases,
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

export async function getSettings(): Promise<ClinicSettings> {
  if (usingPostgres()) return (await pg()).prismaGetSettings();
  return json.jsonGetSettings();
}

export async function updateSettings(
  patch: Partial<ClinicSettings>
): Promise<ClinicSettings> {
  if (usingPostgres()) return (await pg()).prismaUpdateSettings(patch);
  return json.jsonUpdateSettings(patch);
}

export async function listCases(): Promise<AppealCase[]> {
  if (usingPostgres()) return (await pg()).prismaListCases();
  return json.jsonListCases();
}

export async function getCase(id: string): Promise<AppealCase | undefined> {
  if (usingPostgres()) return (await pg()).prismaGetCase(id);
  return json.jsonGetCase(id);
}

export async function createCase(
  data: Omit<AppealCase, "id" | "created_at" | "updated_at" | "outcome"> & {
    outcome?: AppealCase["outcome"];
  }
): Promise<AppealCase> {
  if (usingPostgres()) return (await pg()).prismaCreateCase(data);
  return json.jsonCreateCase(data);
}

export async function updateCase(
  id: string,
  patch: Partial<AppealCase>
): Promise<AppealCase | null> {
  if (usingPostgres()) return (await pg()).prismaUpdateCase(id, patch);
  return json.jsonUpdateCase(id, patch);
}

export async function deleteCase(id: string): Promise<boolean> {
  if (usingPostgres()) return (await pg()).prismaDeleteCase(id);
  return json.jsonDeleteCase(id);
}

export async function seedDemoCases(force = false): Promise<AppealCase[]> {
  if (usingPostgres()) return (await pg()).prismaSeedDemoCases(force);
  return json.jsonSeedDemoCases(force);
}

export async function statusCounts() {
  if (usingPostgres()) return (await pg()).prismaStatusCounts();
  return json.jsonStatusCounts();
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
