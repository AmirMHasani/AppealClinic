"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import type { ClinicSettings } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const me = await fetch("/api/auth/me");
      if (!me.ok) {
        router.push("/login");
        return;
      }
      const { user } = await me.json();
      setUserName(user.name);
      const res = await fetch("/api/settings");
      const data = await res.json();
      setSettings(data.settings);
    })();
  }, [router]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!settings) {
    return (
      <div className="page-shell">
        <AppNav />
        <p className="container-narrow py-8 text-ink-faint">Loading…</p>
      </div>
    );
  }

  const field = (key: keyof ClinicSettings, label: string, required = false) => (
    <label className="block">
      <span className="label">{label}</span>
      <input
        className="field"
        value={(settings[key] as string) || ""}
        required={required}
        onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
      />
    </label>
  );

  return (
    <div className="page-shell">
      <AppNav userName={userName} />
      <main className="container-narrow py-5 sm:py-7">
        <p className="ops-kicker">Clinic</p>
        <h1 className="page-title mt-1">Settings</h1>
        <p className="page-subtitle">
          Letterhead used on generated appeal letters.
        </p>

        <div className="mt-4 rounded border border-brand-200 bg-brand-50 px-3 py-2.5 text-[12.5px] text-brand-900">
          <p className="font-semibold tracking-tight">Security &amp; data posture</p>
          <p className="mt-1 text-brand-800/90">
            This MVP is redaction-first and demo-hosted until BAAs and production
            hosting are in place. Review the concepts in{" "}
            <code className="font-mono text-[11px]">docs/security-one-pager.md</code>{" "}
            (problem scope, encryption assumptions, retention intent, subprocessors,
            BAA gates). Do not enter real PHI while the environment banner shows
            Development / Demo.
          </p>
        </div>

        <form onSubmit={save} className="card-pad mt-4 space-y-3">
          {field("clinic_name", "Clinic name", true)}
          {field("address_line1", "Address line 1", true)}
          {field("address_line2", "Address line 2")}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {field("city", "City", true)}
            {field("state", "State", true)}
            {field("zip", "ZIP", true)}
          </div>
          {field("phone", "Phone", true)}
          {field("fax", "Fax")}
          {field("npi", "NPI (optional)")}
          {field("signer_name", "Default signer name")}
          {field("signer_credentials", "Signer credentials")}
          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center">
            <button type="submit" className="btn-primary btn-block sm:!w-auto">
              Save settings
            </button>
            {saved && (
              <span className="text-[12.5px] font-medium text-clinical-ok">Saved</span>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
