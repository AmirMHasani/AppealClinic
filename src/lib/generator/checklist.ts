import type { AppealCase } from "@/lib/types";
import { INDICATIONS, PAYERS } from "@/lib/config";

export function buildChecklistAndGaps(c: AppealCase): {
  checklist: string[];
  gaps: string[];
} {
  const indication = (c.meta?.indication && INDICATIONS[c.meta.indication]) || {
    label: "the indicated condition",
    short: "unknown",
    severityFields: [] as ("bsaPercent" | "iga" | "pga" | "dlqi" | "hurleyStage")[],
  };
  const legacyMeta = c.meta as AppealCase["meta"] & { payer_id?: string; denial_type?: string };
  const payerId = c.denial?.payer_id || legacyMeta?.payer_id;
  const payer = (payerId && PAYERS[payerId]) || {
    name: "Unknown payer",
    citationSlots: [] as { id: string; title: string; url?: string; notes?: string }[],
  };
  const checklist: string[] = [
    "Signed appeal / medical necessity letter",
    "Copy of denial letter / EOB",
    `Clinical notes supporting ${indication.label} diagnosis and severity`,
    "Prior therapy documentation (dates, doses, outcomes)",
    "Relevant labs / TB / Hep B screening (if applicable to drug class)",
  ];

  if (c.denial?.auth_or_claim_number) {
    checklist.push(`Reference auth/claim # ${c.denial.auth_or_claim_number} on cover sheet`);
  }
  if (c.meta?.indication === "hidradenitis_suppurativa") {
    checklist.push("Photo documentation or procedure notes for HS lesions (if available)");
  }
  if ((c.denial?.denial_type || legacyMeta?.denial_type) === "quantity_limit") {
    checklist.push("Prescriber attestation for requested dose/quantity");
  }
  checklist.push(
    `Current ${payer.name} policy PDF (clinic to attach — re-verify linked citations before send)`
  );

  const gaps: string[] = [];
  const clinical = c.clinical ?? ({} as AppealCase["clinical"]);
  const s = clinical.disease_severity;
  const needed = indication.severityFields;
  if (!s) {
    if (needed.length) {
      gaps.push(
        `Disease severity not provided — add ${needed.join("/")} (recommended for ${indication.short})`
      );
    } else {
      gaps.push("Disease severity not provided in intake");
    }
  } else {
    for (const f of needed) {
      if (s[f] == null) {
        gaps.push(`Missing severity field: ${f} (recommended for ${indication.short})`);
      }
    }
  }
  const failed = clinical.failed_therapies ?? [];
  if (!failed.length) {
    gaps.push("No failed therapies listed — step/medical necessity appeals are weak without this");
  }
  if (!clinical.guidelines_user_paste?.trim()) {
    gaps.push("No guideline excerpt pasted — citation block will flag Citation needed");
  }
  if (!c.denial?.appeal_deadline) {
    gaps.push("Appeal deadline not entered — confirm with payer before submission");
  }
  if (!clinical.labs_imaging?.trim()) {
    gaps.push("Labs/imaging blank — add TB/HepB/baseline labs if required for this agent");
  }
  for (const slot of payer.citationSlots || []) {
    const urlEmpty = !slot.url?.trim();
    const notesPortal = (slot.notes ?? "").toLowerCase().includes("portal");
    if (urlEmpty || notesPortal) {
      gaps.push(
        urlEmpty
          ? `${payer.name} citation "${slot.id}" has no URL — fill before send`
          : `${payer.name} citation "${slot.id}" notes portal-only criteria — paste live policy text before send`
      );
    }
  }

  return { checklist, gaps };
}
