import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  getStripePublishableKey,
  stripeCheckoutAllowed,
  stripeKeysPresent,
  stripeLiveEnabled,
} from "@/lib/env";
import { getSubscriptionEntitlement } from "@/lib/db";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gate = stripeCheckoutAllowed();
  const entitlement = await getSubscriptionEntitlement();

  return NextResponse.json({
    keysPresent: stripeKeysPresent(),
    publishableKeyConfigured: Boolean(getStripePublishableKey()),
    liveEnabledFlag: stripeLiveEnabled(),
    checkoutAllowed: gate.allowed,
    mode: gate.mode ?? "none",
    reason: gate.reason ?? null,
    planEntitled: entitlement.planEntitled,
    subscriptionStatus: entitlement.subscriptionStatus,
  });
}
