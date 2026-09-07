import type {
  AppealCase,
  ClinicSettings,
  CitationSlot,
} from "@/lib/types";
import { INDICATIONS, PAYERS, DENIAL_TYPES } from "@/lib/config";
import { buildChecklistAndGaps } from "./checklist";

const FOOTER =
  "Draft for clinical/billing review. Confirm payer criteria and deadlines before submission.";

function fmtDate(iso?: string) {
  if (!iso) return "[date]";
  try {
    return new Date(iso + (iso.length === 10 ? "T12:00:00" : "")).toLocaleDateString(
      "en-US",
      { year: "numeric", month: "long", day: "numeric" }
    );
  } catch {
    return iso;
  }
}

function severityLines(c: AppealCase): string[] {
  const s = c.clinical.disease_severity;
  const lines: string[] = [];
  if (s.bsaPercent != null) lines.push(`BSA involvement: approximately ${s.bsaPercent}%`);
  if (s.iga != null) lines.push(`IGA: ${s.iga}`);
  if (s.pga != null) lines.push(`PGA: ${s.pga}`);
  if (s.dlqi != null) lines.push(`DLQI: ${s.dlqi}`);
  if (s.hurleyStage != null) lines.push(`Hurley stage: ${s.hurleyStage}`);
  if (s.durationYears != null) lines.push(`Disease duration: approximately ${s.durationYears} years`);
  if (s.notes) lines.push(s.notes);
  if (lines.length === 0) {
    lines.push(
      "Severity scores were not fully provided in the case intake; please confirm BSA/IGA/PGA/DLQI/Hurley as applicable before submission."
    );
  }
  return lines;
}

function priorTherapyTable(c: AppealCase): string {
  const rows = c.clinical.failed_therapies;
  if (!rows.length) {
    return "_No prior therapies listed in intake — document failed/step agents before submission._";
  }
  const header =
    "| Drug | Class | Start | Stop | Reason stopped |\n| --- | --- | --- | --- | --- |";
  const body = rows
    .map(
      (t) =>
        `| ${t.drug} | ${t.class} | ${t.start || "—"} | ${t.stop || "—"} | ${t.reasonStopped} |`
    )
    .join("\n");
  return `${header}\n${body}`;
}

function rationaleForDenial(c: AppealCase): string {
  const type = DENIAL_TYPES[c.denial.denial_type];
  const drug = c.meta.requested_drug;
  switch (c.denial.denial_type) {
    case "step_therapy":
      return [
        `The plan denied coverage citing step therapy / fail-first requirements (${type.label}).`,
        `As documented above, the patient has already tried and failed clinically appropriate step and/or preferred agents.`,
        c.clinical.contraindications_to_step
          ? `Additional rationale regarding further step agents: ${c.clinical.contraindications_to_step}`
          : "We request that documented failures and contraindications be accepted in lieu of additional step cycling.",
        `Therefore, ${drug} is medically appropriate and should be authorized without further delay.`,
      ].join("\n\n");
    case "medical_necessity":
      return [
        `The plan asserted that ${drug} is not medically necessary.`,
        `The clinical severity measures and treatment history above demonstrate moderate-to-severe disease with inadequate response or intolerance to prior therapies.`,
        `Medical necessity is supported by diagnosis, severity, and failed treatments recorded in this appeal.`,
        c.clinical.contraindications_to_step
          ? `Further notes: ${c.clinical.contraindications_to_step}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n");
    case "non_formulary":
      return [
        `The plan classified ${drug} as non-formulary / preferred-alternate required.`,
        `We request a formulary exception. Preferred formulary alternatives have been tried and failed or are otherwise inappropriate, as listed in the prior therapy table.`,
        c.clinical.contraindications_to_step
          ? `Exception rationale: ${c.clinical.contraindications_to_step}`
          : "Continuing preferred agents is not expected to achieve disease control.",
      ].join("\n\n");
    case "quantity_limit":
      return [
        `The plan applied a quantity/dose limit that would prevent the prescribed regimen of ${drug}${
          c.meta.requested_dose ? ` (${c.meta.requested_dose})` : ""
        }.`,
        `The requested dosing is consistent with labeled use for this indication and the patient's disease severity.`,
        `We request an exception to the quantity limit so therapy can be administered as prescribed.`,
      ].join("\n\n");
    default:
      return "Please see clinical summary and prior therapy documentation in support of this request.";
  }
}

/**
 * Build citation block — FAIL CLOSED.
 * Citable when slot has non-empty url and title does not start with "[Citation needed".
 * Never invent policy numbers, URLs, or statute cites.
 */
function citationBlock(c: AppealCase): string {
  const payer = PAYERS[c.denial.payer_id];
  const lines: string[] = [];

  const slots: CitationSlot[] = payer.citationSlots || [];
  if (slots.length === 0) {
    lines.push(
      `Citation needed: ${payer.name} medical/pharmacy policy for ${c.meta.requested_drug} / ${INDICATIONS[c.meta.indication].label}`
    );
  } else {
    for (const slot of slots) {
      const titleOk =
        Boolean(slot.title?.trim()) &&
        !slot.title.trim().startsWith("[Citation needed");
      const hasUrl = Boolean(slot.url && slot.url.trim());
      if (hasUrl && titleOk) {
        lines.push(
          `- ${slot.title}${slot.section ? ` (§ ${slot.section})` : ""}${
            hasUrl ? ` — ${slot.url}` : ""
          }`
        );
      } else {
        lines.push(
          `Citation needed: ${payer.name} policy for ${c.meta.requested_drug} (${INDICATIONS[c.meta.indication].label}) — fill slot "${slot.id}" with current title/URL before submission.`
        );
      }
    }
  }

  const paste = c.clinical.guidelines_user_paste?.trim();
  if (paste) {
    lines.push("");
    lines.push("**Clinician-provided guideline excerpt (verify before submission):**");
    lines.push(`> ${paste.replace(/\n/g, "\n> ")}`);
  } else {
    lines.push("");
    lines.push(
      "Citation needed: society guideline excerpt (AAD/NPF or other) — paste approved text in the wizard or attach PDF."
    );
  }

  return lines.join("\n");
}

function specificAsk(c: AppealCase): string {
  const drug = c.meta.requested_drug;
  const dose = c.meta.requested_dose ? ` at ${c.meta.requested_dose}` : "";
  switch (c.denial.denial_type) {
    case "step_therapy":
      return `We respectfully request that you overturn this denial and authorize ${drug}${dose} for the treatment of ${INDICATIONS[c.meta.indication].label}, accepting documented prior therapy failures in satisfaction of step therapy requirements.`;
    case "medical_necessity":
      return `We respectfully request that you reverse the medical-necessity denial and approve coverage for ${drug}${dose}.`;
    case "non_formulary":
      return `We respectfully request a formulary exception authorizing ${drug}${dose} for this member.`;
    case "quantity_limit":
      return `We respectfully request a quantity-limit exception so that ${drug}${dose} may be dispensed and administered as prescribed.`;
    default:
      return `We respectfully request approval of ${drug}${dose}.`;
  }
}

function letterhead(settings: ClinicSettings): string {
  const lines = [
    `**${settings.clinic_name}**`,
    settings.address_line1,
    settings.address_line2,
    `${settings.city}, ${settings.state} ${settings.zip}`,
    `Phone: ${settings.phone}${settings.fax ? ` | Fax: ${settings.fax}` : ""}`,
    settings.npi ? `Clinic NPI: ${settings.npi}` : "",
  ].filter(Boolean);
  return lines.join("  \n");
}

/**
 * Deterministic template/rules engine.
 * Optional OpenAI polish if OPENAI_API_KEY is set — never required.
 */
export async function generateAppeal(
  c: AppealCase,
  settings: ClinicSettings
): Promise<{ letter_markdown: string; checklist: string[]; gaps: string[] }> {
  const payer = PAYERS[c.denial.payer_id];
  const indication = INDICATIONS[c.meta.indication];
  const { checklist, gaps } = buildChecklistAndGaps(c);

  const reParts = [
    c.meta.patient_initials ? `Member: ${c.meta.patient_initials}` : null,
    `Internal case: ${c.meta.internal_case_id}`,
    c.denial.auth_or_claim_number
      ? `Auth/Claim #: ${c.denial.auth_or_claim_number}`
      : null,
    `Drug: ${c.meta.requested_drug}`,
    `Indication: ${indication.label}`,
    `Denial date: ${fmtDate(c.denial.denial_date)}`,
  ].filter(Boolean);

  const narrative = c.clinical.clinical_narrative_bullets
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => (l.startsWith("-") ? l : `- ${l}`))
    .join("\n");

  let letter = `${letterhead(settings)}

${fmtDate(new Date().toISOString().slice(0, 10))}

${payer.addressBlock}

**RE:** ${reParts.join(" | ")}

Dear Appeals Reviewer:

## Request for reconsideration

On behalf of our patient, we request reconsideration and overturn of the ${DENIAL_TYPES[c.denial.denial_type].label.toLowerCase()} denial issued by ${payer.name} on ${fmtDate(c.denial.denial_date)} regarding ${c.meta.requested_drug} for ${indication.label}.

**Denial language (as provided):**  
> ${c.denial.denial_verbatim.replace(/\n/g, "\n> ")}

${c.denial.carc_codes ? `**CARC/RARC (if applicable):** ${c.denial.carc_codes}\n` : ""}${
    c.denial.appeal_deadline
      ? `**Appeal deadline on file (confirm with payer):** ${fmtDate(c.denial.appeal_deadline)}\n`
      : ""
  }

## Clinical summary

- **Diagnosis (ICD-10):** ${c.clinical.diagnosis_icd10.join(", ") || "[not provided]"}
- **Requested therapy:** ${c.meta.requested_drug}${c.meta.requested_dose ? ` — ${c.meta.requested_dose}` : ""}
- **Place of service:** ${c.meta.place_of_service || "not specified"}

**Disease severity / burden:**
${severityLines(c)
  .map((l) => `- ${l}`)
  .join("\n")}

**Clinical narrative (from intake):**
${narrative || "- [No narrative bullets provided]"}

${c.clinical.labs_imaging ? `**Relevant labs / screening:**  \n${c.clinical.labs_imaging}\n` : ""}

## Prior therapy / step history

${priorTherapyTable(c)}

## Rationale addressing the denial

${rationaleForDenial(c)}

## Guideline / policy anchors

${citationBlock(c)}

## Specific ask

${specificAsk(c)}

Please contact our office at ${settings.phone} if additional records are required. Thank you for your prompt review.

Sincerely,

${settings.signer_name || "[Provider name]"}  
${settings.signer_credentials || ""}  
${settings.clinic_name}  
${settings.npi ? `NPI: ${settings.npi}` : ""}

---

### Attachments checklist (include with submission)
${checklist.map((item) => `- [ ] ${item}`).join("\n")}

---

*${FOOTER}*
`;

  // Optional OpenAI polish — never required for demo
  if (process.env.OPENAI_API_KEY) {
    try {
      letter = await optionalPolish(letter);
    } catch {
      // keep deterministic letter
    }
  }

  return { letter_markdown: letter, checklist, gaps };
}

async function optionalPolish(letter: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return letter;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You lightly polish medical appeal letter markdown for clarity. Do NOT add clinical facts, drug claims, or citations that are not already in the letter. Keep the footer unchanged. Return markdown only.",
        },
        { role: "user", content: letter },
      ],
    }),
  });
  if (!res.ok) return letter;
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() || letter;
}

export { FOOTER };
