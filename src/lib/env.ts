/**
 * Runtime environment helpers for AppealClinic.
 *
 * APP_MODE:
 * - demo (default if unset or unknown) — non-PHI; redaction-first
 * - phi — only when BAAs live + docs/phi-mode-checklist.md complete
 *
 * Unknown values fail closed to demo (never treat as PHI).
 * Safety latch: APP_MODE=phi on a public *.onrender.com demo host is forced
 * back to demo unless ALLOW_PHI_ON_DEMO_HOST=true.
 */

export type AppMode = "demo" | "phi";

const PHI_FORBIDDEN_MESSAGE =
  "PHI workflows require APP_MODE=phi with BAAs in place (see docs/phi-mode-checklist.md). This environment is demo/synthetic only.";

/** True when host looks like the public Render demo (or any onrender.com). */
export function isPublicDemoHost(): boolean {
  const candidates = [
    process.env.RENDER_EXTERNAL_HOSTNAME,
    process.env.RENDER_EXTERNAL_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
  ]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());

  return candidates.some(
    (c) => c.includes("onrender.com") || c.includes("appealclinic.onrender.com")
  );
}

function allowPhiOnDemoHost(): boolean {
  const v = (process.env.ALLOW_PHI_ON_DEMO_HOST || "").toLowerCase().trim();
  return v === "true" || v === "1" || v === "yes";
}

/**
 * Effective app mode after safety latch.
 * Raw `phi` on public demo host without override → forced `demo`.
 */
export function getAppMode(): AppMode {
  const raw = (process.env.APP_MODE || "demo").toLowerCase().trim();
  if (raw !== "phi") {
    // Unknown (including legacy "production") → demo (fail closed for PHI)
    return "demo";
  }
  if (isPublicDemoHost() && !allowPhiOnDemoHost()) {
    return "demo";
  }
  return "phi";
}

/** Raw env string before latch — useful for diagnostics / latch messaging. */
export function getRawAppMode(): string {
  return (process.env.APP_MODE || "demo").toLowerCase().trim();
}

export function isDemoMode(): boolean {
  return getAppMode() === "demo";
}

export function isPhiMode(): boolean {
  return getAppMode() === "phi";
}

/**
 * Throws if PHI workflows are not allowed in this environment.
 * Prefer refusePhiWorkflowResponse() from API routes for HTTP 403.
 */
export function assertPhiAllowed(): void {
  if (!isPhiMode()) {
    throw new Error(PHI_FORBIDDEN_MESSAGE);
  }
}

/** Detect explicit PHI opt-in on a request (header or body intent). */
export function requestDeclaresPhiIntent(
  req: Request,
  body?: unknown
): boolean {
  const header = req.headers.get("x-appealclinic-phi");
  if (header === "1" || header?.toLowerCase() === "true" || header === "yes") {
    return true;
  }
  if (body && typeof body === "object" && body !== null) {
    const intent = (body as Record<string, unknown>).intent;
    if (typeof intent === "string" && intent.toLowerCase().trim() === "phi") {
      return true;
    }
  }
  return false;
}

export function phiForbiddenPayload() {
  return {
    error: PHI_FORBIDDEN_MESSAGE,
    code: "PHI_MODE_REQUIRED",
    appMode: getAppMode(),
    hint: "Use synthetic/de-identified data in demo mode. Real PHI only after BAAs and APP_MODE=phi.",
  };
}

/**
 * Redaction hard-block for non-SSN hits.
 * Default true in demo when unset (redaction-first). Explicit false/0/no disables.
 * In phi mode, default remains true unless explicitly disabled (still recommended).
 */
export function requireRedactionCheck(): boolean {
  const v = (process.env.REQUIRE_REDACTION_CHECK || "").toLowerCase().trim();
  if (v === "false" || v === "0" || v === "no") return false;
  if (v === "true" || v === "1" || v === "yes") return true;
  // Unset: default on for demo; also on for phi (safe default)
  return true;
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
