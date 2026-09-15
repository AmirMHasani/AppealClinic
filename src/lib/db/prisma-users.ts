import type { DemoUser } from "@/lib/types";
import { PrismaClient } from "@prisma/client";
import { DEMO_CLINIC_ID } from "@/lib/tenancy";
import { v4 as uuid } from "uuid";

const globalForPrisma = globalThis as unknown as { __acPrisma?: PrismaClient };

function client(): PrismaClient {
  if (!globalForPrisma.__acPrisma) {
    globalForPrisma.__acPrisma = new PrismaClient();
  }
  return globalForPrisma.__acPrisma;
}

async function ensureAppMeta() {
  await client().appMeta.upsert({
    where: { id: "default" },
    create: { id: "default", seeded: false },
    update: {},
  });
}

/** @deprecated Prefer prismaListUsersForClinic — lists ALL users (legacy). */
export async function prismaListUsers(): Promise<DemoUser[]> {
  await ensureAppMeta();
  const rows = await client().user.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.passwordHash,
  }));
}

/**
 * @deprecated Prefer prismaCreateUserInClinic.
 * Creates user + Demo Clinic coordinator membership for backward compat.
 */
export async function prismaCreateUser(user: DemoUser): Promise<DemoUser> {
  await ensureAppMeta();
  const existing = await client().user.findFirst({
    where: { email: { equals: user.email, mode: "insensitive" } },
  });
  if (existing) throw new Error("DUPLICATE_EMAIL");
  // Ensure demo clinic exists for FK
  await client().clinic.upsert({
    where: { id: DEMO_CLINIC_ID },
    create: { id: DEMO_CLINIC_ID, name: "Demo Clinic" },
    update: {},
  });
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
      clinicId: DEMO_CLINIC_ID,
      role: "coordinator",
    },
  });
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.passwordHash,
  };
}

export type SubscriptionEntitlement = {
  planEntitled: boolean;
  subscriptionStatus: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

export async function prismaGetSubscriptionEntitlement(): Promise<SubscriptionEntitlement> {
  await ensureAppMeta();
  const row = await client().appMeta.findUniqueOrThrow({ where: { id: "default" } });
  return {
    planEntitled: Boolean((row as { planEntitled?: boolean }).planEntitled),
    subscriptionStatus: (row as { subscriptionStatus?: string | null }).subscriptionStatus ?? null,
    stripeCustomerId: (row as { stripeCustomerId?: string | null }).stripeCustomerId ?? null,
    stripeSubscriptionId:
      (row as { stripeSubscriptionId?: string | null }).stripeSubscriptionId ?? null,
  };
}

export async function prismaSetSubscriptionEntitlement(
  patch: Partial<SubscriptionEntitlement>
): Promise<SubscriptionEntitlement> {
  await ensureAppMeta();
  const current = await prismaGetSubscriptionEntitlement();
  const next = { ...current, ...patch };
  await client().appMeta.update({
    where: { id: "default" },
    data: {
      planEntitled: next.planEntitled,
      subscriptionStatus: next.subscriptionStatus,
      stripeCustomerId: next.stripeCustomerId,
      stripeSubscriptionId: next.stripeSubscriptionId,
      stripeUpdatedAt: new Date(),
    },
  });
  return next;
}
