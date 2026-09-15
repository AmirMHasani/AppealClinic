"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { AppealCase } from "@/lib/types";

const STORAGE_KEY = "ac_pilot_checklist_v1";

type ManualFlags = {
  letterheadReviewed?: boolean;
  exported?: boolean;
  collapsed?: boolean;
};

type Props = {
  cases: AppealCase[];
  hasSession: boolean;
};

function loadFlags(): ManualFlags {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as ManualFlags;
  } catch {
    return {};
  }
}

function saveFlags(flags: ManualFlags) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
}

export function PilotChecklist({ cases, hasSession }: Props) {
  const [flags, setFlags] = useState<ManualFlags>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setFlags(loadFlags());
    setReady(true);
  }, []);

  const derived = useMemo(() => {
    const caseCount = cases.length;
    const hasLetter = cases.some((c) => Boolean(c.letter_markdown?.trim()));
    const hasOutcome = cases.some((c) =>
      ["submitted", "won", "partial", "lost", "abandoned"].includes(
        c.outcome?.status
      )
    );
    return { caseCount, hasLetter, hasOutcome };
  }, [cases]);

  function patch(p: Partial<ManualFlags>) {
    setFlags((prev) => {
      const next = { ...prev, ...p };
      saveFlags(next);
      return next;
    });
  }

  const items: {
    id: string;
    label: string;
    done: boolean;
    href?: string;
    hrefLabel?: string;
    onMark?: () => void;
    markLabel?: string;
  }[] = [
    {
      id: "login",
      label: "Log in",
      done: hasSession,
      href: hasSession ? undefined : "/login",
      hrefLabel: "Log in",
    },
    {
      id: "letterhead",
      label: "Review/set letterhead (Settings)",
      done: Boolean(flags.letterheadReviewed),
      href: "/settings",
      hrefLabel: "Open Settings",
      onMark: () => patch({ letterheadReviewed: true }),
      markLabel: "Mark done",
    },
    {
      id: "cases",
      label: `Create or open 10 denial cases (${Math.min(derived.caseCount, 10)}/10)`,
      done: derived.caseCount >= 10,
      href: "/cases/new",
      hrefLabel: "New appeal",
    },
    {
      id: "generate",
      label: "Generate letter on at least one case",
      done: derived.hasLetter,
      href: cases[0] ? `/cases/${cases[0].id}` : "/dashboard",
      hrefLabel: cases[0] ? "Open a case" : "Cases",
    },
    {
      id: "export",
      label: "Export DOCX or print",
      done: Boolean(flags.exported),
      href: cases.find((c) => c.letter_markdown)
        ? `/cases/${cases.find((c) => c.letter_markdown)!.id}/print`
        : cases[0]
          ? `/cases/${cases[0].id}`
          : "/dashboard",
      hrefLabel: "Print / export",
      onMark: () => patch({ exported: true }),
      markLabel: "Mark done",
    },
    {
      id: "outcome",
      label: "Log an outcome (submitted/won/etc.)",
      done: derived.hasOutcome,
      href: cases[0] ? `/cases/${cases[0].id}` : "/dashboard",
      hrefLabel: "Log outcome",
    },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const collapsed = Boolean(flags.collapsed);

  if (!ready) return null;

  return (
    <div className="card mt-4 overflow-hidden border-brand-200">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 bg-brand-50 px-3 py-2.5 text-left"
        onClick={() => patch({ collapsed: !collapsed })}
        aria-expanded={!collapsed}
      >
        <div>
          <p className="ops-kicker text-brand-800">Pilot checklist</p>
          <p className="mt-0.5 text-[13px] font-semibold tracking-tight text-ink">
            {doneCount}/{items.length} complete
          </p>
        </div>
        <span className="font-mono text-[11px] text-ink-faint">
          {collapsed ? "Expand" : "Collapse"}
        </span>
      </button>
      {!collapsed && (
        <ul className="divide-y divide-paper-rule">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-1.5 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-2">
                <span
                  className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border font-mono text-[10px] ${
                    item.done
                      ? "border-clinical-ok bg-emerald-50 text-clinical-ok"
                      : "border-paper-rule text-ink-faint"
                  }`}
                  aria-hidden
                >
                  {item.done ? "✓" : ""}
                </span>
                <span
                  className={`text-[12.5px] ${
                    item.done ? "text-ink-muted line-through" : "text-ink"
                  }`}
                >
                  {item.label}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pl-6 sm:pl-0">
                {item.href && !item.done && (
                  <Link href={item.href} className="btn-secondary !py-0.5 !text-[11px]">
                    {item.hrefLabel}
                  </Link>
                )}
                {item.onMark && !item.done && (
                  <button
                    type="button"
                    className="btn-secondary !py-0.5 !text-[11px]"
                    onClick={item.onMark}
                  >
                    {item.markLabel}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
