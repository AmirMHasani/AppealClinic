export type Indication =
  | "plaque_psoriasis"
  | "atopic_dermatitis"
  | "hidradenitis_suppurativa";

export type DenialType =
  | "step_therapy"
  | "medical_necessity"
  | "non_formulary"
  | "quantity_limit";

export type CaseStatus =
  | "draft"
  | "ready"
  | "submitted"
  | "won"
  | "partial"
  | "lost"
  | "abandoned";

export type PayerId =
  | "uhc"
  | "aetna"
  | "cigna"
  | "anthem"
  | "humana"
  | "ibx";

export interface FailedTherapy {
  drug: string;
  class: string;
  start?: string;
  stop?: string;
  reasonStopped: string;
}

export interface DiseaseSeverity {
  bsaPercent?: number | null;
  iga?: number | null;
  pga?: number | null;
  dlqi?: number | null;
  hurleyStage?: number | null;
  durationYears?: number | null;
  notes?: string;
}

export interface CitationSlot {
  id: string;
  title: string;
  url?: string;
  section?: string;
  notes?: string;
}

export interface CaseMeta {
  internal_case_id: string;
  patient_initials?: string;
  indication: Indication;
  requested_drug: string;
  requested_dose?: string;
  place_of_service?: "office" | "specialty_pharmacy" | "other";
}

export interface DenialDetails {
  payer_id: PayerId;
  denial_type: DenialType;
  denial_date: string;
  appeal_deadline?: string;
  auth_or_claim_number?: string;
  denial_verbatim: string;
  carc_codes?: string;
}

export interface ClinicalEvidence {
  diagnosis_icd10: string[];
  disease_severity: DiseaseSeverity;
  failed_therapies: FailedTherapy[];
  contraindications_to_step?: string;
  labs_imaging?: string;
  clinical_narrative_bullets: string;
  guidelines_user_paste?: string;
}

export interface CaseOutcome {
  status: CaseStatus;
  submitted_at?: string;
  decision_at?: string;
  dollars_recovered?: number | null;
  outcome_notes?: string;
}

export interface AppealCase {
  id: string;
  created_at: string;
  updated_at: string;
  meta: CaseMeta;
  denial: DenialDetails;
  clinical: ClinicalEvidence;
  letter_markdown?: string;
  checklist?: string[];
  gaps?: string[];
  outcome: CaseOutcome;
}

export interface ClinicSettings {
  clinic_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  fax?: string;
  npi?: string;
  signer_name?: string;
  signer_credentials?: string;
}

export interface DemoUser {
  id: string;
  email: string;
  /** scrypt hash (scrypt:salt:hash). Legacy plaintext may appear until migrated. */
  passwordHash: string;
  /** @deprecated legacy plaintext; prefer passwordHash */
  password?: string;
  name: string;
}

export interface Store {
  users: DemoUser[];
  settings: ClinicSettings;
  cases: AppealCase[];
  seeded: boolean;
}
