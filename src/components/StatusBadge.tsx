import type { CaseStatus } from "@/lib/types";

const STYLES: Record<CaseStatus, string> = {
  draft: "bg-brand-50 text-brand-800 border-brand-200",
  ready: "bg-sky-50 text-clinical-info border-sky-200",
  submitted: "bg-amber-50 text-clinical-warn border-amber-200",
  won: "bg-emerald-50 text-clinical-ok border-emerald-200",
  partial: "bg-lime-50 text-clinical-ok border-lime-200",
  lost: "bg-rose-50 text-clinical-danger border-rose-200",
  abandoned: "bg-orange-50 text-clinical-warn border-orange-200",
};

export function StatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-clinical ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
