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
  MembershipRole,
} from "@/lib/types";
import { DEMO_CLINIC_ID, DEMO_CLINIC_NAME } from "@/lib/tenancy";
import { DEMO_CASES, DEFAULT_SETTINGS, DEMO_USER } from "./seed";
import type { AuditWriteInput } from "./audit";
import { makeAuditRecord } from "./audit";

const globalForPrisma = globalThis as unknown as { __acPrisma?: PrismaClient };

export function client(): PrismaClient {
  if (!globalForPrisma.__acPrisma) {
    globalForPrisma.__acPrisma = new PrismaClient();
  }
  return globalForPrisma.__acPrisma;
}

export function toSettings(row: {
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

export function fromSettings(s: ClinicSettings) {
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

export function toCase(row: {
  id: string;
  clinicId: string;
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
    clinicId: row.clinicId,
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

/**
 * Bootstrap Demo Clinic, migrate legacy "default" settings, attach users,
 * and backfill cases to clinic-demo. Safe to call on every store read.
 */
export async function ensureTenancy(): Promise<void> {
  const prisma = client();

  await prisma.clinic.upsert({
    where: { id: DEMO_CLINIC_ID },
    create: { id: DEMO_CLINIC_ID, name: DEMO_CLINIC_NAME },
    update: { name: DEMO_CLINIC_NAME },
  });

  // Ensure demo user exists
  const existingByEmail = await prisma.user.findUnique({
    where: { email: DEMO_USER.email },
  });
  if (!existingByEmail) {
    await prisma.user.upsert({
      where: { id: DEMO_USER.id },
      create: {
        id: DEMO_USER.id,
        email: DEMO_USER.email,
        passwordHash: DEMO_USER.passwordHash,
        name: DEMO_USER.name,
      },
      update: {
        email: DEMO_USER.email,
        passwordHash: DEMO_USER.passwordHash,
        name: DEMO_USER.name,
      },
    });
  } else {
    await prisma.user.update({
      where: { email: DEMO_USER.email },
      data: {
        passwordHash: DEMO_USER.passwordHash,
        name: DEMO_USER.name,
      },
    });
  }

  // Migrate legacy ClinicSettings id "default" → clinic-demo
  const legacy = await prisma.clinicSettings.findUnique({ where: { id: "default" } });
  const demoSettings = await prisma.clinicSettings.findUnique({
    where: { id: DEMO_CLINIC_ID },
  });
  if (legacy && !demoSettings) {
    await prisma.clinicSettings.create({
      data: {
        id: DEMO_CLINIC_ID,
        clinicId: DEMO_CLINIC_ID,
        clinicName: legacy.clinicName,
        addressLine1: legacy.addressLine1,
        addressLine2: legacy.addressLine2,
        city: legacy.city,
        state: legacy.state,
        zip: legacy.zip,
        phone: legacy.phone,
        fax: legacy.fax,
        npi: legacy.npi,
        signerName: legacy.signerName,
        signerCredentials: legacy.signerCredentials,
      },
    });
    await prisma.clinicSettings.delete({ where: { id: "default" } }).catch(() => undefined);
  } else if (legacy && demoSettings) {
    await prisma.clinicSettings.delete({ where: { id: "default" } }).catch(() => undefined);
  }

  await prisma.clinicSettings.upsert({
    where: { id: DEMO_CLINIC_ID },
    create: {
      id: DEMO_CLINIC_ID,
      clinicId: DEMO_CLINIC_ID,
      ...fromSettings(DEFAULT_SETTINGS),
    },
    update: {},
  });

  await prisma.appMeta.upsert({
    where: { id: "default" },
    create: { id: "default", seeded: false },
    update: {},
  });

  // Backfill cases missing clinicId (default column handles new; update any null-ish)
  await prisma.appealCase.updateMany({
    where: { clinicId: "" },
    data: { clinicId: DEMO_CLINIC_ID },
  });

  // Memberships: demo user = owner; all other users = coordinator of Demo Clinic
  const users = await prisma.user.findMany();
  for (const u of users) {
    const role: MembershipRole =
      u.email.toLowerCase() === DEMO_USER.email.toLowerCase() ? "owner" : "coordinator";
    const existing = await prisma.membership.findUnique({
      where: {
        userId_clinicId: { userId: u.id, clinicId: DEMO_CLINIC_ID },
      },
    });
    if (!existing) {
      await prisma.membership.create({
        data: {
          id: `mem-${uuid().slice(0, 12)}`,
          userId: u.id,
          clinicId: DEMO_CLINIC_ID,
          role,
        },
      });
    } else if (
      u.email.toLowerCase() === DEMO_USER.email.toLowerCase() &&
      existing.role !== "owner"
    ) {
      await prisma.membership.update({
        where: { id: existing.id },
        data: { role: "owner" },
      });
    }
  }
}

/** @deprecated use ensureTenancy */
async function ensureDefaults() {
  await ensureTenancy();
}

export async function prismaGetMembershipForUser(
  userId: string
): Promise<{ clinicId: string; role: MembershipRole; clinicName: string } | null> {
  await ensureTenancy();
  const m = await client().membership.findFirst({
    where: { userId },
    include: { clinic: true },
    orderBy: { createdAt: "asc" },
  });
  if (!m) return null;
  return {
    clinicId: m.clinicId,
    role: m.role as MembershipRole,
    clinicName: m.clinic.name,
  };
}

export async function prismaGetSettings(clinicId: string): Promise<ClinicSettings> {
  await ensureTenancy();
  const row = await client().clinicSettings.findUnique({ where: { id: clinicId } });
  if (!row) {
    const created = await client().clinicSettings.create({
      data: {
        id: clinicId,
        clinicId,
        ...fromSettings(DEFAULT_SETTINGS),
      },
    });
    return toSettings(created);
  }
  return toSettings(row);
}

export async function prismaUpdateSettings(
  clinicId: string,
  patch: Partial<ClinicSettings>
): Promise<ClinicSettings> {
  await ensureTenancy();
  const current = await prismaGetSettings(clinicId);
  const next = { ...current, ...patch };
  const row = await client().clinicSettings.update({
    where: { id: clinicId },
    data: fromSettings(next),
  });
  return toSettings(row);
}

export async function prismaListCases(clinicId: string): Promise<AppealCase[]> {
  await ensureTenancy();
  const rows = await client().appealCase.findMany({
    where: { clinicId },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(toCase);
}

export async function prismaGetCase(
  clinicId: string,
  id: string
): Promise<AppealCase | undefined> {
  await ensureTenancy();
  const row = await client().appealCase.findFirst({ where: { id, clinicId } });
  return row ? toCase(row) : undefined;
}

export async function prismaCreateCase(
  clinicId: string,
  data: Omit<AppealCase, "id" | "created_at" | "updated_at" | "outcome" | "clinicId"> & {
    outcome?: AppealCase["outcome"];
  }
): Promise<AppealCase> {
  await ensureTenancy();
  const now = new Date();
  const id = uuid();
  const outcome = data.outcome ?? { status: "draft" as const };
  const row = await client().appealCase.create({
    data: {
      id,
      clinicId,
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
