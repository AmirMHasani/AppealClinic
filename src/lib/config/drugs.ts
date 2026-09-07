import type { Indication } from "@/lib/types";

export interface DrugConfig {
  id: string;
  name: string;
  class: string;
  indications: Indication[];
  typicalDoses: string[];
}

export const DRUGS: DrugConfig[] = [
  {
    id: "skyrizi",
    name: "Risankizumab (Skyrizi)",
    class: "IL-23 inhibitor",
    indications: ["plaque_psoriasis", "hidradenitis_suppurativa"],
    typicalDoses: ["150 mg SQ at weeks 0, 4, then q12 weeks", "HS dosing per label"],
  },
  {
    id: "tremfya",
    name: "Guselkumab (Tremfya)",
    class: "IL-23 inhibitor",
    indications: ["plaque_psoriasis"],
    typicalDoses: ["100 mg SQ at weeks 0, 4, then q8 weeks"],
  },
  {
    id: "taltz",
    name: "Ixekizumab (Taltz)",
    class: "IL-17A inhibitor",
    indications: ["plaque_psoriasis"],
    typicalDoses: ["160 mg week 0, then 80 mg q2w x 6, then q4w"],
  },
  {
    id: "cosentyx",
    name: "Secukinumab (Cosentyx)",
    class: "IL-17A inhibitor",
    indications: ["plaque_psoriasis", "hidradenitis_suppurativa"],
    typicalDoses: ["300 mg SQ weekly x 5, then q4 weeks"],
  },
  {
    id: "humira",
    name: "Adalimumab (Humira / biosimilar)",
    class: "TNF inhibitor",
    indications: ["plaque_psoriasis", "hidradenitis_suppurativa"],
    typicalDoses: ["PsO: 80 mg then 40 mg q2w", "HS: 160/80 then 40 mg qwk"],
  },
  {
    id: "enbrel",
    name: "Etanercept (Enbrel)",
    class: "TNF inhibitor",
    indications: ["plaque_psoriasis"],
    typicalDoses: ["50 mg SQ twice weekly x 12 weeks, then weekly"],
  },
  {
    id: "dupixent",
    name: "Dupilumab (Dupixent)",
    class: "IL-4Rα antagonist",
    indications: ["atopic_dermatitis"],
    typicalDoses: ["600 mg then 300 mg SQ q2 weeks"],
  },
  {
    id: "adbreathe",
    name: "Tralokinumab (Adbry)",
    class: "IL-13 inhibitor",
    indications: ["atopic_dermatitis"],
    typicalDoses: ["600 mg then 300 mg SQ q2 weeks"],
  },
  {
    id: "rinvoq",
    name: "Upadacitinib (Rinvoq)",
    class: "JAK inhibitor",
    indications: ["atopic_dermatitis"],
    typicalDoses: ["15 mg PO daily", "30 mg PO daily"],
  },
  {
    id: "cibinqo",
    name: "Abrocitinib (Cibinqo)",
    class: "JAK inhibitor",
    indications: ["atopic_dermatitis"],
    typicalDoses: ["100 mg PO daily", "200 mg PO daily"],
  },
  {
    id: "opzelura",
    name: "Ruxolitinib cream (Opzelura)",
    class: "Topical JAK inhibitor",
    indications: ["atopic_dermatitis"],
    typicalDoses: ["Apply BID to affected areas"],
  },
];

export function drugsForIndication(indication: Indication): DrugConfig[] {
  return DRUGS.filter((d) => d.indications.includes(indication));
}
