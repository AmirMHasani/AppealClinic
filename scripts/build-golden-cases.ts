/**
 * One-shot builder: writes golden-set/cases/*.json + golden-set/cases.json (40 synthetic cases).
 * Run: bunx tsx scripts/build-golden-cases.ts
 */
import fs from "node:fs";
import path from "node:path";
import type {
  AppealCase,
  ClinicSettings,
  DenialType,
  Indication,
  PayerId,
} from "../src/lib/types";
import { drugsForIndication } from "../src/lib/config/drugs";
import { INDICATIONS } from "../src/lib/config/indications";
import { PAYERS } from "../src/lib/config/payers";
import { DENIAL_TYPES } from "../src/lib/config/denial-types";
import { DEFAULT_SETTINGS } from "../src/lib/db/seed";

export interface GoldenCaseFile {
  id: string;
  description: string;
  case: AppealCase;
  settings?: ClinicSettings;
  expected_checklist_themes: string[];
  forbidden_hallucinated_cites: string[];
  rubric_weights: Record<string, number>;
}

const OUT_DIR = path.join(process.cwd(), "golden-set", "cases");
const PAYERS_CYCLE: PayerId[] = ["uhc", "aetna", "cigna", "anthem", "humana", "ibx"];

const DENIAL_PHRASE: Record<DenialType, string> = {
  step_therapy:
    "Coverage denied: member has not completed required step therapy with preferred agents. Requested therapy does not meet step therapy requirements.",
  medical_necessity:
    "Request denied as not medically necessary. Documentation does not demonstrate that plan medical necessity criteria were met.",
  non_formulary:
    "Requested drug is non-formulary. Plan requires trial of preferred formulary alternatives before coverage of the requested agent.",
  quantity_limit:
    "Request exceeds the plan quantity / dose limit for this medication. The prescribed regimen is not approved at the requested quantity.",
};

function pad(n: number, w = 3) {
  return String(n).padStart(w, "0");
}

function failedTherapies(indication: Indication) {
  if (indication === "plaque_psoriasis") {
    return [
      {
        drug: "Topical corticosteroids / vitamin D analogs",
        class: "Topical",
        start: "2019",
        stop: "ongoing adjunct",
        reasonStopped: "Inadequate control of BSA >10%",
      },
      {
        drug: "Methotrexate",
        class: "Systemic conventional",
        start: "2022-01",
        stop: "2022-09",
        reasonStopped: "GI intolerance; LFTs elevated",
      },
      {
        drug: "Etanercept (Enbrel)",
        class: "TNF inhibitor",
        start: "2023-02",
        stop: "2023-11",
        reasonStopped: "Primary non-response",
      },
      {
        drug: "Adalimumab (Humira / biosimilar)",
        class: "TNF inhibitor",
        start: "2024-01",
        stop: "2024-10",
        reasonStopped: "Secondary loss of response",
      },
    ];
  }
  if (indication === "atopic_dermatitis") {
    return [
      {
        drug: "High-potency topical corticosteroids",
        class: "Topical",
        reasonStopped: "Inadequate for extensive disease",
      },
      {
        drug: "Tacrolimus ointment",
        class: "Topical calcineurin inhibitor",
        reasonStopped: "Burning; incomplete control",
      },
      {
        drug: "Dupilumab (Dupixent)",
        class: "IL-4Rα antagonist",
        start: "2024-03",
        stop: "2025-11",
        reasonStopped: "Ocular AE and incomplete control",
      },
      {
        drug: "Narrowband UVB",
        class: "Phototherapy",
        start: "2023",
        stop: "2023",
        reasonStopped: "Logistics / incomplete response",
      },
    ];
  }
  return [
    {
      drug: "Oral doxycycline / clindamycin-rifampin",
      class: "Antibiotics",
      start: "2022",
      stop: "2024",
      reasonStopped: "Recurrent flares despite prolonged courses",
    },
    {
      drug: "Intralesional corticosteroids / I&D",
      class: "Procedural",
      reasonStopped: "Symptom relief only",
    },
    {
      drug: "Adalimumab (Humira biosimilar)",
      class: "TNF inhibitor",
      start: "2025-01",
      stop: "2026-05",
      reasonStopped: "Partial then secondary failure; HiSCR not sustained",
    },
  ];
}

function guidelinePaste(indication: Indication): string {
  if (indication === "plaque_psoriasis") {
    return "AAD-NPF guidelines support biologic therapy for moderate-to-severe plaque psoriasis (BSA ≥10% or significant QOL impact).";
  }
  if (indication === "atopic_dermatitis") {
    return "AAD AD guidelines: systemic agents may be considered for moderate-to-severe AD inadequately controlled with topicals and/or biologics, with appropriate monitoring.";
  }
  return "Clinical practice supports biologic therapy for moderate HS after failure of conventional systemic therapy.";
}

function narrative(indication: Indication): string {
  if (indication === "plaque_psoriasis") {
    return "- Plaque psoriasis affecting scalp, elbows, knees, trunk\n- Significant QOL impact\n- No active infection; vaccines per clinic protocol";
  }
  if (indication === "atopic_dermatitis") {
    return "- Severe flexural and hand involvement\n- Nighttime scratching with excoriations\n- Shared decision for systemic therapy";
  }
  return "- Hurley stage II+ HS\n- Pain and drainage limiting work\n- Medical optimization preferred before surgery";
}

function themes(denial: DenialType, indication: Indication): string[] {
  const t = [
    "Signed appeal / medical necessity letter",
    "Copy of denial letter",
    "Clinical notes supporting diagnosis and severity",
    "Prior therapy documentation",
    "Relevant labs / TB / Hep B screening",
    "payer policy PDF",
  ];
  if (indication === "hidradenitis_suppurativa") t.push("Photo documentation or procedure notes");
  if (denial === "quantity_limit") t.push("Prescriber attestation for requested dose");
  return t;
}

/**
 * Exact mix:
 * indications: 15 PsO, 15 AD, 10 HS
 * denials: 16 step, 12 med_nec, 8 non_formulary, 4 qty
 * payers: rotate all 6 (each gets multiple)
 */
function buildPlan(): { indication: Indication; denial: DenialType; payer: PayerId }[] {
  const indications: Indication[] = [
    ...Array(15).fill("plaque_psoriasis"),
    ...Array(15).fill("atopic_dermatitis"),
    ...Array(10).fill("hidradenitis_suppurativa"),
  ] as Indication[];

  // Distribute denials evenly across the 40 slots (not blocked by indication)
  const denialPool: DenialType[] = [
    ...Array(16).fill("step_therapy"),
    ...Array(12).fill("medical_necessity"),
    ...Array(8).fill("non_formulary"),
    ...Array(4).fill("quantity_limit"),
  ] as DenialType[];

  // Round-robin pick from remaining pools so mix is interleaved
  const counts = {
    step_therapy: 16,
    medical_necessity: 12,
    non_formulary: 8,
    quantity_limit: 4,
  };
  const denialOrder: DenialType[] = [
    "step_therapy",
    "medical_necessity",
    "non_formulary",
    "step_therapy",
    "quantity_limit",
    "medical_necessity",
    "step_therapy",
    "non_formulary",
  ];
  const denials: DenialType[] = [];
  let di = 0;
  while (denials.length < 40) {
    const cand = denialOrder[di % denialOrder.length];
    di++;
    if (counts[cand] > 0) {
      counts[cand]--;
      denials.push(cand);
    }
  }

  // Ensure pool unused check
  void denialPool;

  return indications.map((indication, i) => ({
    indication,
    denial: denials[i],
    payer: PAYERS_CYCLE[i % 6],
  }));
}

function makeCase(
  index: number,
  indication: Indication,
  denial: DenialType,
  payer: PayerId,
  seqInIndication: number
): GoldenCaseFile {
  const drugs = drugsForIndication(indication);
  const drug = drugs[index % drugs.length];
  const doseIdx = denial === "quantity_limit" ? Math.min(1, drug.typicalDoses.length - 1) : 0;
  const dose = drug.typicalDoses[doseIdx] || drug.typicalDoses[0];

  const prefix =
    indication === "plaque_psoriasis" ? "PSO" : indication === "atopic_dermatitis" ? "AD" : "HS";
  const id = `SYN-${prefix}-${pad(seqInIndication)}`;

  const initials = ["A.B.", "C.D.", "E.F.", "G.H.", "I.J.", "K.L.", "M.N.", "O.P."][index % 8];
  const month = String(1 + (index % 8)).padStart(2, "0");
  const day = String(10 + (index % 18)).padStart(2, "0");
  const dDate = `2026-${month}-${day}`;

  const includeGuideline = index % 5 !== 0;
  const includeLabs = index % 7 !== 0;

  let disease_severity;
  if (indication === "plaque_psoriasis") {
    disease_severity = {
      bsaPercent: 10 + (index % 20),
      pga: 2 + (index % 3),
      dlqi: 10 + (index % 12),
      durationYears: 3 + (index % 10),
      notes: "Chronic plaque psoriasis with QOL impact",
    };
  } else if (indication === "atopic_dermatitis") {
    disease_severity = {
      bsaPercent: 15 + (index % 30),
      iga: 3 + (index % 2),
      dlqi: 12 + (index % 14),
      durationYears: 5 + (index % 10),
      notes: "Moderate-to-severe AD with sleep disruption",
    };
  } else {
    disease_severity = {
      hurleyStage: 1 + (index % 3),
      dlqi: 12 + (index % 12),
      durationYears: 2 + (index % 8),
      notes: "Recurrent abscesses and tunnels",
    };
  }

  // Avoid listing the requested drug as a "failed" therapy when it's Dupixent for AD
  let therapies = failedTherapies(indication);
  if (drug.name.includes("Dupilumab")) {
    therapies = therapies.filter((t) => !t.drug.includes("Dupilumab"));
    therapies.push({
      drug: "Tralokinumab (Adbry)",
      class: "IL-13 inhibitor",
      start: "2024-01",
      stop: "2024-12",
      reasonStopped: "Incomplete control",
    });
  }

  const appealCase: AppealCase = {
    id: `golden-${id.toLowerCase()}`,
    created_at: "2026-09-01T12:00:00.000Z",
    updated_at: "2026-09-01T12:00:00.000Z",
    meta: {
      internal_case_id: id,
      patient_initials: initials,
      indication,
      requested_drug: drug.name,
      requested_dose: dose,
      place_of_service: index % 2 === 0 ? "specialty_pharmacy" : "office",
    },
    denial: {
      payer_id: payer,
      denial_type: denial,
      denial_date: dDate,
      appeal_deadline: index % 6 === 0 ? undefined : "2027-02-28",
      auth_or_claim_number: `AUTH-SYN-${10000 + index}`,
      denial_verbatim: DENIAL_PHRASE[denial],
      carc_codes: index % 4 === 0 ? "CO-50" : "",
    },
    clinical: {
      diagnosis_icd10: [...INDICATIONS[indication].defaultIcd10],
      disease_severity,
      failed_therapies: therapies,
      contraindications_to_step:
        denial === "step_therapy" || denial === "non_formulary"
          ? "Documented failures of preferred agents; further step cycling not clinically appropriate."
          : "See prior therapy table and severity measures.",
      labs_imaging: includeLabs
        ? "Quantiferon negative. Hep B surface Ag negative. Baseline CBC/CMP WNL."
        : "",
      clinical_narrative_bullets: narrative(indication),
      guidelines_user_paste: includeGuideline ? guidelinePaste(indication) : "",
    },
    outcome: { status: "draft" },
  };

  return {
    id,
    description: `${INDICATIONS[indication].short} / ${DENIAL_TYPES[denial].label} / ${PAYERS[payer].name} / ${drug.name}`,
    case: appealCase,
    settings: DEFAULT_SETTINGS,
    expected_checklist_themes: themes(denial, indication),
    forbidden_hallucinated_cites: [
      "https://example.com/fake-policy",
      "Policy Number: FABRICATED-9999",
      "CPB-FAKE-0000",
      "http://invented-payer-policy.invalid/",
      "42 CFR §999.999",
      "NCD 999.9",
    ],
    rubric_weights: { "1": 1, "2": 1, "3": 1, "4": 1, "5": 1, "6": 1, "7": 1 },
  };
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const f of fs.readdirSync(OUT_DIR)) {
    if (f.endsWith(".json")) fs.unlinkSync(path.join(OUT_DIR, f));
  }

  const plan = buildPlan();
  const seqCounters: Record<string, number> = {
    plaque_psoriasis: 0,
    atopic_dermatitis: 0,
    hidradenitis_suppurativa: 0,
  };

  const cases: GoldenCaseFile[] = plan.map((p, i) => {
    seqCounters[p.indication]++;
    return makeCase(i, p.indication, p.denial, p.payer, seqCounters[p.indication]);
  });

  const byInd: Record<string, number> = {};
  const byDen: Record<string, number> = {};
  const byPay: Record<string, number> = {};
  for (const c of cases) {
    byInd[c.case.meta.indication] = (byInd[c.case.meta.indication] || 0) + 1;
    byDen[c.case.denial.denial_type] = (byDen[c.case.denial.denial_type] || 0) + 1;
    byPay[c.case.denial.payer_id] = (byPay[c.case.denial.payer_id] || 0) + 1;
    fs.writeFileSync(path.join(OUT_DIR, `${c.id}.json`), JSON.stringify(c, null, 2) + "\n");
  }

  fs.writeFileSync(
    path.join(process.cwd(), "golden-set", "cases.json"),
    JSON.stringify(cases, null, 2) + "\n"
  );

  console.log("Wrote", cases.length, "cases");
  console.log("by indication", byInd);
  console.log("by denial", byDen);
  console.log("by payer", byPay);
}

main();
