/** Payer packs with publicly sourced policy citations. Access dates in slot notes (through 2026-09-15). Policies change — clinics must re-verify before submission. */
import type { CitationSlot, PayerId } from "@/lib/types";

export interface PayerPack {
  id: PayerId;
  name: string;
  aliases: string[];
  appealWindowDaysDefault: number;
  addressBlock: string;
  commonDenialPhrases: string[];
  /** Sourced citation slots — generator must NOT invent cites beyond these. */
  citationSlots: CitationSlot[];
  toneNotes: string;
}

export const PAYERS: Record<PayerId, PayerPack> = {
  uhc: {
    id: "uhc",
    name: "UnitedHealthcare",
    aliases: ["UHC", "United Healthcare", "Optum"],
    appealWindowDaysDefault: 180,
    addressBlock: "UnitedHealthcare Appeals\n[Confirm current appeals address with denial letter / portal]",
    commonDenialPhrases: [
      "does not meet step therapy requirements",
      "preferred alternatives not documented",
      "not medically necessary",
    ],
    citationSlots: [
      {
        id: "uhc-dupixent-pa-med-nec-2026",
        title:
          "Dupixent® (dupilumab) - Prior Authorization/Medical Necessity - UnitedHealthcare Commercial Plans (Program Number 2026 P 2116-24)",
        url: "https://www.uhcprovider.com/content/dam/provider/docs/public/prior-auth/drugs-pharmacy/commercial/a-g/PA-Med-Nec-Dupixent.pdf",
        section: "Coverage Criteria — A. Atopic Dermatitis",
        notes:
          "Public PDF; AD / dupilumab; access 2026-09-07; verify effective date before submit",
      },
      {
        id: "uhc-cosentyx-pa-med-nec",
        title:
          "Cosentyx® (secukinumab) prefilled syringe or Sensoready pen - Prior Authorization/Medical Necessity - UnitedHealthcare Commercial Plans (Program Number 2025 P 2196-18)",
        url: "https://www.uhcprovider.com/content/dam/provider/docs/public/prior-auth/drugs-pharmacy/commercial/a-g/PA-Med-Nec-Cosentyx.pdf",
        section: "Coverage Criteria — Plaque Psoriasis; Hidradenitis Suppurativa",
        notes: "PsO/HS / secukinumab; access 2026-09-07",
      },
      {
        id: "uhc-skyrizi-pa-med-nec",
        title:
          "Skyrizi® (risankizumab-rzaa) injection - Prior Authorization/Medical Necessity - UnitedHealthcare Commercial Plans",
        url: "https://www.uhcprovider.com/content/dam/provider/docs/public/prior-auth/drugs-pharmacy/commercial/r-z/PA-Med-Nec-Skyrizi.pdf",
        section: "Coverage Criteria — A. Plaque Psoriasis",
        notes: "PsO / risankizumab; access 2026-09-07",
      },
    ],
    toneNotes: "Formal; reference member ID / auth number prominently.",
  },
  aetna: {
    id: "aetna",
    name: "Aetna",
    aliases: ["Aetna CVS Health"],
    appealWindowDaysDefault: 180,
    addressBlock: "Aetna Appeals Unit\n[Confirm current appeals address with denial letter / portal]",
    commonDenialPhrases: [
      "criteria for coverage not met",
      "step therapy not satisfied",
      "experimental or investigational",
    ],
    citationSlots: [
      {
        id: "aetna-cpb-0655-adalimumab",
        title: "Adalimumab - Medical Clinical Policy Bulletins | Aetna (Number: 0655)",
        url: "https://www.aetna.com/cpb/medical/data/600_699/0655.html",
        section: "Criteria for Initial Approval — Plaque psoriasis; Hidradenitis suppurativa",
        notes: "Verified HTML CPB; PsO/HS / adalimumab; access 2026-09-07",
      },
      {
        id: "aetna-cpb-0905-secukinumab",
        title: "Secukinumab (Cosentyx) - Medical Clinical Policy Bulletins | Aetna (Number: 0905)",
        url: "https://www.aetna.com/cpb/medical/data/900_999/0905.html",
        section: "Criteria for Initial Approval — Plaque psoriasis; Hidradenitis suppurativa",
        notes: "PsO/HS / secukinumab; access 2026-09-07",
      },
      {
        id: "aetna-cpb-1009-skyrizi",
        title: "Risankizumab-rzaa (Skyrizi) - Medical Clinical Policy Bulletins | Aetna (Number: 1009)",
        url: "https://www.aetna.com/cpb/medical/data/1000_1099/1009.html",
        section: "Criteria for Initial Approval — Plaque psoriasis",
        notes: "PsO / risankizumab; access 2026-09-07",
      },
      {
        id: "aetna-sgm-dupixent-1690a",
        title:
          "Dupixent SGM 1690-A P2024d_R - Specialty Pharmacy Clinical Policy Bulletins Aetna Non-Medicare Prescription Drug Plan",
        url: "https://www.aetna.com/products/rxnonmedicare/data/2024/Dupixent_SGM_1690-A_P2024d_R.html",
        section: "Criteria for Initial Approval — Moderate-to-severe atopic dermatitis",
        notes:
          "AD / dupilumab specialty pharmacy bulletin; plan variant may differ; access 2026-09-07",
      },
    ],
    toneNotes: "Reference CPB criteria slots only when filled.",
  },
  cigna: {
    id: "cigna",
    name: "Cigna",
    aliases: ["Cigna Healthcare", "Express Scripts"],
    appealWindowDaysDefault: 180,
    addressBlock: "Cigna Appeals\n[Confirm current appeals address with denial letter / portal]",
    commonDenialPhrases: [
      "does not meet pharmacy coverage policy",
      "prior therapy requirements not met",
      "quantity limit exceeded",
    ],
    citationSlots: [
      {
        id: "cigna-ip0678-cosentyx",
        title:
          "Inflammatory Conditions – Cosentyx Subcutaneous Prior Authorization Policy (IP0678)",
        url: "https://static.cigna.com/assets/chcp/pdf/coveragePolicies/pharmacy/ip_0678_coveragepositioncriteria_inflammatory_conditions_cosentyx_subcutaneous.pdf",
        section: "Coverage Policy — Plaque Psoriasis; Hidradenitis Suppurativa",
        notes: "PsO/HS / secukinumab; access 2026-09-07",
      },
      {
        id: "cigna-ip0682-rinvoq",
        title:
          "Inflammatory Conditions – Rinvoq/Rinvoq LQ Prior Authorization Policy (IP0682)",
        url: "https://static.cigna.com/assets/chcp/pdf/coveragePolicies/pharmacy/ip_0682_coveragepositioncriteria_inflammatory_conditions_rinvoq.pdf",
        section: "Coverage Policy — Atopic Dermatitis",
        notes: "AD / upadacitinib; access 2026-09-07",
      },
      {
        id: "cigna-ip0453-dupixent",
        title:
          "Immunologicals – Dupixent (dupilumab) Prior Authorization Policy (IP0453)",
        url: "https://static.cigna.com/assets/chcp/pdf/coveragePolicies/pharmacy/ip_0453_coveragepositioncriteria_dupilumab.pdf",
        section: "FDA-Approved Indications (incl. Atopic Dermatitis)",
        notes: "AD / dupilumab; access 2026-09-07",
      },
    ],
    toneNotes: "Clear mapping of failed therapies to step list.",
  },
  anthem: {
    id: "anthem",
    name: "Anthem / Elevance",
    aliases: ["Anthem Blue Cross", "Elevance Health"],
    appealWindowDaysDefault: 180,
    addressBlock: "Anthem Appeals\n[Confirm current appeals address with denial letter / portal]",
    commonDenialPhrases: [
      "medical policy criteria not met",
      "formulary alternative available",
      "insufficient clinical information",
    ],
    citationSlots: [
      {
        id: "anthem-cc-0029-dupixent",
        title: "Medical Drug Clinical Criteria — Dupixent (dupilumab) (CC-0029)",
        url: "https://files.providernews.anthem.com/6806/CC-0029_Pub-09-10-2025-(final).pdf",
        section: "Clinical Criteria — atopic dermatitis",
        notes: "AD / dupilumab; access 2026-09-07",
      },
      {
        id: "anthem-cc-0063-ustekinumab",
        title: "Medical Drug Clinical Criteria — Ustekinumab (CC-0063)",
        url: "https://files.providernews.anthem.com/7584/CC-0063_Pub-12-22-25-(final)-.pdf",
        section: "Clinical Criteria — Plaque psoriasis",
        notes: "PsO / ustekinumab; access 2026-09-07",
      },
      {
        id: "anthem-cc-0050-il23",
        title:
          "Medical Drug Clinical Criteria — Monoclonal Antibodies to Interleukin-23 (CC-0050)",
        url: "https://files.providernews.anthem.com/6394/CC-0050_Monoclonal-Antibodies-to-Interleukin-23_Pub-3.18.25-(final).pdf",
        section: "Clinical Criteria — Ilumya/Skyrizi/Tremfya plaque psoriasis",
        notes: "PsO / IL-23 class; access 2026-09-07",
      },
    ],
    toneNotes: "Emphasize severity scores and prior therapy documentation.",
  },
  humana: {
    id: "humana",
    name: "Humana",
    aliases: ["Humana Pharmacy"],
    appealWindowDaysDefault: 60,
    addressBlock: "Humana Grievances and Appeals\n[Confirm current appeals address with denial letter / portal]",
    commonDenialPhrases: [
      "does not meet coverage criteria",
      "step edit not met",
      "dose exceeds approved limit",
    ],
    citationSlots: [
      {
        id: "humana-2026-enhanced2-pdp-pa",
        title:
          "Prior Authorization Criteria — 2026 Enhanced-2 PDP (COSENTYX, DUPIXENT, ADALIMUMAB entries)",
        url: "https://assets.humana.com/is/content/humana/2026%20Enhanced-2%20PDP-Prior%20Authorizationpdf",
        section: "Required Medical Information sections for Cosentyx/Dupixent/Adalimumab",
        notes:
          "Medicare PDP PA criteria PDF (not commercial). Confirm MA vs commercial on the denial. Access 2026-09-07; re-verify before submit.",
      },
      {
        id: "humana-2026-lean-enhanced1-pdp-pa",
        title:
          "Prior Authorization Criteria — 2026 Lean Enhanced-1 PDP (includes Cosentyx criteria text)",
        url: "https://assets.humana.com/is/content/humana/2026%20Lean%20Enhanced-1%20PDP-Prior%20Authorizationpdf",
        section: "Required Medical Information — Cosentyx (and related PA drugs)",
        notes:
          "Medicare PDP PA criteria PDF — Cosentyx criteria present; commercial LOB may differ. Access 2026-09-15.",
      },
      {
        id: "humana-pharmacy-pa-hub",
        title: "Humana provider pharmacy prior authorizations hub",
        url: "https://provider.humana.com/pharmacy-resources/prior-authorizations",
        section: "Pharmacy PA resources / submission",
        notes:
          "Public pharmacy PA hub (forms/process). Not a drug-specific commercial criteria PDF. Access 2026-09-15.",
      },
      {
        id: "humana-commercial-pal-july-2024",
        title:
          "Humana Commercial Prior Authorization and Notification List (July 2024 FINAL)",
        url: "https://assets.humana.com/is/content/humana/FINAL_July%202024%20Commercial%20Prior%20Authorization%20and%20Notification%20Listpdf",
        section: "Commercial PA / notification drug list",
        notes:
          "Commercial PAL (list of drugs needing PA/notification) — NOT full Cosentyx/Dupixent/Skyrizi SC clinical criteria. Access 2026-09-15.",
      },
      {
        id: "humana-mcp-library",
        title: "Medical and Pharmacy Coverage Policies (Humana policy library home)",
        url: "https://mcp.humana.com/tad/TAD_New/Home.aspx",
        section: "Browse Pharmacy Coverage Policies",
        notes:
          "Search by drug for member LOB; deep links unstable. Commercial derm biologic criteria often plan-specific. Access 2026-09-07.",
      },
    ],
    toneNotes: "Flag appeal deadline prominently; confirm MA vs commercial. Public Cosentyx/Dupixent criteria are strongest on Medicare PDP PA PDFs — commercial SC criteria PDFs not found on open web (PAL list + PA hub only). See docs/payer-pack-gaps.md.",
  },
  ibx: {
    id: "ibx",
    name: "Independence Blue Cross",
    aliases: ["IBX", "Independence", "IBC", "Highmark Blue Shield regional stub"],
    appealWindowDaysDefault: 180,
    addressBlock: "Independence Blue Cross Appeals\n[Confirm current appeals address with denial letter / portal]",
    commonDenialPhrases: [
      "authorization criteria not met",
      "preferred products required first",
      "not a covered benefit as requested",
    ],
    citationSlots: [
      {
        id: "ibx-ma-ilumya-ma08-098a",
        title:
          "Tildrakizumab-asmn (Ilumya®) — Medicare Advantage Medical Policy (MA08.098a)",
        url: "https://medpolicy.ibx.com/ibc/ma/Pages/Policy/b7428f98-6f1f-4d1e-b75c-baf2f3c327dc.aspx",
        section: "MEDICALLY NECESSARY — plaque psoriasis",
        notes:
          "MA medical-benefit policy for Ilumya (plaque psoriasis). Commercial Select Drug / Value Formulary pharmacy criteria are portal-gated — do not invent step lists; paste member-plan bulletin when available. Access 2026-09-15.",
      },
      {
        id: "ibx-ma-cosentyx-iv",
        title:
          "Secukinumab (Cosentyx®) for Intravenous Use — IBC Medicare Advantage Medical Policy",
        url: "https://medpolicy.ibx.com/ibc/ma/Pages/Policy/c20c37f2-153c-4e9a-a872-dd5b1f12b7d4.aspx",
        section: "Policy — Psoriatic Arthritis / related IV indications",
        notes:
          "MA Cosentyx IV (PsA/AS/nr-axSpA) — not SC plaque-psoriasis primary. Commercial SC Cosentyx criteria are typically portal-only. Access 2026-09-15.",
      },
      {
        id: "ibx-precert-01-2026",
        title:
          "Independence Blue Cross Precertification List — effective January 1, 2026 (specialty drugs incl. Cosentyx, Skyrizi IV)",
        url: "https://www.ibx.com/pdfs/resources/for-providers/precertification/ibc-precert-01-2026.pdf",
        section:
          "Specialty drugs requiring precertification — Immunological agents (Cosentyx®; Skyrizi® IV)",
        notes:
          "Commercial specialty precert LIST only — Cosentyx / Skyrizi IV appear on medical-benefit list; NOT full clinical criteria. Dupixent and SC pharmacy biologics often portal/PBM. Verified 2026-09-15.",
      },
      {
        id: "ibx-commercial-pa-hub",
        title: "Prior authorization — Independence Blue Cross (commercial pharmacy PA hub)",
        url: "https://www.ibx.com/resources/for-providers/policies-and-guidelines/pharmacy-information/prior-authorization.html",
        section: "Commercial prior authorization forms / submission",
        notes:
          "Public PA hub (forms + fax/portal submit). Deep commercial pharmacy criteria PDFs typically behind portal/PBM — not published as open criteria PDFs. Verified 2026-09-15.",
      },
      {
        id: "ibx-provcomm-biologics",
        title:
          "Policy changes impacting biologics prescribed for autoimmune, asthma, or allergic conditions (IBX provider communication)",
        url: "https://provcomm.ibx.com/archive-ibc/news/Pages/22-3373.aspx",
        section:
          "Process changes (medical records required; lists Dupixent, Cosentyx, Skyrizi, etc.)",
        notes:
          "Public bulletin (Oct 2022) — process/attestation rules only, not full coverage criteria. Linked drug policies (Dupilumab/Dupixent, Immune Modulating Therapies) sit behind IBX pharmacy portal. Access 2026-09-15.",
      },
      {
        id: "ibx-pa-form-immune-modulating",
        title:
          "Immune Modulating Therapy Prior Authorization Request Form (IBX Value Formulary / PBM form)",
        url: "https://www.ibx.com/pdfs/resources/for-providers/forms/value-immune-modulating-therapy-prior-auth.pdf",
        section:
          "Clinical Information — Plaque psoriasis / PsA / HS checklists (form questions, not a policy bulletin)",
        notes:
          "Public PA form PDF (forms update frequently). Useful for documenting what IBX asks; not a substitute for the portal pharmacy policy bulletin. Access 2026-09-15.",
      },
      {
        id: "ibx-pa-form-psoriasis-agents",
        title: "Prior Authorization Form — Psoriasis Agents (Medical Benefit) (IBX)",
        url: "https://www.ibx.com/pdfs/providers/pharmacy_information/prior_authorization/psoriasis_ibc.pdf",
        section: "Medical-benefit psoriasis agents intake (Stelara-era form)",
        notes:
          "Public form PDF dated 02/2011 — legacy medical-benefit intake only; verify current form/version before cite in a live appeal. Access 2026-09-15.",
      },
      {
        id: "ibx-pharmacy-policies-portal",
        title: "IBX Pharmacy Policy Bulletins (provider portal — terms gate)",
        url: "https://www.ibx.com/providers/pharmacy_information/pharmacy_policies/",
        section: "Accept terms → browse commercial pharmacy Policy Bulletins",
        notes:
          "Portal-only: commercial Dupixent / immune-modulating / PsO pharmacy criteria live here after Accept. Generator must not invent bulletin text; paste verified excerpts from the member plan. Access 2026-09-15.",
      },
    ],
    toneNotes:
      "IBX commercial derm biologics/JAK pharmacy criteria are largely portal-only (terms-gated Policy Bulletins). Public slots are MA policies + precert list + PA forms/hub + bulletin — NOT full commercial Cosentyx SC / Dupixent / Skyrizi SC criteria. Clinics must paste portal criteria or attach the payer PDF before submit. Generator fail-closes with Citation needed when slots do not match. Confirm IBC vs Keystone vs Highmark entity on the denial. See docs/payer-pack-gaps.md.",
  },
};

export const PAYER_LIST = Object.values(PAYERS);
