import type { Indication } from "@/lib/types";

export const INDICATIONS: Record<
  Indication,
  {
    id: Indication;
    label: string;
    short: string;
    defaultIcd10: string[];
    severityFields: ("bsaPercent" | "iga" | "pga" | "dlqi" | "hurleyStage")[];
  }
> = {
  plaque_psoriasis: {
    id: "plaque_psoriasis",
    label: "Plaque psoriasis",
    short: "PsO",
    defaultIcd10: ["L40.0"],
    severityFields: ["bsaPercent", "pga", "dlqi"],
  },
  atopic_dermatitis: {
    id: "atopic_dermatitis",
    label: "Atopic dermatitis",
    short: "AD",
    defaultIcd10: ["L20.9"],
    severityFields: ["bsaPercent", "iga", "dlqi"],
  },
  hidradenitis_suppurativa: {
    id: "hidradenitis_suppurativa",
    label: "Hidradenitis suppurativa",
    short: "HS",
    defaultIcd10: ["L73.2"],
    severityFields: ["hurleyStage", "dlqi"],
  },
};

export const INDICATION_LIST = Object.values(INDICATIONS);
