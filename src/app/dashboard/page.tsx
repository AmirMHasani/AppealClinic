"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { StatusBadge } from "@/components/StatusBadge";
import type { AppealCase, CaseStatus, Indication, PayerId } from "@/lib/types";
import { DENIAL_TYPES, INDICATIONS, PAYERS } from "@/lib/config";

const COUNT_KEYS: CaseStatus[] = ["draft", "ready", "submitted", "won", "partial", "lost"];

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const sec = Math.round((Date.now() - t) / 1000);
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [cases, setCases] = useState<AppealCase[]>([]);
  const [stats, setStats] = useState<{ total: number; counts: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [statusFilter, setStatusFilter] = useState<CaseStatus | "all">("all");
  const [payerFilter, setPayerFilter] = useState<PayerId | "">("");
  const [indicationFilter, setIndicationFilter] = useState<Indication | "">("");
  const [search, setSearch] = useState("");

  async function load() {
    const me = await fetch("/api/auth/me");
    if (!me.ok) {
      router.push("/login");
      return;
    }
    const { user } = await me.json();
    setUserName(user.name);
    const res = await fetch("/api/cases");
    const data = await res.json();
    setCases(data.cases || []);
    setStats(data.stats || null);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function reseed() {
    setSeeding(true);
    await fetch("/api/seed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force: true }),
    });
    await load();
    setSeeding(false);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...cases]
      .filter((c) => {
        if (statusFilter !== "all" && c.outcome.status !== statusFilter) return false;
        if (payerFilter && c.denial.payer_id !== payerFilter) return false;
        if (indicationFilter && c.meta.indication !== indicationFilter) return false;
        if (q) {
          const hay = [
            c.meta.internal_case_id,
            c.meta.requested_drug,
            c.meta.patient_initials || "",
            c.id,
          ]
            .join(" ")
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
  }, [cases, statusFilter, payerFilter, indicationFilter, search]);

  if (loading) {
    return (
      <div className="page-shell">
        <AppNav />
        <div className="container-app py-8">
          <div className="h-6 w-32 animate-pulse rounded bg-brand-100" />
          <div className="mt-4 grid grid-cols-3 gap-2 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="stat-tile h-14 animate-pulse bg-brand-50" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const total = stats?.total ?? cases.length;
  const filtersActive = Boolean(
    statusFilter !== "all" || payerFilter || indicationFilter || search.trim()
  );

  return (
    <div className="page-shell">
      <AppNav userName={userName} />
      <main className="container-app py-5 sm:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="ops-kicker">Queue</p>
            <h1 className="page-title mt-0.5">Cases</h1>
            <p className="page-subtitle">
              <span className="font-mono tabular-nums">{filtered.length}</span>
              {filtersActive ? (
                <>
                  {" "}
                  shown · <span className="font-mono tabular-nums">{total}</span> total
                </>
              ) : (
                <>
                  {" "}
                  total · synthetic demo data
                </>
              )}
            </p>
          </div>
          <div className="flex flex-col gap-1.5 sm:flex-row">
            <button
              onClick={reseed}
              disabled={seeding}
              className="btn-secondary btn-block sm:!w-auto"
            >
              {seeding ? "Seeding…" : "Reload demo"}
            </button>
            <Link href="/cases/new" className="btn-primary btn-block sm:!w-auto">
              New appeal
            </Link>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 lg:grid-cols-7">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`stat-tile text-left transition ${
              statusFilter === "all"
                ? "border-brand-400 bg-brand-50 ring-1 ring-brand-300"
                : "hover:border-brand-300"
            }`}
          >
            <p className="ops-kicker">all</p>
            <p className="mt-0.5 font-mono text-xl font-semibold tabular-nums tracking-tight text-ink">
              {total}
            </p>
          </button>
          {COUNT_KEYS.map((k) => (
            <button
              type="button"
              key={k}
              onClick={() =>
                setStatusFilter((prev) => (prev === k ? "all" : k))
              }
              className={`stat-tile text-left transition ${
                statusFilter === k
                  ? "border-brand-400 bg-brand-50 ring-1 ring-brand-300"
                  : "hover:border-brand-300"
              }`}
            >
              <p className="ops-kicker">{k}</p>
              <p className="mt-0.5 font-mono text-xl font-semibold tabular-nums tracking-tight text-ink">
                {stats?.counts?.[k] ?? 0}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <input
            type="search"
            className="field sm:max-w-[220px]"
            placeholder="Search case id / drug / initials"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search cases"
          />
          <select
            className="field sm:max-w-[180px]"
            value={payerFilter}
            onChange={(e) => setPayerFilter(e.target.value as PayerId | "")}
            aria-label="Filter by payer"
          >
            <option value="">All payers</option>
            {Object.values(PAYERS).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            className="field sm:max-w-[180px]"
            value={indicationFilter}
            onChange={(e) =>
              setIndicationFilter(e.target.value as Indication | "")
            }
            aria-label="Filter by indication"
          >
            <option value="">All indications</option>
            {Object.values(INDICATIONS).map((ind) => (
              <option key={ind.id} value={ind.id}>
                {ind.short} — {ind.label}
              </option>
            ))}
          </select>
          <select
            className="field sm:max-w-[140px]"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as CaseStatus | "all")
            }
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            {COUNT_KEYS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
            <option value="abandoned">abandoned</option>
          </select>
          {filtersActive && (
            <button
              type="button"
              className="btn-secondary text-[12px]"
              onClick={() => {
                setStatusFilter("all");
                setPayerFilter("");
                setIndicationFilter("");
                setSearch("");
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="mt-4 space-y-2 md:hidden">
          {!filtered.length ? (
            <EmptyCases filtered={filtersActive} />
          ) : (
            filtered.map((c) => (
              <Link
                key={c.id}
                href={`/cases/${c.id}`}
                className="card block p-3 transition hover:border-brand-400"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="mono-id">
                      {c.meta.internal_case_id}
                      {c.meta.patient_initials && (
                        <span className="ml-1.5 font-sans font-normal text-ink-faint">
                          ({c.meta.patient_initials})
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] text-ink-muted">
                      {INDICATIONS[c.meta.indication]?.short} ·{" "}
                      {c.meta.requested_drug}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-faint">
                      {PAYERS[c.denial.payer_id]?.name}
                      {c.denial.denial_type
                        ? ` · ${DENIAL_TYPES[c.denial.denial_type]?.label ?? c.denial.denial_type}`
                        : ""}
                      {" · "}
                      {relativeTime(c.updated_at)}
                    </p>
                  </div>
                  <StatusBadge status={c.outcome.status} />
                </div>
              </Link>
            ))
          )}
        </div>

        <div className="mt-4 hidden overflow-hidden card md:block">
          <table className="min-w-full text-left text-[12.5px]">
            <thead className="border-b border-paper-rule bg-paper text-[10px] font-semibold uppercase tracking-clinical text-ink-faint">
              <tr>
                <th className="px-3 py-2">Case</th>
                <th className="px-3 py-2">Indication</th>
                <th className="px-3 py-2">Drug</th>
                <th className="px-3 py-2">Payer</th>
                <th className="px-3 py-2">Denial</th>
                <th className="px-3 py-2">Updated</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-paper-rule last:border-0 hover:bg-brand-50/60"
                >
                  <td className="px-3 py-2.5">
                    <span className="mono-id">{c.meta.internal_case_id}</span>
                    {c.meta.patient_initials && (
                      <span className="ml-1.5 text-ink-faint">
                        ({c.meta.patient_initials})
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-ink-muted">
                    {INDICATIONS[c.meta.indication]?.short}
                  </td>
                  <td className="max-w-[180px] truncate px-3 py-2.5 text-ink-muted">
                    {c.meta.requested_drug}
                  </td>
                  <td className="px-3 py-2.5 text-ink-muted">
                    {PAYERS[c.denial.payer_id]?.name}
                  </td>
                  <td className="max-w-[140px] truncate px-3 py-2.5 text-ink-faint">
                    {DENIAL_TYPES[c.denial.denial_type]?.label ??
                      c.denial.denial_type ??
                      "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] tabular-nums text-ink-faint">
                    {relativeTime(c.updated_at)}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={c.outcome.status} />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Link
                      href={`/cases/${c.id}`}
                      className="link-brand text-[12px]"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={8} className="p-0">
                    <EmptyCases embedded filtered={filtersActive} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function EmptyCases({
  embedded,
  filtered,
}: {
  embedded?: boolean;
  filtered?: boolean;
}) {
  return (
    <div
      className={
        embedded ? "empty-state border-0 shadow-none" : "empty-state"
      }
    >
      <p className="font-serif font-semibold text-ink">
        {filtered ? "No cases match filters" : "No cases in queue"}
      </p>
      <p className="mt-1 max-w-sm text-[12.5px] text-ink-muted">
        {filtered
          ? "Clear filters or adjust search / status / payer / indication."
          : "Create an appeal or reload synthetic demo cases."}
      </p>
      {!filtered && (
        <Link href="/cases/new" className="btn-primary mt-4">
          New appeal
        </Link>
      )}
    </div>
  );
}
