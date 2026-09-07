import Link from "next/link";
import { AppNav } from "@/components/AppNav";

export default function UpgradeCancelPage() {
  return (
    <div className="page-shell">
      <AppNav />
      <main className="mx-auto w-full max-w-lg px-3 py-8 sm:px-5">
        <p className="ops-kicker">Checkout</p>
        <h1 className="page-title mt-1">Checkout canceled</h1>
        <p className="page-subtitle">
          No charge was made. You can return to the plan page anytime.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link href="/upgrade" className="btn-primary">
            Back to plan
          </Link>
          <Link href="/dashboard" className="btn-secondary">
            Cases
          </Link>
        </div>
      </main>
    </div>
  );
}
