import type { ClinicSettings, DemoUser } from "@/lib/types";
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
