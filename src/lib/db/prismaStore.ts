/** Adapter: unprefixed names over prisma-store.ts */
import type { AppealCase, ClinicSettings, DemoUser, Store } from "@/lib/types";
import { DEMO_USER } from "./seed";
import * as p from "./prisma-store";

export const getSettings = p.prismaGetSettings;
export const updateSettings = p.prismaUpdateSettings;
export const listCases = p.prismaListCases;
export const getCase = p.prismaGetCase;
export const createCase = p.prismaCreateCase;
export const updateCase = p.prismaUpdateCase;
export const deleteCase = p.prismaDeleteCase;
export const seedDemoCases = p.prismaSeedDemoCases;
export const statusCounts = p.prismaStatusCounts;
export const findUserByEmail = p.prismaFindUserByEmail;
export const migrateUserPasswordHash = p.prismaMigrateUserPasswordHash;

export async function getStore(): Promise<Store> {
  const [settings, cases, demo] = await Promise.all([
    p.prismaGetSettings(),
    p.prismaListCases(),
    p.prismaFindUserByEmail(DEMO_USER.email),
  ]);
  return {
    users: demo ? [demo] : [DEMO_USER],
    settings,
    cases,
    seeded: cases.some((c) => c.id.startsWith("demo-")),
  };
}
