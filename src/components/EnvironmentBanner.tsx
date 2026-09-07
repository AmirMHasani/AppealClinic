import { isDemoMode } from "@/lib/env";

/** Server component: visible when APP_MODE is demo or unset. */
export function EnvironmentBanner() {
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
    </div>
  );
}
