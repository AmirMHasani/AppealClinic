/**
 * Smoke: two-clinic isolation on the JSON store path.
 * Usage: bunx tsx scripts/smoke-tenancy.ts
 */
import fs from "fs";
import path from "path";
import { DEMO_CLINIC_ID } from "../src/lib/tenancy";

async function main() {
  // Use a temp store path by chdiring into a temp cwd copy of data — simpler: mutate store via json APIs
  process.env.DATABASE_URL = "";
  const {
    jsonCreateCase,
    jsonCreateUserInClinic,
    jsonGetCase,
    jsonListCases,
    jsonGetStore,
    jsonSaveStore,
  } = await import("../src/lib/db/json-store");
  const { hashPassword } = await import("../src/lib/auth/password");

  const store = jsonGetStore();
  const otherId = "clinic-other";
  const ts = new Date().toISOString();
  if (!store.clinics.find((c) => c.id === otherId)) {
    store.clinics.push({
      id: otherId,
      name: "Other Clinic",
      created_at: ts,
      updated_at: ts,
    });
    store.settingsByClinic[otherId] = {
      clinic_name: "Other Clinic",
      address_line1: "1 Other St",
      city: "Boston",
      state: "MA",
      zip: "02108",
      phone: "(617) 555-0100",
    };
    jsonSaveStore(store);
  }

  const demoCase = await jsonCreateCase(DEMO_CLINIC_ID, {
    meta: {
      internal_case_id: "ISO-DEMO",
      indication: "plaque_psoriasis",
      requested_drug: "Test",
    },
    denial: {
      payer_id: "uhc",
      denial_type: "step_therapy",
      denial_date: "2026-01-01",
      denial_verbatim: "denied",
    },
    clinical: {
      diagnosis_icd10: ["L40.0"],
      disease_severity: {},
      failed_therapies: [],
      clinical_narrative_bullets: "x",
    },
  });

  const otherCase = await jsonCreateCase(otherId, {
    meta: {
      internal_case_id: "ISO-OTHER",
      indication: "plaque_psoriasis",
      requested_drug: "Test",
    },
    denial: {
      payer_id: "aetna",
      denial_type: "step_therapy",
      denial_date: "2026-01-01",
      denial_verbatim: "denied",
    },
    clinical: {
      diagnosis_icd10: ["L40.0"],
      disease_severity: {},
      failed_therapies: [],
      clinical_narrative_bullets: "x",
    },
  });

  const demoList = jsonListCases(DEMO_CLINIC_ID).map((c) => c.id);
  const otherList = jsonListCases(otherId).map((c) => c.id);

  const bleed1 = jsonGetCase(DEMO_CLINIC_ID, otherCase.id);
  const bleed2 = jsonGetCase(otherId, demoCase.id);

  console.log("demo has other?", demoList.includes(otherCase.id));
  console.log("other has demo?", otherList.includes(demoCase.id));
  console.log("cross get demo→other:", bleed1);
  console.log("cross get other→demo:", bleed2);

  if (bleed1 || bleed2 || demoList.includes(otherCase.id) || otherList.includes(demoCase.id)) {
    console.error("FAIL: clinic isolation broken");
    process.exit(1);
  }
  console.log("PASS: two-clinic isolation (JSON store)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
