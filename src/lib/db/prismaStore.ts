/** Adapter: unprefixed names over prisma-store.ts (clinic-scoped). */
import type { AppealCase, ClinicSettings, DemoUser, Store } from "@/lib/types";
import { DEMO_CLINIC_ID } from "@/lib/tenancy";
import { DEMO_USER } from "./seed";
import * as p from "./prisma-store";

export const getSettings = (clinicId: string) => p.prismaGetSettings(clinicId);
export const updateSettings = (clinicId: string, patch: Partial<ClinicSettings>) =>
  p.prismaUpdateSettings(clinicId, patch);
export const listCases = (clinicId: string) => p.prismaListCases(clinicId);
export const getCase = (clinicId: string, id: string) => p.prismaGetCase(clinicId, id);
export const createCase = (
  clinicId: string,
  data: Parameters<typeof p.prismaCreateCase>[1]
) => p.prismaCreateCase(clinicId, data);
export const updateCase = (clinicId: string, id: string, patch: Partial<AppealCase>) =>
  p.prismaUpdateCase(clinicId, id, patch);
export const deleteCase = (clinicId: string, id: string) => p.prismaDeleteCase(clinicId, id);
export const seedDemoCases = (clinicId = DEMO_CLINIC_ID, force = false) =>
  p.prismaSeedDemoCases(clinicId, force);
export const statusCounts = (clinicId: string) => p.prismaStatusCounts(clinicId);
export const findUserByEmail = p.prismaFindUserByEmail;
export const migrateUserPasswordHash = p.prismaMigrateUserPasswordHash;

export async function getStore(): Promise<Store> {
  const [settings, cases, demo] = await Promise.all([
    p.prismaGetSettings(DEMO_CLINIC_ID),
    p.prismaListCases(DEMO_CLINIC_ID),
    p.prismaFindUserByEmail(DEMO_USER.email),
  ]);
  return {
    users: demo ? [demo] : [DEMO_USER],
    clinics: [],
    memberships: [],
    settingsByClinic: { [DEMO_CLINIC_ID]: settings },
    cases,
    auditEvents: [],
    seeded: cases.some((c) => c.id.startsWith("demo-")),
  };
}
