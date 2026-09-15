import { Prisma } from "@prisma/client";
import { v4 as uuid } from "uuid";
import type { AppealCase, DemoUser, MembershipRole } from "@/lib/types";
import { DEMO_CLINIC_ID } from "@/lib/tenancy";
import { DEMO_CASES, DEMO_USER } from "./seed";
import type { AuditWriteInput } from "./audit";
import { makeAuditRecord } from "./audit";
import {
  client,
  toCase,
  ensureTenancy,
  prismaListCases,
} from "./prisma-store-core";

export {
  ensureTenancy,
  prismaGetMembershipForUser,
  prismaGetSettings,
  prismaUpdateSettings,
  prismaListCases,
  prismaGetCase,
  prismaCreateCase,
} from "./prisma-store-core";

export async function prismaUpdateCase(
  clinicId: string,
  id: string,
  patch: Partial<AppealCase>
): Promise<AppealCase | null> {
  await ensureTenancy();
  const existing = await client().appealCase.findFirst({ where: { id, clinicId } });
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
      checklist: (patch.checklist !== undefined
        ? patch.checklist ?? undefined
        : existing.checklist ?? undefined) as unknown as Prisma.InputJsonValue | undefined,
      gaps: (patch.gaps !== undefined
        ? patch.gaps ?? undefined
        : existing.gaps ?? undefined) as unknown as Prisma.InputJsonValue | undefined,
      outcome: outcome as unknown as Prisma.InputJsonValue,
    },
  });
  return toCase(row);
}

export async function prismaDeleteCase(clinicId: string, id: string): Promise<boolean> {
  await ensureTenancy();
  const existing = await client().appealCase.findFirst({ where: { id, clinicId } });
  if (!existing) return false;
  try {
    await client().appealCase.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function prismaSeedDemoCases(
  clinicId: string,
  force = false
): Promise<AppealCase[]> {
  await ensureTenancy();
  const prisma = client();
  // Only seed demo cases into the Demo Clinic
  const targetClinic = clinicId || DEMO_CLINIC_ID;
  const meta = await prisma.appMeta.findUniqueOrThrow({ where: { id: "default" } });
  if (meta.seeded && !force) {
    return prismaListCases(targetClinic);
  }
  if (force) {
    await prisma.appealCase.deleteMany({
      where: { clinicId: targetClinic, id: { startsWith: "demo-" } },
    });
  }
  const now = new Date();
  const seeded: AppealCase[] = [];
  for (const c of DEMO_CASES) {
    const createdAt = c.created_at ? new Date(c.created_at) : now;
    const row = await prisma.appealCase.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        clinicId: targetClinic,
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
        clinicId: targetClinic,
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

export async function prismaStatusCounts(clinicId: string) {
  const cases = await prismaListCases(clinicId);
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
  await ensureTenancy();
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

export async function prismaWriteAudit(input: AuditWriteInput): Promise<void> {
  await ensureTenancy();
  const rec = makeAuditRecord(input);
  await client().auditEvent.create({
    data: {
      id: rec.id,
      clinicId: rec.clinicId,
      userId: rec.userId ?? null,
      action: rec.action,
      entityType: rec.entityType ?? null,
      entityId: rec.entityId ?? null,
      meta: (rec.meta as Prisma.InputJsonValue) ?? undefined,
      createdAt: new Date(rec.created_at),
    },
  });
}

export async function prismaListUsersForClinic(clinicId: string): Promise<DemoUser[]> {
  await ensureTenancy();
  const memberships = await client().membership.findMany({
    where: { clinicId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
  return memberships.map((m) => ({
    id: m.user.id,
    email: m.user.email,
    name: m.user.name,
    passwordHash: m.user.passwordHash,
  }));
}

export async function prismaCreateUserInClinic(
  clinicId: string,
  user: DemoUser,
  role: MembershipRole = "coordinator"
): Promise<DemoUser> {
  await ensureTenancy();
  const existing = await client().user.findFirst({
    where: { email: { equals: user.email, mode: "insensitive" } },
  });
  if (existing) throw new Error("DUPLICATE_EMAIL");
  const row = await client().user.create({
    data: {
      id: user.id,
      email: user.email.toLowerCase(),
      name: user.name,
      passwordHash: user.passwordHash,
    },
  });
  await client().membership.create({
    data: {
      id: `mem-${uuid().slice(0, 12)}`,
      userId: row.id,
      clinicId,
      role,
    },
  });
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.passwordHash,
  };
}

export async function prismaDeleteClinicData(
  clinicId: string
): Promise<{ deletedCases: number }> {
  await ensureTenancy();
  const result = await client().appealCase.deleteMany({ where: { clinicId } });
  // Reset seeded flag if wiping demo clinic cases
  if (clinicId === DEMO_CLINIC_ID) {
    await client().appMeta.update({
      where: { id: "default" },
      data: { seeded: false },
    });
  }
  return { deletedCases: result.count };
}

export async function prismaListAuditEvents(
  clinicId: string,
  limit = 100
): Promise<
  Array<{
    id: string;
    clinicId: string;
    userId: string | null;
    action: string;
    entityType: string | null;
    entityId: string | null;
    meta: unknown;
    createdAt: string;
  }>
> {
  await ensureTenancy();
  const rows = await client().auditEvent.findMany({
    where: { clinicId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id,
    clinicId: r.clinicId,
    userId: r.userId,
    action: r.action,
    entityType: r.entityType,
    entityId: r.entityId,
    meta: r.meta,
    createdAt: r.createdAt.toISOString(),
  }));
}

export {
  prismaListUsers,
  prismaCreateUser,
  prismaGetSubscriptionEntitlement,
  prismaSetSubscriptionEntitlement,
} from "./prisma-users";
export type { SubscriptionEntitlement } from "./prisma-users";
