import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function PricingPage() {
  return (
    <div className="page-shell">
      <header className="site-header">
        <div className="container-app flex h-12 items-center justify-between">
          <Logo size="sm" />
          <Link href="/login" className="btn-primary !py-1.5">
            Log in
          </Link>
        </div>
      </header>
      <div className="container-narrow py-10 sm:py-14">
        <Link href="/" className="link-brand text-[13px]">
          ← Back
        </Link>
        <h1 className="mt-4 page-title">Pricing</h1>
        <p className="page-subtitle !text-[14px]">
          Proposed positioning for independent derm clinics (not billed in this
          demo).
        </p>
        <div className="card mt-8 overflow-hidden">
          <div className="border-b border-paper-rule bg-paper px-5 py-5 sm:px-7">
            <p className="ops-kicker text-accent">Per location</p>
            <p className="mt-2 font-serif text-4xl font-semibold tracking-tight text-ink">
              $249
              <span className="text-lg font-sans font-normal text-ink-faint">
                /mo
              </span>
            </p>
          </div>
          <div className="px-5 py-5 sm:px-7">
            <ul className="space-y-2.5 text-[13px] text-ink">
              {[
                "Unlimited appeal drafts",
                "DOCX + PDF export",
                "Multi-payer packs (UHC, Aetna, Cigna, Anthem, Humana, IBX)",
                "Outcome tracking ($ recovered)",
                "3 free drafts trial concept",
              ].map((item) => (
                <li key={item} className="flex gap-2.5">
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M3.5 8.5l3 3 6-7"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                    />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/upgrade"
              className="btn-primary btn-lg mt-7 btn-block sm:!inline-flex sm:!w-auto"
            >
              Upgrade (after security review)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
