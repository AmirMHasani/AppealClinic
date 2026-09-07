import type { AppealCase, ClinicSettings, DemoUser } from "@/lib/types";
import { DEMO_PASSWORD_HASH } from "@/lib/auth/password";

export const DEMO_USER: DemoUser = {
  id: "user-demo",
  email: "demo@appealclinic.local",
  passwordHash: DEMO_PASSWORD_HASH,
  name: "Demo Coordinator",
};

export const DEFAULT_SETTINGS: ClinicSettings = {
  clinic_name: "Riverside Dermatology (Demo)",
  address_line1: "100 Synthetic Ave, Suite 200",
  city: "Philadelphia",
  state: "PA",
  zip: "19103",
  phone: "(215) 555-0142",
  fax: "(215) 555-0143",
  npi: "1234567890",
  signer_name: "Alex Rivera, MD",
  signer_credentials: "Board-certified Dermatologist",
};

/** Three synthetic demo cases — one per indication. No real PHI. */
export const DEMO_CASES: AppealCase[] = [
  {
    id: "demo-pso-001",
    created_at: "2026-08-15T14:00:00.000Z",
    updated_at: "2026-08-15T14:00:00.000Z",
    meta: {
      internal_case_id: "SYN-PSO-001",
      patient_initials: "J.D.",
      indication: "plaque_psoriasis",
      requested_drug: "Risankizumab (Skyrizi)",
      requested_dose: "150 mg SQ at weeks 0, 4, then q12 weeks",
      place_of_service: "specialty_pharmacy",
    },
    denial: {
      payer_id: "uhc",
      denial_type: "step_therapy",
      denial_date: "2026-08-10",
      appeal_deadline: "2027-02-06",
      auth_or_claim_number: "AUTH-SYN-77821",
      denial_verbatim:
        "Coverage denied: member has not completed required step therapy with preferred IL-17 or TNF agents. Requested risankizumab does not meet step therapy requirements.",
      carc_codes: "",
    },
    clinical: {
      diagnosis_icd10: ["L40.0"],
      disease_severity: {
        bsaPercent: 18,
        pga: 3,
        dlqi: 16,
        durationYears: 8,
        notes: "Chronic plaque psoriasis with significant quality-of-life impact",
      },
      failed_therapies: [
        {
          drug: "Topical corticosteroids / vitamin D analogs",
          class: "Topical",
          start: "2018",
          stop: "ongoing adjunct",
          reasonStopped: "Inadequate control of BSA >10%",
        },
        {
          drug: "Methotrexate",
          class: "Systemic conventional",
          start: "2022-01",
          stop: "2022-08",
          reasonStopped: "GI intolerance; LFTs elevated",
        },
        {
          drug: "Etanercept (Enbrel)",
          class: "TNF inhibitor",
          start: "2023-02",
          stop: "2023-10",
          reasonStopped: "Primary non-response; PGA remained 3, BSA 15%",
        },
        {
          drug: "Secukinumab (Cosentyx)",
          class: "IL-17A inhibitor",
          start: "2024-01",
          stop: "2024-09",
          reasonStopped: "Secondary loss of response after initial partial improvement",
        },
      ],
      contraindications_to_step:
        "Further TNF cycling not appropriate given primary non-response to etanercept and secondary failure of IL-17. Patient prefers less frequent dosing.",
      labs_imaging: "Quantiferon negative (2026-07). Hep B surface Ag negative. Baseline CBC/CMP within normal limits.",
      clinical_narrative_bullets:
        "- Plaque psoriasis affecting scalp, elbows, knees, trunk\n- Prior phototherapy trial 2021 with incomplete response\n- Significant work absenteeism related to flares\n- No active infection; up to date on vaccinations per clinic protocol",
      guidelines_user_paste:
        "AAD-NPF guidelines support biologic therapy for moderate-to-severe plaque psoriasis (BSA ≥10% or significant QOL impact). IL-23 inhibitors are appropriate after failure of other systemic/biologic agents.",
    },
    outcome: { status: "ready" },
  },
  {
    id: "demo-ad-002",
    created_at: "2026-08-20T15:30:00.000Z",
    updated_at: "2026-08-20T15:30:00.000Z",
    meta: {
      internal_case_id: "SYN-AD-002",
      patient_initials: "M.K.",
      indication: "atopic_dermatitis",
      requested_drug: "Upadacitinib (Rinvoq)",
      requested_dose: "15 mg PO daily",
      place_of_service: "office",
    },
    denial: {
      payer_id: "aetna",
      denial_type: "medical_necessity",
      denial_date: "2026-08-18",
      appeal_deadline: "2027-02-14",
      auth_or_claim_number: "RX-SYN-44109",
      denial_verbatim:
        "Request for upadacitinib denied as not medically necessary. Documentation does not demonstrate failure of preferred biologic therapy (dupilumab) per plan criteria.",
    },
    clinical: {
      diagnosis_icd10: ["L20.9"],
      disease_severity: {
        bsaPercent: 35,
        iga: 4,
        dlqi: 22,
        durationYears: 12,
        notes: "Severe AD with sleep disruption",
      },
      failed_therapies: [
        {
          drug: "High-potency topical corticosteroids",
          class: "Topical",
          reasonStopped: "Inadequate for extensive disease; steroid concerns on face/folds",
        },
        {
          drug: "Tacrolimus ointment",
          class: "Topical calcineurin inhibitor",
          reasonStopped: "Burning; incomplete control",
        },
        {
          drug: "Dupilumab (Dupixent)",
          class: "IL-4Rα antagonist",
          start: "2024-06",
          stop: "2025-12",
          reasonStopped:
            "Conjunctivitis limiting continuation; residual IGA 3 and DLQI 18 despite 18 months therapy",
        },
        {
          drug: "Narrowband UVB",
          class: "Phototherapy",
          start: "2023",
          stop: "2023",
          reasonStopped: "Logistics / incomplete response",
        },
      ],
      contraindications_to_step:
        "Dupilumab tried at therapeutic duration with ocular adverse effects and incomplete disease control. Patient needs oral option with documented monitoring plan.",
      labs_imaging:
        "CBC, CMP, lipid panel baseline obtained. TB screen negative. No history of VTE. Age-appropriate cancer screening discussed.",
      clinical_narrative_bullets:
        "- Severe flexural and hand involvement\n- Nighttime scratching with excoriations\n- Prior oral prednisone bursts (avoid chronic systemic steroids)\n- Shared decision: prefer JAK after biologic intolerance/partial response",
      guidelines_user_paste:
        "AAD AD guidelines: systemic agents including JAK inhibitors may be considered for moderate-to-severe AD inadequately controlled with topicals and/or biologics, with appropriate lab monitoring.",
    },
    outcome: { status: "draft" },
  },
  {
    id: "demo-hs-003",
    created_at: "2026-09-01T12:00:00.000Z",
    updated_at: "2026-09-01T12:00:00.000Z",
    meta: {
      internal_case_id: "SYN-HS-003",
      patient_initials: "R.T.",
      indication: "hidradenitis_suppurativa",
      requested_drug: "Secukinumab (Cosentyx)",
      requested_dose: "300 mg SQ weekly x 5, then q4 weeks",
      place_of_service: "specialty_pharmacy",
    },
    denial: {
      payer_id: "ibx",
      denial_type: "non_formulary",
      denial_date: "2026-08-28",
      appeal_deadline: "2027-02-24",
      auth_or_claim_number: "PA-SYN-99201",
      denial_verbatim:
        "Secukinumab is non-formulary. Plan requires trial of preferred adalimumab (or biosimilar) for HS before coverage of non-preferred IL-17 agents.",
    },
    clinical: {
      diagnosis_icd10: ["L73.2"],
      disease_severity: {
        hurleyStage: 2,
        dlqi: 19,
        durationYears: 5,
        notes: "Bilateral axillae and inguinal involvement; recurrent abscesses",
      },
      failed_therapies: [
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
          reasonStopped: "Symptom relief only; no disease modification",
        },
        {
          drug: "Adalimumab (Humira biosimilar)",
          class: "TNF inhibitor",
          start: "2025-01",
          stop: "2026-06",
          reasonStopped:
            "Partial response then secondary failure; continued draining tunnels; HiSCR not sustained",
        },
      ],
      contraindications_to_step:
        "Preferred formulary agent adalimumab already failed after adequate trial. Requesting formulary exception for secukinumab based on HS indication and prior TNF failure.",
      labs_imaging: "TB screen negative. No active infection at injection sites planned.",
      clinical_narrative_bullets:
        "- Hurley stage II HS\n- Multiple courses of antibiotics with diminishing returns\n- Pain and drainage limiting work\n- Discussed surgery referral; medical optimization preferred first",
      guidelines_user_paste:
        "Clinical practice supports biologic therapy for moderate HS after failure of conventional systemic therapy; IL-17 agents are approved options after or instead of TNF in appropriate patients.",
    },
    outcome: {
      status: "submitted",
      submitted_at: "2026-09-02T16:00:00.000Z",
      outcome_notes: "Submitted via payer portal (outside app).",
    },
  },
];
