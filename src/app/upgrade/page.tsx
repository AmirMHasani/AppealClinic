"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/AppNav";

type StripeStatus = {
  keysPresent: boolean;
  checkoutAllowed: boolean;
  mode: "test" | "live" | "none";
  reason: string | null;
  liveEnabledFlag: boolean;
};

export default function UpgradePage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [status, setStatus] = useState<StripeStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const me = await fetch("/api/auth/me");
      if (!me.ok) {
        router.push("/login");
        return;
      }
      const { user } = await me.json();
      setUserName(user.name);
      const s = await fetch("/api/stripe/status");
      if (s.ok) setStatus(await s.json());
    })();
  }, [router]);

  async function startCheckout() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok || !data.url) {
      setError(data.error || "Could not start Checkout");
      return;
    }
    window.location.href = data.url;
  }

  return (
    <div className="page-shell">
      <AppNav userName={userName} />
      <main className="mx-auto w-full max-w-lg px-3 py-6 sm:px-5">
        <p className="ops-kicker">Billing</p>
        <h1 className="page-title mt-1">Clinic plan</h1>
        <p className="page-subtitle">
          Unlimited drafts per location · $249/mo
        </p>

        <div className="card-pad mt-5">
          <p className="font-serif text-3xl font-semibold tabular-nums tracking-tight text-ink">
            $249
            <span className="ml-1 font-sans text-sm font-normal text-ink-muted">
              /mo · per location
            </span>
          </p>
          <ul className="mt-3 space-y-1.5 text-[12.5px] text-ink-muted">
            <li>· Unlimited appeal drafts for one clinic location</li>
            <li>· DOCX + print/PDF export · outcome tracking</li>
            <li>· Sourced payer citation slots (no invented policy)</li>
            <li>· No EHR · no auto-submit · human review required</li>
          </ul>

          {!status ? (
            <p className="mt-5 text-[12.5px] text-ink-faint">Checking billing…</p>
          ) : !status.keysPresent ? (
            <div className="mt-5 rounded border border-dashed border-paper-rule bg-paper p-3 text-[12.5px] text-ink-muted">
              <strong className="font-semibold text-ink">Checkout not configured.</strong>{" "}
              Set test keys in the host env (
              <code className="font-mono text-[11px]">STRIPE_SECRET_KEY</code>,{" "}
              <code className="font-mono text-[11px]">
                NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
              </code>
              , <code className="font-mono text-[11px]">STRIPE_PRICE_ID</code>). See{" "}
              <code className="font-mono text-[11px]">docs/stripe-go-live.md</code>.
            </div>
          ) : !status.checkoutAllowed ? (
            <div className="mt-5 space-y-3">
              <div className="rounded border border-amber-300 bg-amber-50 p-3 text-[12.5px] text-amber-950">
                <strong className="font-semibold">Keys present — checkout gated.</strong>{" "}
                {status.reason ||
                  "Live charges require STRIPE_LIVE_ENABLED=true and the MVP checklist."}
              </div>
              <button type="button" className="btn-primary btn-block opacity-50" disabled>
                Checkout gated
              </button>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {status.mode === "test" && (
                <div className="rounded border border-brand-200 bg-brand-50 p-3 text-[12.5px] text-brand-900">
                  <strong className="font-semibold">Stripe test mode.</strong> No real
                  charges. Use card <code className="font-mono">4242…</code>. Do not flip
                  live keys until founder completes{" "}
                  <code className="font-mono text-[11px]">docs/mvp-definition.md</code>{" "}
                  and <code className="font-mono text-[11px]">docs/stripe-go-live.md</code>.
                </div>
              )}
              {status.mode === "live" && (
                <div className="rounded border border-rose-300 bg-rose-50 p-3 text-[12.5px] text-rose-900">
                  <strong className="font-semibold">Live mode enabled.</strong> Real
                  $249 charges will process.
                </div>
              )}
              <button
                type="button"
                className="btn-primary btn-block btn-lg"
                disabled={busy}
                onClick={startCheckout}
              >
                {busy
                  ? "Redirecting…"
                  : status.mode === "test"
                    ? "Start test Checkout"
                    : "Upgrade — $249/mo"}
              </button>
              {error && (
                <p className="rounded border border-rose-200 bg-rose-50 px-2.5 py-2 text-[12.5px] text-clinical-danger">
                  {error}
                </p>
              )}
            </div>
          )}

          <p className="mt-4 text-[11px] text-ink-faint">
            Soft launch rule: do not take real money until MVP exit criteria and Stripe
            go-live checklist are done.
          </p>
        </div>
      </main>
    </div>
  );
}
