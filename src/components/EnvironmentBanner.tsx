import { getAppMode, isDemoMode, isPhiMode } from "@/lib/env";

/**
 * Server component banner by APP_MODE:
 * - demo (default): amber Development/Demo warning — not for real PHI
 * - phi: muted “PHI mode — BAA environment” (not the demo amber)
 */
export function EnvironmentBanner() {
  const mode = getAppMode();

  if (isPhiMode()) {
    return (
      <div
        role="status"
        className="border-b border-slate-300/80 bg-slate-100 px-3 py-1.5 text-center font-mono text-[11px] font-medium tracking-tight text-slate-800"
      >
        <span className="font-semibold uppercase tracking-clinical">
          PHI mode — BAA environment
        </span>
        <span className="mx-1.5 text-slate-500">·</span>
        Vendor + customer BAAs required · not the public demo
        <span className="mx-1.5 text-slate-500">·</span>
        See docs/phi-mode-checklist.md
      </div>
    );
  }

  if (!isDemoMode()) return null;

  return (
    <div
      role="status"
      className="border-b border-amber-400/70 bg-amber-100 px-3 py-1.5 text-center font-mono text-[11px] font-medium tracking-tight text-amber-950"
    >
      <span className="font-semibold uppercase tracking-clinical">
        Development / Demo
      </span>
      <span className="mx-1.5 text-amber-800/70">·</span>
      Not for real PHI — synthetic or de-identified data only
      <span className="mx-1.5 text-amber-800/70">·</span>
      Demo Clinic tenancy (cases scoped by clinicId)
      <span className="mx-1.5 text-amber-800/70">·</span>
      <span className="text-amber-900/80">APP_MODE={mode}</span>
    </div>
  );
}
