"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import type { ClinicSettings } from "@/lib/types";
import { SettingsTenancyBanner } from "@/components/SettingsTenancyBanner";
import { SettingsRetentionPanel } from "@/components/SettingsRetentionPanel";

type StaffUser = { id: string; email: string; name: string };

export default function SettingsPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [savedMsg, setSavedMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [teamName, setTeamName] = useState("");
  const [teamEmail, setTeamEmail] = useState("");
  const [teamPassword, setTeamPassword] = useState("");
  const [teamMsg, setTeamMsg] = useState("");
  const [teamError, setTeamError] = useState("");
  const [teamBusy, setTeamBusy] = useState(false);

  async function loadSettings() {
    const res = await fetch("/api/settings");
    const data = await res.json();
    setSettings(data.settings);
    return data.settings as ClinicSettings;
  }

  async function loadStaff() {
    const res = await fetch("/api/users");
    if (!res.ok) return;
    const data = await res.json();
    setStaff(data.users || []);
  }

  useEffect(() => {
    (async () => {
      const me = await fetch("/api/auth/me");
      if (!me.ok) {
        router.push("/login");
        return;
      }
      const { user } = await me.json();
      setUserName(user.name);
      await loadSettings();
      await loadStaff();
    })();
  }, [router]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (res.ok && data.settings) {
      setSettings(data.settings);
      setSavedMsg("Saved to clinic profile — used on next letter generate");
    } else {
      await loadSettings();
      setSavedMsg("Saved to clinic profile — used on next letter generate");
    }
    setSaving(false);
    setTimeout(() => setSavedMsg(""), 4000);
  }

  async function resetDefaults() {
    if (
      !confirm(
        "Reset letterhead to demo defaults? This overwrites the clinic profile."
      )
    ) {
      return;
    }
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reset: true }),
    });
    const data = await res.json();
    if (data.settings) setSettings(data.settings);
    else await loadSettings();
    setSavedMsg("Reset to demo defaults — used on next letter generate");
    setSaving(false);
    setTimeout(() => setSavedMsg(""), 4000);
  }

  async function addStaff(e: React.FormEvent) {
    e.preventDefault();
    setTeamBusy(true);
    setTeamError("");
    setTeamMsg("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: teamName,
        email: teamEmail,
        password: teamPassword,
      }),
    });
    const data = await res.json();
    setTeamBusy(false);
    if (!res.ok) {
      setTeamError(data.error || "Could not create staff user");
      return;
    }
    setTeamMsg(`Created ${data.user.email} — they can log in now`);
    setTeamName("");
    setTeamEmail("");
    setTeamPassword("");
    await loadStaff();
    setTimeout(() => setTeamMsg(""), 5000);
  }

  if (!settings) {
    return (
      <div className="page-shell">
        <AppNav />
        <p className="container-narrow py-8 text-ink-faint">Loading…</p>
      </div>
    );
  }

  const field = (
    key: keyof ClinicSettings,
    label: string,
    required = false
  ) => (
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

  const addr2 = settings.address_line2?.trim();

  return (
    <div className="page-shell">
      <AppNav userName={userName} />
      <main className="container-narrow py-5 sm:py-7">
        <p className="ops-kicker">Clinic</p>
        <h1 className="page-title mt-1">Settings</h1>
        <p className="page-subtitle">
          Letterhead used on generated appeal letters.
        </p>

        <SettingsTenancyBanner />

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

        <div className="card-pad mt-4">
          <p className="ops-kicker">Letterhead preview</p>
          <div className="mt-2 border border-paper-rule bg-paper-raised px-4 py-3 font-serif text-[13px] leading-relaxed text-ink">
            <p className="font-semibold tracking-tight">{settings.clinic_name || "—"}</p>
            <p className="mt-1 text-[12px] text-ink-muted">
              {settings.address_line1 || "—"}
              {addr2 ? (
                <>
                  <br />
                  {addr2}
                </>
              ) : null}
              <br />
              {[settings.city, settings.state].filter(Boolean).join(", ")}
              {settings.zip ? ` ${settings.zip}` : ""}
            </p>
            <p className="mt-1 text-[12px] text-ink-faint">
              Tel {settings.phone || "—"}
              {settings.fax ? ` · Fax ${settings.fax}` : ""}
              {settings.npi ? ` · NPI ${settings.npi}` : ""}
            </p>
            {(settings.signer_name || settings.signer_credentials) && (
              <p className="mt-2 border-t border-paper-rule pt-2 text-[12px] text-ink-muted">
                {settings.signer_name}
                {settings.signer_credentials
                  ? `, ${settings.signer_credentials}`
                  : ""}
              </p>
            )}
          </div>
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
          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:flex-wrap">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary btn-block sm:!w-auto"
            >
              {saving ? "Saving…" : "Save settings"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={resetDefaults}
              className="btn-secondary btn-block sm:!w-auto"
            >
              Reset to demo defaults
            </button>
            {savedMsg && (
              <span className="text-[12.5px] font-medium text-clinical-ok" role="status">
                {savedMsg}
              </span>
            )}
          </div>
        </form>

        <section id="team" className="card-pad mt-6 space-y-3">
          <div>
            <p className="ops-kicker">Team</p>
            <h2 className="mt-1 font-serif text-lg font-semibold tracking-tight text-ink">
              Staff users
            </h2>
            <p className="mt-1 text-[12.5px] text-ink-muted">
              Add email + password accounts for your clinic. New staff join as
              coordinators of the same clinic (no cross-clinic access).
            </p>
          </div>

          <ul className="divide-y divide-paper-rule rounded border border-paper-rule">
            {staff.map((u) => (
              <li
                key={u.id}
                className="flex flex-col gap-0.5 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-[13px] font-medium text-ink">{u.name}</span>
                <span className="font-mono text-[12px] text-ink-muted">{u.email}</span>
              </li>
            ))}
            {!staff.length && (
              <li className="px-3 py-2 text-[12.5px] text-ink-faint">No staff yet</li>
            )}
          </ul>

          <form onSubmit={addStaff} className="space-y-3 border-t border-paper-rule pt-3">
            <p className="text-[12px] font-semibold uppercase tracking-clinical text-ink-faint">
              Add staff user
            </p>
            <label className="block">
              <span className="label">Name</span>
              <input
                className="field"
                value={teamName}
                required
                minLength={2}
                onChange={(e) => setTeamName(e.target.value)}
                autoComplete="off"
              />
            </label>
            <label className="block">
              <span className="label">Email</span>
              <input
                className="field"
                type="email"
                value={teamEmail}
                required
                minLength={8}
                onChange={(e) => setTeamEmail(e.target.value)}
                autoComplete="off"
              />
            </label>
            <label className="block">
              <span className="label">Password (min 8)</span>
              <input
                className="field"
                type="password"
                value={teamPassword}
                required
                minLength={8}
                onChange={(e) => setTeamPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={teamBusy}
                className="btn-primary btn-block sm:!w-auto"
              >
                {teamBusy ? "Creating…" : "Add staff user"}
              </button>
              {teamMsg && (
                <span className="text-[12.5px] font-medium text-clinical-ok" role="status">
                  {teamMsg}
                </span>
              )}
              {teamError && (
                <span className="text-[12.5px] font-medium text-red-700" role="alert">
                  {teamError}
                </span>
              )}
            </div>
          </form>
        </section>

        <SettingsRetentionPanel />
      </main>
    </div>
  );
}
