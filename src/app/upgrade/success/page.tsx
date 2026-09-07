"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppNav } from "@/components/AppNav";

function SuccessBody() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");

  return (
    <main className="mx-auto w-full max-w-lg px-3 py-8 sm:px-5">
      <p className="ops-kicker">Checkout</p>
      <h1 className="page-title mt-1">Checkout complete</h1>
      <p className="page-subtitle">
        {sessionId
          ? "Stripe returned a session. In test mode this is a soft success — entitlements may still be stubbed until webhooks are wired."
          : "Payment flow finished. Confirm subscription status in Stripe Dashboard if needed."}
      </p>
      {sessionId && (
        <p className="mt-3 font-mono text-[11px] text-ink-faint break-all">
          session_id={sessionId}
        </p>
      )}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Link href="/dashboard" className="btn-primary">
          Back to cases
        </Link>
        <Link href="/upgrade" className="btn-secondary">
          Plan page
        </Link>
      </div>
    </main>
  );
}

export default function UpgradeSuccessPage() {
  return (
    <div className="page-shell">
      <AppNav />
      <Suspense
        fallback={
          <main className="container-narrow py-8 text-ink-muted">Loading…</main>
        }
      >
        <SuccessBody />
      </Suspense>
    </div>
  );
}
