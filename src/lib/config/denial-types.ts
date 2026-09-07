import type { DenialType } from "@/lib/types";

export const DENIAL_TYPES: Record<
  DenialType,
  { id: DenialType; label: string; description: string }
> = {
  step_therapy: {
    id: "step_therapy",
    label: "Step therapy / fail-first",
    description: "Preferred agents not tried or documented as failed",
  },
  medical_necessity: {
    id: "medical_necessity",
    label: "Not medically necessary",
    description: "Plan asserts criteria for medical necessity not met",
  },
  non_formulary: {
    id: "non_formulary",
    label: "Non-formulary / prefer alternate",
    description: "Requested drug not on formulary or preferred alternative required",
  },
  quantity_limit: {
    id: "quantity_limit",
    label: "Quantity / dose limit",
    description: "Requested dose or quantity exceeds plan limit",
  },
};

export const DENIAL_TYPE_LIST = Object.values(DENIAL_TYPES);
