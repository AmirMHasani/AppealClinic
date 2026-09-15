/**
 * Upsert demo user + default settings + AppMeta (+ optional demo cases)
 * when DATABASE_URL is set. Safe to re-run (no force-reset).
 *
 * Usage: bun run db:seed   or   npx tsx scripts/db-seed.ts
 */
import { Prisma, PrismaClient } from "@prisma/client";
import { DEMO_CASES, DEFAULT_SETTINGS, DEMO_USER } from "../src/lib/db/seed";

if (!process.env.DATABASE_URL?.trim()) {
  console.error("DATABASE_URL unset — db:seed is Postgres-only (JSON uses login seed).");
  process.exit(1);
}

const prisma = new PrismaClient();

function fromSettings(s: typeof DEFAULT_SETTINGS) {
  return {
    clinicName: s.clinic_name,
    addressLine1: s.address_line1,
    addressLine2: s.address_line2 ?? null,
    city: s.city,
    state: s.state,
    zip: s.zip,
    phone: s.phone,
    fax: s.fax ?? null,
    npi: s.npi ?? null,
    signerName: s.signer_name ?? null,
    signerCredentials: s.signer_credentials ?? null,
  };
}

async function main() {
  const includeCases = process.argv.includes("--cases");

  await prisma.user.upsert({
    where: { email: DEMO_USER.email },
    create: {
      id: DEMO_USER.id,
      email: DEMO_USER.email,
      passwordHash: DEMO_USER.passwordHash,
      name: DEMO_USER.name,
    },
    update: {
      passwordHash: DEMO_USER.passwordHash,
      name: DEMO_USER.name,
    },
  });
  console.log(`upserted user ${DEMO_USER.email}`);

  await prisma.clinicSettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...fromSettings(DEFAULT_SETTINGS) },
    update: fromSettings(DEFAULT_SETTINGS),
  });
  console.log("upserted ClinicSettings default");

  await prisma.appMeta.upsert({
    where: { id: "default" },
    create: { id: "default", seeded: false },
    update: {},
  });
  console.log("upserted AppMeta default");

  if (includeCases) {
    const now = new Date();
    for (const c of DEMO_CASES) {
      const createdAt = c.created_at ? new Date(c.created_at) : now;
      await prisma.appealCase.upsert({
        where: { id: c.id },
        create: {
          id: c.id,
          createdAt,
          updatedAt: now,
          meta: c.meta as unknown as Prisma.InputJsonValue,
          denial: c.denial as unknown as Prisma.InputJsonValue,
          clinical: c.clinical as unknown as Prisma.InputJsonValue,
          letterMarkdown: c.letter_markdown ?? null,
          checklist: (c.checklist as unknown as Prisma.InputJsonValue | undefined) ?? undefined,
          gaps: (c.gaps as unknown as Prisma.InputJsonValue | undefined) ?? undefined,
          outcome: c.outcome as unknown as Prisma.InputJsonValue,
        },
        update: {
          updatedAt: now,
          meta: c.meta as unknown as Prisma.InputJsonValue,
          denial: c.denial as unknown as Prisma.InputJsonValue,
          clinical: c.clinical as unknown as Prisma.InputJsonValue,
          letterMarkdown: c.letter_markdown ?? null,
          checklist: (c.checklist as unknown as Prisma.InputJsonValue | undefined) ?? undefined,
          gaps: (c.gaps as unknown as Prisma.InputJsonValue | undefined) ?? undefined,
          outcome: c.outcome as unknown as Prisma.InputJsonValue,
        },
      });
    }
    await prisma.appMeta.update({ where: { id: "default" }, data: { seeded: true } });
    console.log(`upserted ${DEMO_CASES.length} demo cases`);
  } else {
    console.log("skip demo cases (pass --cases to upsert)");
  }

  console.log("db:seed done");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
