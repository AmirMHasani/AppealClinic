"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { StatusBadge } from "@/components/StatusBadge";
import type { AppealCase, CaseStatus } from "@/lib/types";
import { INDICATIONS, PAYERS } from "@/lib/config";

const STATUSES: CaseStatus[] = [
  "draft",
  "ready",
  "submitted",
  "won",
  "partial",
  "lost",
  "abandoned",
];

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [c, setC] = useState<AppealCase | null>(null);
  const [letter, setLetter] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    const me = await fetch("/api/auth/me");
    if (!me.ok) {
      router.push("/login");
      return;
    }
    const { user } = await me.json();
    setUserName(user.name);
    const res = await fetch(`/api/cases/${id}`);
    if (!res.ok) {
      router.push("/dashboard");
      return;
    }
    const data = await res.json();
    setC(data.case);
    setLetter(data.case.letter_markdown || "");
  }

  useEffect(() => {
    load();
  }, [id]);

  async function regenerate() {
    setSaving(true);
    const res = await fetch(`/api/cases/${id}/generate`, { method: "POST" });
    const data = await res.json();
    setC(data.case);
    setLetter(data.case.letter_markdown || "");
    setSaving(false);
    setMsg("Letter regenerated");
  }

  async function saveLetter() {
    setSaving(true);
    const res = await fetch(`/api/cases/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ letter_markdown: letter }),
    });
    const data = await res.json();
    setC(data.case);
    setSaving(false);
    setMsg("Letter saved");
  }

  async function saveOutcome(patch: Partial<AppealCase["outcome"]>) {
    if (!c) return;
    const res = await fetch(`/api/cases/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome: { ...c.outcome, ...patch } }),
    });
    const data = await res.json();
    setC(data.case);
    setMsg("Outcome updated");
  }

  function copyLetter() {
    navigator.clipboard.writeText(letter);
    setMsg("Copied to clipboard");
  }

  if (!c) {
    return (
      <div className="page-shell">
        <AppNav />
        <p className="container-app py-10 text-slate-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="page-shell pb-8">
      <AppNav userName={userName} />
      <main className="container-app py-6 sm:py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Link href="/dashboard" className="link-brand text-sm">
              ← Dashboard
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {c.meta.internal_case_id}
              </h1>
              <StatusBadge status={c.outcome.status} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {INDICATIONS[c.meta.indication].label} · {c.meta.requested_drug} ·{" "}
              {PAYERS[c.denial.payer_id].name}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={regenerate}
              disabled={saving}
              className="btn-secondary"
            >
              Regenerate
            </button>
            <button
              onClick={saveLetter}
              disabled={saving}
              className="btn-secondary"
            >
              Save letter
            </button>
            <button onClick={copyLetter} className="btn-secondary">
              Copy
            </button>
            <a href={`/api/cases/${id}/export/docx`} className="btn-primary">
              Export DOCX
            </a>
            <Link
              href={`/cases/${id}/print`}
              target="_blank"
              className="btn-secondary border-brand-200 text-brand-800 hover:bg-brand-50"
            >
              Print / PDF
            </Link>
          </div>
        </div>
        {msg && (
          <p className="mt-3 text-sm font-medium text-emerald-600" role="status">
            {msg}
          </p>
        )}

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="card-pad">
              <div className="flex items-center justify-between gap-2">
                <h2 className="section-title">Letter</h2>
                <span className="text-xs font-medium text-slate-400">Markdown</span>
              </div>
              <textarea
                className="field mt-3 h-[min(70vh,560px)] font-mono text-xs leading-relaxed sm:text-xs"
                value={letter}
                onChange={(e) => setLetter(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="card-pad">
              <h2 className="section-title">Evidence checklist</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {(c.checklist || []).map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500/30"
                    />
                    <span className="leading-snug text-slate-700">{item}</span>
                  </li>
                ))}
                {!c.checklist?.length && (
                  <li className="text-slate-400">Generate letter to build checklist</li>
                )}
              </ul>
            </div>

            <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 p-5 shadow-card">
              <h2 className="font-semibold text-amber-950">Gaps</h2>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-amber-900">
                {(c.gaps || []).map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
                {!c.gaps?.length && <li>No gaps flagged</li>}
              </ul>
            </div>

            <div className="card-pad space-y-4">
              <h2 className="section-title">Status / outcome</h2>
              <label className="block">
                <span className="label">Status</span>
                <select
                  className="field"
                  value={c.outcome.status}
                  onChange={(e) =>
                    saveOutcome({ status: e.target.value as CaseStatus })
                  }
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="label">Submitted at</span>
                <input
                  type="datetime-local"
                  className="field"
                  value={toLocalInput(c.outcome.submitted_at)}
                  onChange={(e) =>
                    saveOutcome({
                      submitted_at: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : undefined,
                    })
                  }
                />
              </label>
              <label className="block">
                <span className="label">Decision at</span>
                <input
                  type="datetime-local"
                  className="field"
                  value={toLocalInput(c.outcome.decision_at)}
                  onChange={(e) =>
                    saveOutcome({
                      decision_at: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : undefined,
                    })
                  }
                />
              </label>
              <label className="block">
                <span className="label">Dollars recovered</span>
                <input
                  type="number"
                  className="field"
                  value={c.outcome.dollars_recovered ?? ""}
                  onChange={(e) =>
                    saveOutcome({
                      dollars_recovered:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="block">
                <span className="label">Notes</span>
                <textarea
                  className="field"
                  rows={3}
                  value={c.outcome.outcome_notes || ""}
                  onChange={(e) =>
                    setC({
                      ...c,
                      outcome: { ...c.outcome, outcome_notes: e.target.value },
                    })
                  }
                  onBlur={() =>
                    saveOutcome({ outcome_notes: c.outcome.outcome_notes })
                  }
                />
              </label>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function toLocalInput(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
