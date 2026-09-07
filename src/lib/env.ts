/**
 * Runtime environment helpers for AppealClinic.
 * APP_MODE defaults to "demo" when unset — treat as non-PHI.
 */

export type AppMode = "demo" | "production";

export function getAppMode(): AppMode {
  const raw = (process.env.APP_MODE || "demo").toLowerCase().trim();
  return raw === "production" ? "production" : "demo";
}

export function isDemoMode(): boolean {
  return getAppMode() === "demo";
}

export function requireRedactionCheck(): boolean {
  const v = (process.env.REQUIRE_REDACTION_CHECK || "").toLowerCase().trim();
  return v === "true" || v === "1" || v === "yes";
}

export function stripeLiveEnabled(): boolean {
  const v = (process.env.STRIPE_LIVE_ENABLED || "").toLowerCase().trim();
  return v === "true" || v === "1" || v === "yes";
}

export function getStripeSecretKey(): string | undefined {
  return process.env.STRIPE_SECRET_KEY?.trim() || undefined;
}

export function getStripePublishableKey(): string | undefined {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || undefined;
}

export function getStripePriceId(): string | undefined {
  return process.env.STRIPE_PRICE_ID?.trim() || undefined;
}

/** True when secret + publishable + price are set. */
export function stripeKeysPresent(): boolean {
  return Boolean(
    getStripeSecretKey() && getStripePublishableKey() && getStripePriceId()
  );
}

export function isLiveStripeKey(secret: string | undefined): boolean {
  return Boolean(secret?.startsWith("sk_live_"));
}

/**
 * Checkout may run when keys are present AND either keys are test-mode
 * OR STRIPE_LIVE_ENABLED is explicitly true for live keys.
 */
export function stripeCheckoutAllowed(): {
  allowed: boolean;
  reason?: string;
  mode?: "test" | "live" | "none";
} {
  const secret = getStripeSecretKey();
  const publishable = getStripePublishableKey();
  const priceId = getStripePriceId();

  if (!secret || !publishable || !priceId) {
    return {
      allowed: false,
      reason: "Stripe keys or STRIPE_PRICE_ID not configured",
      mode: "none",
    };
  }

  if (isLiveStripeKey(secret)) {
    if (!stripeLiveEnabled()) {
      return {
        allowed: false,
        reason:
          "Live Stripe keys require STRIPE_LIVE_ENABLED=true and MVP checklist (docs/stripe-go-live.md)",
        mode: "live",
      };
    }
    return { allowed: true, mode: "live" };
  }

  return { allowed: true, mode: "test" };
}
