import Link from "next/link";
import { Logo } from "@/components/Logo";

const BENEFITS = [
  {
    t: "Turn denials into filed appeals the same day",
    d: "Structured appeal drafts mapped to the denial reason, so cases don’t sit in the “we’ll get to it” pile.",
    n: "01",
  },
  {
    t: "Built for biologic / JAK PA reality",
    d: "Chart-backed medical necessity language for the drugs and step-therapy fights derm clinics actually run — not generic claim-appeal boilerplate.",
    n: "02",
  },
  {
    t: "Protect staff time without dropping revenue",
    d: "Keep dedicated PA hours on exceptions and peer-to-peers instead of blank-page letter writing, while more overturnable denials actually get submitted.",
    n: "03",
  },
];

const PROOF = [
  {
    line: "~40 PAs/physician/week; ~13 hrs/week",
    source: "AMA prior auth survey",
    mark: "1",
  },
  {
    line: "High overturn when appealed, but denials rarely appealed",
    source: "KFF",
    mark: "2",
  },
  {
    line: "In one derm department study, only ~30% of denied PAs were appealed",
    source: "Utah / JAMA Derm",
    mark: "3",
  },
];

export default function LandingPage() {
  return (
    <div className="page-shell">
      <header className="site-header">
        <div className="container-app flex h-12 items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-1.5">
            <Link href="/pricing" className="btn-ghost !py-1.5 hidden sm:inline-flex">
              Pricing
            </Link>
            <Link href="/login" className="btn-primary !py-1.5">
              Log in
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-paper-rule">
          <div className="container-app pb-12 pt-10 sm:pb-16 sm:pt-14">
            <p className="ops-kicker mb-3 text-accent">
              Independent dermatology · PA desk ops
            </p>
            <h1 className="max-w-3xl font-serif text-[1.75rem] font-semibold leading-[1.15] tracking-tight text-ink sm:text-4xl sm:leading-[1.12]">
              Denied biologic and JAK authorizations are costing your clinic hours
              — and patients weeks.
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-ink-muted sm:text-base">
              AppealClinic drafts payer-ready appeal letters for independent
              dermatology practices so PA coordinators and practice managers can
              fight denials without rewriting every chart from scratch.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
              <Link href="/login" className="btn-primary btn-lg btn-block sm:!w-auto">
                Start a limited pilot for your PA desk
              </Link>
              <Link href="/pricing" className="btn-secondary btn-lg btn-block sm:!w-auto">
                View pricing
              </Link>
            </div>
            <p className="mt-3 max-w-xl text-[12.5px] leading-snug text-ink-faint">
              Bring 10 recent biologic/JAK denials; we’ll return appeal-ready
              drafts your coordinator can review, edit, and file. Demo login
              available for now.
            </p>

            <div className="mt-10 grid gap-2 sm:mt-12 sm:grid-cols-3 sm:gap-3">
              {PROOF.map((p) => (
                <div key={p.mark} className="proof-chip">
                  <p className="text-[13px] font-semibold leading-snug text-ink">
                    {p.line}
                  </p>
                  <p className="mt-1.5 text-[11px] text-ink-faint">
                    <span className="font-mono text-[10px] text-accent">
                      [{p.mark}]
                    </span>{" "}
                    {p.source}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container-app py-12 sm:py-16">
          <p className="ops-kicker mb-4">Why clinics use it</p>
          <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            {BENEFITS.map((c) => (
              <div key={c.n} className="card-pad">
                <p className="font-mono text-[11px] font-medium text-accent">
                  {c.n}
                </p>
                <h3 className="mt-2 font-serif text-[15px] font-semibold leading-snug text-ink">
                  {c.t}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
                  {c.d}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded border border-paper-rule bg-paper-raised px-4 py-3.5 text-[13px] text-ink-muted">
            <p>
              <span className="font-semibold text-ink">PHI note:</span>{" "}
              Redaction-first UI. This demo uses synthetic data only — do not
              enter real patient identifiers in this MVP build. No EHR
              connection. No auto-submit — you review, edit, and file.
            </p>
          </div>

          <div className="mt-10 border-t border-paper-rule pt-6">
            <ol className="source-footnote space-y-1">
              <li>
                [1] AMA prior authorization physician survey — ~40 PAs per
                physician per week; ~13 hours/week.{" "}
                <a
                  href="https://www.ama-assn.org/practice-management/prior-authorization/only-1-3-doctors-trusts-insurers-prior-authorization"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ama-assn.org
                </a>
              </li>
              <li>
                [2] KFF — high overturn rates when PA denials are appealed;
                denials are rarely appealed.{" "}
                <a
                  href="https://www.kff.org/medicare/medicare-advantage-insurers-made-nearly-53-million-prior-authorization-determinations-in-2024/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  kff.org
                </a>
              </li>
              <li>
                [3] University of Utah dermatology department study (JAMA
                Dermatology) — of denied PAs, only ~30% were appealed.{" "}
                <a
                  href="https://pmc.ncbi.nlm.nih.gov/articles/PMC7450401/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  PMC7450401
                </a>
              </li>
            </ol>
          </div>
        </section>
      </main>

      <footer className="border-t border-paper-rule bg-paper-raised">
        <div className="container-app flex flex-col gap-3 py-7 sm:flex-row sm:items-center sm:justify-between">
          <Logo size="sm" />
          <p className="text-[11px] text-ink-faint">
            © {new Date().getFullYear()} AppealClinic · Human-in-the-loop appeal
            drafts
          </p>
          <div className="flex gap-4 text-[13px]">
            <Link href="/pricing" className="text-ink-muted hover:text-ink">
              Pricing
            </Link>
            <Link href="/login" className="text-ink-muted hover:text-ink">
              Log in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
