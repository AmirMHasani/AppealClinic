/**
 * Audit log helpers (Phase 2).
 * Actions: login, case.create, case.update, case.generate, case.export,
 * settings.update, user.create, clinic.delete_data
 */
import { v4 as uuid } from "uuid";
import type { AuditEventRecord } from "@/lib/types";

export type AuditAction =
  | "login"
  | "case.create"
  | "case.update"
  | "case.generate"
  | "case.export"
  | "settings.update"
  | "user.create"
  | "clinic.delete_data";

export type AuditWriteInput = {
  clinicId: string;
  userId?: string | null;
  action: AuditAction | string;
  entityType?: string | null;
  entityId?: string | null;
  meta?: Record<string, unknown> | null;
};

function usingPostgres(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export async function writeAudit(input: AuditWriteInput): Promise<void> {
  try {
    if (usingPostgres()) {
      const { prismaWriteAudit } = await import("./prisma-store");
      await prismaWriteAudit(input);
      return;
    }
    const { jsonWriteAudit } = await import("./json-store");
    jsonWriteAudit(input);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[audit] failed to write ${input.action}: ${message}`);
  }
}

export function makeAuditRecord(input: AuditWriteInput): AuditEventRecord {
  return {
    id: `audit-${uuid()}`,
    clinicId: input.clinicId,
    userId: input.userId ?? null,
    action: input.action,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    meta: input.meta ?? null,
    created_at: new Date().toISOString(),
  };
}
