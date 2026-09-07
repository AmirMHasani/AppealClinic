import Stripe from "stripe";
import { getStripeSecretKey } from "@/lib/env";

let cached: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = getStripeSecretKey();
  if (!key) return null;
  if (!cached) {
    cached = new Stripe(key, {
      apiVersion: "2026-08-26.dahlia",
      typescript: true,
    });
  }
  return cached;
}
