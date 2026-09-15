export function SettingsTenancyBanner() {
  return (
    <div className="mt-4 rounded border border-amber-300 bg-amber-50 px-3 py-2.5 text-[12.5px] text-amber-950">
      <p className="font-semibold tracking-tight">
        Demo Clinic · APP_MODE=demo · Phase 2 tenancy
      </p>
      <p className="mt-1 text-amber-900/90">
        Staff on this account belong to <strong>Demo Clinic</strong>. Cases and
        letterhead are scoped by{" "}
        <code className="font-mono text-[11px]">clinicId</code> — other clinics
        cannot see this desk&apos;s cases. Hosted demo still bootstraps one Demo
        Clinic by default.
      </p>
    </div>
  );
}
