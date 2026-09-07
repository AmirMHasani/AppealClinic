import { Prisma, PrismaClient } from "@prisma/client";
import { v4 as uuid } from "uuid";
import type {
  AppealCase,
  CaseMeta,
  CaseOutcome,
  ClinicalEvidence,
  ClinicSettings,
  DemoUser,
  DenialDetails,
} from "@/lib/types";
import { DEMO_CASES, DEFAULT_SETTINGS, DEMO_USER } from "./seed";

const globalForPrisma = globalThis as unknown as { __acPrisma?: PrismaClient };

function client(): PrismaClient {
  if (!globalForPrisma.__acPrisma) {
    globalForPrisma.__acPrisma = new PrismaClient();
  }
  return globalForPrisma.__acPrisma;
}

function toSettings(row: {
  clinicName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  zip: string;
  phone: string;
  fax: string | null;
  npi: string | null;
  signerName: string | null;
  signerCredentials: string | null;
}): ClinicSettings {
  return {
    clinic_name: row.clinicName,
    address_line1: row.addressLine1,
    address_line2: row.addressLine2 ?? undefined,
    city: row.city,
    state: row.state,
    zip: row.zip,
    phone: row.phone,
    fax: row.fax ?? undefined,
    npi: row.npi ?? undefined,
    signer_name: row.signerName ?? undefined,
    signer_credentials: row.signerCredentials ?? undefined,
  };
}

function fromSettings(s: ClinicSettings) {
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

function toCase(row: {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  meta: unknown;
  denial: unknown;
  clinical: unknown;
  letterMarkdown: string | null;
  checklist: unknown;
  gaps: unknown;
  outcome: unknown;
}): AppealCase {
  return {
    id: row.id,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    meta: row.meta as CaseMeta,
    denial: row.denial as DenialDetails,
    clinical: row.clinical as ClinicalEvidence,
    letter_markdown: row.letterMarkdown ?? undefined,
    checklist: (row.checklist as string[] | null) ?? undefined,
    gaps: (row.gaps as string[] | null) ?? undefined,
    outcome: row.outcome as CaseOutcome,
  };
}

async function ensureDefaults() {
  const prisma = client();
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    await prisma.user.create({
      data: {
        id: DEMO_USER.id,
        email: DEMO_USER.email,
        passwordHash: DEMO_USER.passwordHash,
        name: DEMO_USER.name,
      },
    });
  }
  const settings = await prisma.clinicSettings.findUnique({ where: { id: "default" } });
  if (!settings) {
    await prisma.clinicSettings.create({
      data: { id: "default", ...fromSettings(DEFAULT_SETTINGS) },
    });
  }
  const meta = await prisma.appMeta.findUnique({ where: { id: "default" } });
  if (!meta) {
    await prisma.appMeta.create({ data: { id: "default", seeded: false } });
  }
}

export async function prismaGetSettings(): Promise<ClinicSettings> {
  await ensureDefaults();
  const row = await client().clinicSettings.findUniqueOrThrow({ where: { id: "default" } });
  return toSettings(row);
}

export async function prismaUpdateSettings(
  patch: Partial<ClinicSettings>
): Promise<ClinicSettings> {
  await ensureDefaults();
  const current = await prismaGetSettings();
  const next = { ...current, ...patch };
  const row = await client().clinicSettings.update({
    where: { id: "default" },
    data: fromSettings(next),
  });
  return toSettings(row);
}

export async function prismaListCases(): Promise<AppealCase[]> {
  await ensureDefaults();
  const rows = await client().appealCase.findMany({ orderBy: { updatedAt: "desc" } });
  return rows.map(toCase);
}

export async function prismaGetCase(id: string): Promise<AppealCase | undefined> {
  await ensureDefaults();
  const row = await client().appealCase.findUnique({ where: { id } });
  return row ? toCase(row) : undefined;
}

export async function prismaCreateCase(
  data: Omit<AppealCase, "id" | "created_at" | "updated_at" | "outcome"> & {
    outcome?: AppealCase["outcome"];
  }
): Promise<AppealCase> {
  await ensureDefaults();
  const now = new Date();
  const id = uuid();
  const outcome = data.outcome ?? { status: "draft" as const };
  const row = await client().appealCase.create({
    data: {
      id,
      createdAt: now,
      updatedAt: now,
      meta: data.meta as unknown as Prisma.InputJsonValue,
      denial: data.denial as unknown as Prisma.InputJsonValue,
      clinical: data.clinical as unknown as Prisma.InputJsonValue,
      letterMarkdown: data.letter_markdown ?? null,
      checklist: (data.checklist as unknown as Prisma.InputJsonValue | undefined) ?? undefined,
      gaps: (data.gaps as unknown as Prisma.InputJsonValue | undefined) ?? undefined,
      outcome: outcome as unknown as Prisma.InputJsonValue,
    },
  });
  return toCase(row);
}

export async function prismaUpdateCase(
  id: string,
  patch: Partial<AppealCase>
): Promise<AppealCase | null> {
  await ensureDefaults();
  const existing = await client().appealCase.findUnique({ where: { id } });
  if (!existing) return null;
  const current = toCase(existing);
  const outcome = patch.outcome
    ? { ...current.outcome, ...patch.outcome }
    : current.outcome;
  const row = await client().appealCase.update({
    where: { id },
    data: {
      updatedAt: new Date(),
      meta: (patch.meta ?? current.meta) as unknown as Prisma.InputJsonValue,
      denial: (patch.denial ?? current.denial) as unknown as Prisma.InputJsonValue,
      clinical: (patch.clinical ?? current.clinical) as unknown as Prisma.InputJsonValue,
      letterMarkdown:
        patch.letter_markdown !== undefined
          ? patch.letter_markdown ?? null
          : existing.letterMarkdown,
      checklist: (patch.checklist !== undefined ? patch.checklist ?? undefined : existing.checklist ?? undefined) as unknown as Prisma.InputJsonValue | undefined,
      gaps: (patch.gaps !== undefined ? patch.gaps ?? undefined : existing.gaps ?? undefined) as unknown as Prisma.InputJsonValue | undefined,
      outcome: outcome as unknown as Prisma.InputJsonValue,
    },
  });
  return toCase(row);
}

export async function prismaDeleteCase(id: string): Promise<boolean> {
  await ensureDefaults();
  try {
    await client().appealCase.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function prismaSeedDemoCases(force = false): Promise<AppealCase[]> {
  await ensureDefaults();
  const prisma = client();
  const meta = await prisma.appMeta.findUniqueOrThrow({ where: { id: "default" } });
  if (meta.seeded && !force) {
    return prismaListCases();
  }
  if (force) {
    await prisma.appealCase.deleteMany({ where: { id: { startsWith: "demo-" } } });
  }
  const now = new Date();
  const seeded: AppealCase[] = [];
  for (const c of DEMO_CASES) {
    const createdAt = c.created_at ? new Date(c.created_at) : now;
    const row = await prisma.appealCase.upsert({
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
    seeded.push(toCase(row));
  }
  await prisma.appMeta.update({ where: { id: "default" }, data: { seeded: true } });
  await prisma.user.upsert({
    where: { id: DEMO_USER.id },
    create: {
      id: DEMO_USER.id,
      email: DEMO_USER.email,
      passwordHash: DEMO_USER.passwordHash,
      name: DEMO_USER.name,
    },
    update: {
      passwordHash: DEMO_USER.passwordHash,
      name: DEMO_USER.name,
      email: DEMO_USER.email,
    },
  });
  return seeded;
}

export async function prismaStatusCounts() {
  const cases = await prismaListCases();
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

export async function prismaFindUserByEmail(email: string): Promise<DemoUser | undefined> {
  await ensureDefaults();
  const row = await client().user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (!row) return undefined;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.passwordHash,
  };
}

export async function prismaMigrateUserPasswordHash(
  id: string,
  passwordHash: string
): Promise<void> {
  await client().user.update({ where: { id }, data: { passwordHash } });
}
