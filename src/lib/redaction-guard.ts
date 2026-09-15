import { NextResponse } from "next/server";
import {
  isPhiMode,
  phiForbiddenPayload,
  requestDeclaresPhiIntent,
  requireRedactionCheck,
} from "@/lib/env";
import type { RedactionHit } from "@/lib/redaction";
import { scanCasePayload } from "@/lib/redaction";

export type RedactionDecision = {
  hits: RedactionHit[];
  blocked: boolean;
  softWarn: boolean;
};

/**
 * Always compute hits.
 * - SSN hits: always hard-block (400)
 * - Other kinds: hard-block when REQUIRE_REDACTION_CHECK is on (default true);
 *   soft-warn when explicitly disabled
 */
export function decideRedaction(payload: unknown): RedactionDecision {
  const hits = scanCasePayload(payload);
  if (hits.length === 0) {
    return { hits, blocked: false, softWarn: false };
  }
  const hasSsn = hits.some((h) => h.kind === "ssn");
  if (hasSsn) {
    return { hits, blocked: true, softWarn: false };
  }
  if (requireRedactionCheck()) {
    return { hits, blocked: true, softWarn: false };
  }
  return { hits, blocked: false, softWarn: true };
}

export function redactionBlockedResponse(hits: RedactionHit[]) {
  return NextResponse.json(
    {
      error:
        "Redaction check failed — remove SSN/MRN/DOB patterns before saving.",
      hits,
      redactionHits: hits,
      blocked: true,
    },
    { status: 400 }
  );
}

/**
 * If the client opts into a PHI workflow (header or body intent) while
 * APP_MODE !== phi, return HTTP 403. Demo/synthetic create/update/generate
 * without PHI intent continues to work.
 */
export function refusePhiWorkflowIfNeeded(
  req: Request,
  body?: unknown
): NextResponse | null {
  if (!requestDeclaresPhiIntent(req, body)) return null;
  if (isPhiMode()) return null;
  return NextResponse.json(phiForbiddenPayload(), { status: 403 });
}
