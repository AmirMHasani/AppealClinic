"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { AppealCase } from "@/lib/types";

/** Print-friendly route — use browser Print → Save as PDF */
export default function PrintPage() {
  const { id } = useParams<{ id: string }>();
  const [c, setC] = useState<AppealCase | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/cases/${id}`);
      if (res.ok) {
        const data = await res.json();
        setC(data.case);
        setTimeout(() => window.print(), 400);
      }
    })();
  }, [id]);

  if (!c) return <p className="p-8 text-slate-500">Loading…</p>;

  const html = markdownToSimpleHtml(c.letter_markdown || "No letter generated yet.");

  return (
    <div className="mx-auto max-w-3xl bg-white p-10 font-sans text-sm leading-relaxed text-black print:p-0">
      <div className="mb-4 flex justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center justify-center rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
        >
          Print / Save as PDF
        </button>
      </div>
      <article dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

function markdownToSimpleHtml(md: string): string {
  return md
    .split("\n")
    .map((line) => {
      if (line.startsWith("## ")) return `<h2 style="margin-top:1.25rem;font-size:1.1rem">${esc(line.slice(3))}</h2>`;
      if (line.startsWith("### ")) return `<h3 style="margin-top:1rem;font-size:1rem">${esc(line.slice(4))}</h3>`;
      if (line.startsWith("> ")) return `<blockquote style="margin:0.25rem 0;padding-left:0.75rem;border-left:3px solid #ccc;font-style:italic">${inline(line.slice(2))}</blockquote>`;
      if (line.trim() === "---") return `<hr style="margin:1rem 0;border:none;border-top:1px solid #ddd"/>`;
      if (line.startsWith("| ")) return `<div style="font-family:monospace;font-size:11px">${esc(line)}</div>`;
      if (!line.trim()) return "<br/>";
      return `<p style="margin:0.35rem 0">${inline(line)}</p>`;
    })
    .join("\n");
}

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inline(s: string) {
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}
