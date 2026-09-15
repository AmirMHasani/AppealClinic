/**
 * Seed demo user + synthetic demo cases.
 *
 * Requires DATABASE_URL for Postgres (Prisma). Without it, seeds the local JSON store.
 *
 * Usage:
 *   bun run seed
 *   npm run seed
 *   DATABASE_URL=... npm run seed
 *
 * Demo login (synthetic only — not PHI):
 *   email: demo@appealclinic.local
 *   password: demo1234
 */
import { DEMO_CLINIC_ID, seedDemoCases, usingPostgres } from "../src/lib/db";

async function main() {
  const force = process.argv.includes("--force");
  const backend = usingPostgres() ? "prisma/postgres" : "json (data/store.json)";
  console.log(`[seed] backend=${backend} force=${force} clinic=${DEMO_CLINIC_ID}`);
  const cases = await seedDemoCases(DEMO_CLINIC_ID, force);
  console.log(`[seed] ok — ${cases.length} cases present (demo user ensured)`);
  console.log("[seed] login: demo@appealclinic.local / demo1234");
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
