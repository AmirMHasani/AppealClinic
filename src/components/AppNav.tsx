"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/dashboard", label: "Cases" },
  { href: "/cases/new", label: "New appeal" },
  { href: "/settings", label: "Settings" },
  { href: "/upgrade", label: "Plan" },
];

export function AppNav({ userName }: { userName?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-paper-rule bg-white">
      <div className="container-app flex h-11 items-center justify-between gap-3">
        <div className="flex items-center gap-5">
          <Logo href="/dashboard" size="sm" />
          <nav className="hidden items-center gap-0.5 md:flex">
            {LINKS.map((l) => {
              const active =
                l.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded px-2.5 py-1 text-[12.5px] font-medium transition ${
                    active
                      ? "bg-brand-900 text-white"
                      : "text-ink-muted hover:bg-brand-50 hover:text-ink"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {userName && (
            <span className="hidden max-w-[10rem] truncate font-mono text-[11px] text-ink-faint sm:inline">
              {userName}
            </span>
          )}
          <button
            onClick={logout}
            className="btn-secondary hidden !py-1 !text-[11px] sm:inline-flex"
          >
            Log out
          </button>
          <button
            type="button"
            className="btn-secondary !px-2 !py-1 md:hidden"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden>
              {open ? (
                <path
                  d="M4 4l10 10M14 4L4 14"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="square"
                />
              ) : (
                <path
                  d="M3 5h12M3 9h12M3 13h12"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="square"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-paper-rule bg-white md:hidden">
          <nav className="container-app flex flex-col gap-0.5 py-2">
            {LINKS.map((l) => {
              const active =
                l.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`rounded px-2.5 py-2 text-[13px] font-medium ${
                    active
                      ? "bg-brand-900 text-white"
                      : "text-ink hover:bg-brand-50"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
            <button
              onClick={logout}
              className="mt-0.5 rounded px-2.5 py-2 text-left text-[13px] font-medium text-ink hover:bg-brand-50"
            >
              Log out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
