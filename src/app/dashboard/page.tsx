"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { StatusBadge } from "@/components/StatusBadge";
import type { AppealCase } from "@/lib/types";
import { INDICATIONS, PAYERS } from "@/lib/config";

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [cases, setCases] = useState<AppealCase[]>([]);
  const [stats, setStats] = useState<{ total: number; counts: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  async function load() {
    const me = await fetch("/api/auth/me");
    if (!me.ok) { router.push("/login"); return; }
    const { user } = await me.json();
    setUserName(user.name);
    const res = await fetch("/api/cases");
    const data = await res.json();
    setCases(data.cases || []);
    setStats(data.stats || null);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function reseed() {
    setSeeding(true);
    await fetch("/api/seed", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ force: true }) });
    await load();
    setSeeding(false);
  }

  if (loading) {
    return (
      <div className="page-shell"><AppNav /><div className="container-app py-8"><div className="h-6 w-32 animate-pulse rounded bg-brand-100" /><div className="mt-4 grid grid-cols-3 gap-2 lg:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => (<div key={i} className="stat-tile h-14 animate-pulse bg-brand-50" />))}</div></div></div>
    );
  }

  const countKeys = ["draft", "ready", "submitted", "won", "partial", "lost"];

  return (
    <div className="page-shell">
      <AppNav userName={userName} />
      <main className="container-app py-5 sm:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="ops-kicker">Queue</p>
            <h1 className="page-title mt-0.5">Cases</h1>
            <p className="page-subtitle"><span className="font-mono tabular-nums">{stats?.total ?? 0}</span> total · synthetic demo data</p>
          </div>
          <div className="flex flex-col gap-1.5 sm:flex-row">
            <button onClick={reseed} disabled={seeding} className="btn-secondary btn-block sm:!w-auto">{seeding ? "Seeding…" : "Reload demo"}</button>
            <Link href="/cases/new" className="btn-primary btn-block sm:!w-auto">New appeal</Link>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 lg:grid-cols-6">
          {countKeys.map((k) => (
            <div key={k} className="stat-tile"><p className="ops-kicker">{k}</p><p className="mt-0.5 font-mono text-xl font-semibold tabular-nums tracking-tight text-ink">{stats?.counts?.[k] ?? 0}</p></div>
          ))}
        </div>

        <div className="mt-4 space-y-2 md:hidden">
          {!cases.length ? <EmptyCases /> : cases.map((c) => (
            <Link key={c.id} href={`/cases/${c.id}`} className="card block p-3 transition hover:border-brand-400">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="mono-id">
                    {c.meta.internal_case_id}
                    {c.meta.patient_initials && <span className="ml-1.5 font-sans font-normal text-ink-faint">({c.meta.patient_initials})</span>}
                  </p>
                  <p className="mt-0.5 truncate text-[12px] text-ink-muted">{INDICATIONS[c.meta.indication]?.short} · {c.meta.requested_drug}</p>
                  <p className="mt-0.5 text-[11px] text-ink-faint">{PAYERS[c.denial.payer_id]?.name}</p>
                </div>
                <StatusBadge status={c.outcome.status} />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-4 hidden overflow-hidden card md:block">
          <table className="min-w-full text-left text-[12.5px]">
            <thead className="border-b border-paper-rule bg-paper text-[10px] font-semibold uppercase tracking-clinical text-ink-faint">
              <tr>
                <th className="px-3 py-2">Case</th>
                <th className="px-3 py-2">Indication</th>
                <th className="px-3 py-2">Drug</th>
                <th className="px-3 py-2">Payer</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id} className="border-b border-paper-rule last:border-0 hover:bg-brand-50/60">
                  <td className="px-3 py-2.5">
                    <span className="mono-id">{c.meta.internal_case_id}</span>
                    {c.meta.patient_initials && <span className="ml-1.5 text-ink-faint">({c.meta.patient_initials})</span>}
                  </td>
                  <td className="px-3 py-2.5 text-ink-muted">{INDICATIONS[c.meta.indication]?.short}</td>
                  <td className="max-w-[180px] truncate px-3 py-2.5 text-ink-muted">{c.meta.requested_drug}</td>
                  <td className="px-3 py-2.5 text-ink-muted">{PAYERS[c.denial.payer_id]?.name}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={c.outcome.status} /></td>
                  <td className="px-3 py-2.5 text-right">
                    <Link href={`/cases/${c.id}`} className="link-brand text-[12px]">Open</Link>
                  </td>
                </tr>
              ))}
              {!cases.length && (
                <tr><td colSpan={6} className="p-0"><EmptyCases embedded /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function EmptyCases({ embedded }: { embedded?: boolean }) {
  return (
    <div className={embedded ? "empty-state border-0 shadow-none" : "empty-state"}>
      <p className="font-serif font-semibold text-ink">No cases in queue</p>
      <p className="mt-1 max-w-sm text-[12.5px] text-ink-muted">Create an appeal or reload synthetic demo cases.</p>
      <Link href="/cases/new" className="btn-primary mt-4">New appeal</Link>
    </div>
  );
}
