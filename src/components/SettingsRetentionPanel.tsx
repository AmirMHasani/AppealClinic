"use client";

export function SettingsRetentionPanel() {
  return (
    <section id="retention" className="card-pad mt-6 space-y-3">
      <div>
        <p className="ops-kicker">Retention</p>
        <h2 className="mt-1 font-serif text-lg font-semibold tracking-tight text-ink">
          Delete clinic case data
        </h2>
        <p className="mt-1 text-[12.5px] text-ink-muted">
          Owners can wipe all appeal cases for this clinic (letterhead and staff
          accounts are kept). See{" "}
          <code className="font-mono text-[11px]">docs/retention.md</code>.
        </p>
      </div>
      <button
        type="button"
        className="btn-secondary text-clinical-danger"
        onClick={async () => {
          if (
            !confirm(
              "Permanently delete ALL appeal cases for this clinic? This cannot be undone."
            )
          ) {
            return;
          }
          const res = await fetch("/api/clinic/data", { method: "DELETE" });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            alert(data.error || "Delete failed");
            return;
          }
          alert(`Deleted ${data.deletedCases ?? 0} case(s).`);
        }}
      >
        Delete all clinic cases
      </button>
    </section>
  );
}
