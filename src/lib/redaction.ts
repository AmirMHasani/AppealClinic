/**
 * Lightweight PHI-ish pattern scan for wizard submit.
 * Not a substitute for staff judgment — catches obvious SSN / MRN slips.
 */

import { requireRedactionCheck } from "@/lib/env";

export type RedactionHit = {
  kind: "ssn" | "mrn_label" | "dob_label" | "full_name_hint";
  message: string;
  sample?: string;
};

const SSN_PATTERN =
  /\b(?!000|666|9\d{2})\d{3}[-\s]?(?!00)\d{2}[-\s]?(?!0000)\d{4}\b/g;

/** Labels like "MRN:", "Medical Record Number", "Member ID:" followed by an identifier. */
const MRN_LABEL_PATTERN =
  /\b(?:MRN|M\.?R\.?N\.?|medical\s*record\s*(?:no\.?|number|#)?|member\s*id|patient\s*id)\s*[:#]?\s*[A-Z0-9][-A-Z0-9]{3,}\b/gi;

const DOB_LABEL_PATTERN =
  /\b(?:DOB|D\.O\.B\.|date\s*of\s*birth)\s*[:#]?\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/gi;

function collectText(value: unknown, acc: string[]): void {
  if (value == null) return;
  if (typeof value === "string") {
    acc.push(value);
    return;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    acc.push(String(value));
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectText(item, acc);
    return;
  }
  if (typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>)) {
      collectText(v, acc);
    }
  }
}

export function flattenCaseText(payload: unknown): string {
  const parts: string[] = [];
  collectText(payload, parts);
  return parts.join("\n");
}

export function scanForPhiPatterns(text: string): RedactionHit[] {
  const hits: RedactionHit[] = [];
  const seen = new Set<string>();

  for (const m of text.matchAll(SSN_PATTERN)) {
    const sample = m[0];
    const key = `ssn:${sample}`;
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push({
      kind: "ssn",
      message: "Possible SSN-like number detected. Remove before submitting.",
      sample,
    });
  }

  for (const m of text.matchAll(MRN_LABEL_PATTERN)) {
    const sample = m[0];
    const key = `mrn:${sample.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push({
      kind: "mrn_label",
      message:
        "MRN / member ID label with an identifier detected. Use an internal case ID instead.",
      sample,
    });
  }

  for (const m of text.matchAll(DOB_LABEL_PATTERN)) {
    const sample = m[0];
    const key = `dob:${sample.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push({
      kind: "dob_label",
      message: "Date-of-birth label detected. Remove DOB from free text.",
      sample,
    });
  }

  return hits;
}

export function scanCasePayload(payload: unknown): RedactionHit[] {
  return scanForPhiPatterns(flattenCaseText(payload));
}

export type RedactionEnforcement = {
  hits: RedactionHit[];
  blocked: boolean;
  /** Always true when high-confidence SSN patterns are present. */
  blockedBySsn: boolean;
  message?: string;
};

/**
 * Server-side redaction gate for create / update / generate.
 * - High-confidence SSN patterns always block (400).
 * - Any hit blocks when REQUIRE_REDACTION_CHECK=true.
 * - Otherwise returns hits as warnings (caller should surface them).
 */
export function enforceCaseRedaction(payload: unknown): RedactionEnforcement {
  const hits = scanCasePayload(payload);
  const ssnHits = hits.filter((h) => h.kind === "ssn");
  const blockedBySsn = ssnHits.length > 0;
  const requireAll = requireRedactionCheck();
  const blocked = blockedBySsn || (hits.length > 0 && requireAll);

  let message: string | undefined;
  if (blockedBySsn) {
    message =
      "High-confidence SSN pattern detected. Remove SSN-like numbers before continuing.";
  } else if (blocked) {
    message =
      "Redaction check failed — remove SSN/MRN/DOB patterns before continuing.";
  }

  return { hits, blocked, blockedBySsn, message };
}

export function redactionBlockResponse(enforcement: RedactionEnforcement) {
  return {
    error: enforcement.message || "Redaction check failed",
    redactionHits: enforcement.hits,
    blocked: true,
    blockedBySsn: enforcement.blockedBySsn,
  };
}
