"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@appealclinic.local");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Login failed");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="page-shell flex min-h-screen flex-col">
      <div className="flex flex-1 items-center justify-center px-3 py-8">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center justify-between">
            <Logo size="sm" />
            <Link href="/" className="text-[12px] text-ink-muted hover:text-ink">Home</Link>
          </div>
          <div className="card overflow-hidden">
            <div className="border-b border-paper-rule bg-brand-950 px-3.5 py-2.5">
              <p className="font-mono text-[10px] uppercase tracking-clinical text-brand-200">Workspace access</p>
              <h1 className="mt-0.5 font-serif text-lg font-semibold text-white">Sign in</h1>
            </div>
            <div className="p-3.5 sm:p-4">
              <p className="text-[12px] text-ink-muted">Demo credentials prefilled. Synthetic cases only.</p>
              <p className="mt-1.5 font-mono text-[11px] text-ink-faint">demo@appealclinic.local / demo1234</p>
              <form onSubmit={onSubmit} className="mt-4 space-y-3">
                <label className="block">
                  <span className="label">Email</span>
                  <input className="field font-mono" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </label>
                <label className="block">
                  <span className="label">Password</span>
                  <input className="field font-mono" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </label>
                {error && (
                  <p className="rounded border border-rose-200 bg-rose-50 px-2.5 py-2 text-[12.5px] text-clinical-danger" role="alert">{error}</p>
                )}
                <button type="submit" disabled={loading} className="btn-primary btn-block">
                  {loading ? "Signing in…" : "Enter workspace"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
