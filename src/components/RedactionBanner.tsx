export function RedactionBanner() {
  return (
    <div className="flex gap-2.5 rounded border border-amber-300/90 bg-amber-50 px-3 py-2.5 text-[12.5px] text-amber-950">
      <span
        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border border-amber-400 bg-amber-100 font-mono text-[10px] font-bold text-amber-900"
        aria-hidden
      >
        !
      </span>
      <div>
        <p className="font-semibold tracking-tight">Redaction-first · no real PHI</p>
        <p className="mt-0.5 text-amber-900/90">
          Do not enter full names, SSNs, full MRNs, DOB, or street addresses. Use
          internal case IDs and optional initials. Citations come only from sourced
          payer packs — never invented policy text.
        </p>
      </div>
    </div>
  );
}
