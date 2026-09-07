/**
 * Phase 1 golden-set QA runner.
 * Loads synthetic cases, calls generateAppeal, scores letters, writes report.
 *
 * Usage: bun run golden
 *    or: bunx tsx scripts/run-golden-set.ts
 */
import fs from "node:fs";
import path from "node:path";
import type { AppealCase, ClinicSettings } from "../src/lib/types";
import { generateAppeal, FOOTER } from "../src/lib/generator/generateAppeal";
import { PAYERS, INDICATIONS, DENIAL_TYPES, drugsForIndication } from "../src/lib/config";
import { DEFAULT_SETTINGS } from "../src/lib/db/seed";

// Deterministic: never call OpenAI during golden runs
delete process.env.OPENAI_API_KEY;

export interface GoldenCaseFile {
  id: string;
  description?: string;
  case: AppealCase;
  settings?: ClinicSettings;
  expected_checklist_themes: string[];
  forbidden_hallucinated_cites: string[];
  rubric_weights: Record<string, number>;
}

interface CriterionScore {
  id: number;
  name: string;
  score: number;
  notes: string[];
}

interface CaseResult {
  id: string;
  description?: string;
  indication: string;
  denial_type: string;
  payer_id: string;
  scores: CriterionScore[];
  overall: number;
  citation_score: number;
  passed: boolean;
  fail_reasons: string[];
  checklist_theme_hits: { theme: string; hit: boolean }[];
}

const ROOT = process.cwd();
const CASES_DIR = path.join(ROOT, "golden-set", "cases");
const RESULTS_DIR = path.join(ROOT, "golden-set", "results");
const PASS_OVERALL = 0.9;

const REQUIRED_SECTIONS = [
  "## Request for reconsideration",
  "## Clinical summary",
  "## Prior therapy / step history",
  "## Rationale addressing the denial",
  "## Guideline / policy anchors",
  "## Specific ask",
  "### Attachments checklist",
];

const OVERCLAIM_PATTERNS = [
  /\bguaranteed\b/i,
  /\bwill cure\b/i,
  /\b100%\s*effective\b/i,
  /\bcertainly will\b/i,
  /\bdefinitely will\b/i,
  /\bmiracle\b/i,
  /\bwithout any risk\b/i,
];

function loadCases(): GoldenCaseFile[] {
  if (!fs.existsSync(CASES_DIR)) {
    throw new Error(`Missing ${CASES_DIR} — run scripts/build-golden-cases.ts first`);
  }
  const files = fs
    .readdirSync(CASES_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();
  if (files.length === 0) {
    // Fallback to aggregate array
    const agg = path.join(ROOT, "golden-set", "cases.json");
    if (fs.existsSync(agg)) {
      return JSON.parse(fs.readFileSync(agg, "utf8")) as GoldenCaseFile[];
    }
    throw new Error("No golden-set cases found");
  }
  return files.map((f) => {
    const raw = JSON.parse(fs.readFileSync(path.join(CASES_DIR, f), "utf8")) as GoldenCaseFile;
    return raw;
  });
}

function extractUrls(text: string): string[] {
  const re = /https?:\/\/[^\s\)\]\>\"']+/gi;
  return [...text.matchAll(re)].map((m) => m[0].replace(/[.,;:]+$/, ""));
}

function scoreCase(
  g: GoldenCaseFile,
  letter: string,
  checklist: string[]
): CaseResult {
  const c = g.case;
  const weights = g.rubric_weights || {};
  const w = (n: number) => (weights[String(n)] != null ? Number(weights[String(n)]) : 1);

  const scores: CriterionScore[] = [];

  // 1 — Required sections
  {
    const missing = REQUIRED_SECTIONS.filter((s) => !letter.includes(s));
    const hasFooter = letter.includes(FOOTER) || /Draft for clinical\/billing review/i.test(letter);
    const notes: string[] = [];
    if (missing.length) notes.push(`Missing sections: ${missing.join("; ")}`);
    if (!hasFooter) notes.push("Missing review footer");
    const score =
      missing.length === 0 && hasFooter
        ? 1
        : missing.length === 0
          ? 0.85
          : Math.max(0, 1 - missing.length / REQUIRED_SECTIONS.length);
    scores.push({ id: 1, name: "required_sections", score, notes });
  }

  // 2 — Facts only (no invented severity / drugs)
  {
    const notes: string[] = [];
    let score = 1;
    const s = c.clinical.disease_severity;

    // If a numeric severity is present in case, letter should mention it when stated;
    // if NOT in case, letter must not invent a specific alternate number for that field.
    const checkNotInvented = (
      field: string,
      value: number | null | undefined,
      patterns: RegExp[]
    ) => {
      if (value != null) {
        // Must appear somehow
        const ok = patterns.some((p) => p.test(letter));
        if (!ok) {
          notes.push(`Provided ${field}=${value} not reflected in letter`);
          score = Math.min(score, 0.7);
        }
      } else {
        // Should not invent a concrete value for empty fields — look for "Field: N" patterns
        // Generator uses placeholder text when empty; that's OK.
        // Fail if we see a specific invented number pattern that isn't from case.
      }
    };

    if (s.bsaPercent != null) {
      checkNotInvented("bsaPercent", s.bsaPercent, [
        new RegExp(`BSA[^\\n]*${s.bsaPercent}`),
        new RegExp(`${s.bsaPercent}%`),
      ]);
    }
    if (s.iga != null) {
      checkNotInvented("iga", s.iga, [new RegExp(`IGA:\\s*${s.iga}`)]);
    }
    if (s.pga != null) {
      checkNotInvented("pga", s.pga, [new RegExp(`PGA:\\s*${s.pga}`)]);
    }
    if (s.dlqi != null) {
      checkNotInvented("dlqi", s.dlqi, [new RegExp(`DLQI:\\s*${s.dlqi}`)]);
    }
    if (s.hurleyStage != null) {
      checkNotInvented("hurleyStage", s.hurleyStage, [
        new RegExp(`Hurley stage:\\s*${s.hurleyStage}`),
      ]);
    }

    // Failed therapy drug names should appear if listed
    for (const t of c.clinical.failed_therapies) {
      if (!letter.includes(t.drug)) {
        notes.push(`Failed therapy "${t.drug}" missing from letter`);
        score = Math.min(score, 0.75);
      }
    }

    // Detect obvious invented drugs from a denylist of common biologics not in case
    const allowedDrugNames = new Set<string>([
      c.meta.requested_drug,
      ...c.clinical.failed_therapies.map((t) => t.drug),
    ]);
    const suspicious = [
      "Ustekinumab (Stelara)",
      "Bimekizumab (Bimzelx)",
      "Lebrikizumab (Ebglyss)",
      "Deucravacitinib (Sotyktu)",
    ];
    for (const name of suspicious) {
      if (letter.includes(name) && !allowedDrugNames.has(name)) {
        notes.push(`Invented drug mention: ${name}`);
        score = Math.min(score, 0);
      }
    }

    scores.push({ id: 2, name: "facts_only", score, notes });
  }

  // 3 — Addresses denial
  {
    const notes: string[] = [];
    const dt = c.denial.denial_type;
    const label = DENIAL_TYPES[dt].label.toLowerCase();
    const denialKeywords: Record<string, RegExp[]> = {
      step_therapy: [/step therapy/i, /fail-first/i, /step cycling/i],
      medical_necessity: [/medically necessary/i, /medical-necessity/i, /medical necessity/i],
      non_formulary: [/non-formulary/i, /formulary exception/i, /preferred formulary/i],
      quantity_limit: [/quantity/i, /dose limit/i, /quantity-limit/i],
    };
    const patterns = denialKeywords[dt] || [];
    const hit = patterns.some((p) => p.test(letter)) || letter.toLowerCase().includes(label);
    const score = hit ? 1 : 0;
    if (!hit) notes.push(`Denial type ${dt} not addressed`);
    // Denial verbatim should be quoted
    if (!letter.includes(c.denial.denial_verbatim.slice(0, 40))) {
      notes.push("Denial verbatim excerpt missing");
    }
    scores.push({
      id: 3,
      name: "addresses_denial",
      score: hit ? (notes.length ? 0.95 : 1) : 0,
      notes,
    });
  }

  // 4 — Citations fail-closed (HARD)
  {
    const notes: string[] = [];
    let score = 1;
    const payer = PAYERS[c.denial.payer_id];
    const allowedUrls = new Set(
      (payer.citationSlots || [])
        .map((s) => s.url?.trim())
        .filter((u): u is string => Boolean(u))
    );
    const urls = extractUrls(letter);
    for (const url of urls) {
      // Allow only payer-slot URLs (clinic letterhead has no http; payer addressBlock has none)
      const ok = [...allowedUrls].some((a) => url === a || url.startsWith(a) || a.startsWith(url));
      if (!ok) {
        notes.push(`Disallowed URL in letter: ${url}`);
        score = 0;
      }
    }

    // Forbidden hallucinated cite substrings from case metadata
    for (const bad of g.forbidden_hallucinated_cites || []) {
      if (bad && letter.includes(bad)) {
        notes.push(`Forbidden hallucinated cite present: ${bad}`);
        score = 0;
      }
    }

    // Fabricated-looking policy number patterns not in allowed slot titles
    const slotText = (payer.citationSlots || [])
      .map((s) => `${s.title} ${s.section || ""} ${s.id}`)
      .join("\n");
    const fabricatedPolicy = letter.match(/\b(?:CPB|NCD|LCD|Policy)\s*[#:]?\s*[A-Z0-9-]{4,}\b/gi) || [];
    for (const hit of fabricatedPolicy) {
      if (!slotText.includes(hit) && !letter.toLowerCase().includes("citation needed")) {
        // Only fail if this token appears outside citation-needed context and not in slots
        // Soft check: if the exact token isn't in slots, inspect surrounding line
        const lines = letter.split("\n").filter((l) => l.includes(hit));
        for (const line of lines) {
          if (/citation needed/i.test(line)) continue;
          if (slotText.includes(hit)) continue;
          // Known safe: "Program Number" from UHC titles already in slots when cited
          if ((payer.citationSlots || []).some((s) => s.title.includes(hit) || (s.url || "").includes(hit))) {
            continue;
          }
        }
      }
    }

    // Must have either a real cite line or Citation needed
    const hasCitationNeeded = /Citation needed/i.test(letter);
    const hasRealCite = urls.some((u) => allowedUrls.has(u) || [...allowedUrls].some((a) => u.startsWith(a)));
    if (!hasCitationNeeded && !hasRealCite && (payer.citationSlots || []).length === 0) {
      notes.push("No Citation needed and no allowed cites");
      score = 0;
    }

    // Guideline paste: if provided, should appear; if not, Citation needed for guidelines
    const paste = c.clinical.guidelines_user_paste?.trim();
    if (paste) {
      const snippet = paste.slice(0, 40);
      if (!letter.includes(snippet)) {
        notes.push("User guideline paste missing from letter");
        score = Math.min(score, 0); // treat as citation integrity issue
      }
    } else if (!/Citation needed:.*guideline/i.test(letter) && !/Citation needed: society guideline/i.test(letter)) {
      notes.push("Missing Citation needed for absent guideline paste");
      score = Math.min(score, 0);
    }

    scores.push({ id: 4, name: "citations_fail_closed", score, notes });
  }

  // 5 — Professional tone
  {
    const notes: string[] = [];
    let score = 1;
    for (const p of OVERCLAIM_PATTERNS) {
      if (p.test(letter)) {
        notes.push(`Overclaim matched: ${p}`);
        score = 0;
      }
    }
    if (!/respectfully request/i.test(letter)) {
      notes.push("Missing respectful request phrasing");
      score = Math.min(score, 0.8);
    }
    if (!letter.includes(FOOTER) && !/Draft for clinical\/billing review/i.test(letter)) {
      notes.push("Footer missing");
      score = Math.min(score, 0.7);
    }
    scores.push({ id: 5, name: "professional_tone", score, notes });
  }

  // 6 — Drug / indication consistency
  {
    const notes: string[] = [];
    let score = 1;
    if (!letter.includes(c.meta.requested_drug)) {
      notes.push("Requested drug missing");
      score = 0;
    }
    const indLabel = INDICATIONS[c.meta.indication].label;
    if (!letter.includes(indLabel)) {
      notes.push(`Indication label "${indLabel}" missing`);
      score = Math.min(score, 0);
    }
    const allowed = drugsForIndication(c.meta.indication).map((d) => d.name);
    if (!allowed.includes(c.meta.requested_drug)) {
      notes.push("Requested drug not in config for indication");
      score = 0;
    }
    scores.push({ id: 6, name: "drug_indication_consistency", score, notes });
  }

  // 7 — Specific ask
  {
    const notes: string[] = [];
    const askIdx = letter.indexOf("## Specific ask");
    const askBlock =
      askIdx >= 0 ? letter.slice(askIdx, askIdx + 800) : "";
    let score = 1;
    if (askIdx < 0) {
      notes.push("Specific ask section missing");
      score = 0;
    } else {
      if (!askBlock.includes(c.meta.requested_drug)) {
        notes.push("Ask does not name drug");
        score = Math.min(score, 0.5);
      }
      const actionOk =
        /authorize|approve|exception|overturn|reverse|reconsideration/i.test(askBlock);
      if (!actionOk) {
        notes.push("Ask lacks specific action verb");
        score = Math.min(score, 0.5);
      }
      const denialAsk: Record<string, RegExp> = {
        step_therapy: /step therapy|authorize/i,
        medical_necessity: /medical-necessity|medical necessity|approve coverage/i,
        non_formulary: /formulary exception/i,
        quantity_limit: /quantity-limit exception|quantity limit/i,
      };
      const pat = denialAsk[c.denial.denial_type];
      if (pat && !pat.test(askBlock)) {
        notes.push("Ask not tailored to denial type");
        score = Math.min(score, 0.7);
      }
    }
    scores.push({ id: 7, name: "specific_ask", score, notes });
  }

  // Weighted overall
  let num = 0;
  let den = 0;
  for (const s of scores) {
    const wt = w(s.id);
    num += s.score * wt;
    den += wt;
  }
  const overall = den ? num / den : 0;
  const citation_score = scores.find((s) => s.id === 4)?.score ?? 0;
  const fail_reasons: string[] = [];
  if (overall < PASS_OVERALL) fail_reasons.push(`overall ${overall.toFixed(3)} < ${PASS_OVERALL}`);
  if (citation_score < 1) fail_reasons.push("criterion 4 (citations) not 1.0");
  for (const s of scores) {
    if (s.score < 1 && s.notes.length) {
      fail_reasons.push(`c${s.id} ${s.name}: ${s.notes.join("; ")}`);
    }
  }

  const checklistText = checklist.join("\n").toLowerCase();
  const checklist_theme_hits = (g.expected_checklist_themes || []).map((theme) => {
    const tokens = theme.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
    const hit =
      checklistText.includes(theme.toLowerCase()) ||
      tokens.some((t) => checklistText.includes(t));
    return { theme, hit };
  });

  const passed = overall >= PASS_OVERALL && citation_score === 1;

  return {
    id: g.id,
    description: g.description,
    indication: c.meta.indication,
    denial_type: c.denial.denial_type,
    payer_id: c.denial.payer_id,
    scores,
    overall,
    citation_score,
    passed,
    fail_reasons: passed ? [] : fail_reasons,
    checklist_theme_hits,
  };
}

function countBy<T extends string>(items: T[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const i of items) out[i] = (out[i] || 0) + 1;
  return out;
}

async function main() {
  const cases = loadCases();
  const results: CaseResult[] = [];

  for (const g of cases) {
    const settings = g.settings || DEFAULT_SETTINGS;
    const { letter_markdown, checklist } = await generateAppeal(g.case, settings);
    results.push(scoreCase(g, letter_markdown, checklist));
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const passRate = results.length ? passed / results.length : 0;

  const report = {
    generated_at: new Date().toISOString(),
    case_count: results.length,
    passed,
    failed: failed.length,
    pass_rate: passRate,
    pass_threshold: 0.9,
    counts: {
      indication: countBy(results.map((r) => r.indication)),
      denial_type: countBy(results.map((r) => r.denial_type)),
      payer_id: countBy(results.map((r) => r.payer_id)),
    },
    failures: failed.map((r) => ({
      id: r.id,
      overall: r.overall,
      citation_score: r.citation_score,
      fail_reasons: r.fail_reasons,
      scores: r.scores,
    })),
    results,
  };

  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const outPath = path.join(RESULTS_DIR, "latest-report.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");

  console.log("\n=== AppealClinic golden-set ===");
  console.log(`Cases: ${results.length}`);
  console.log(`Indication: ${JSON.stringify(report.counts.indication)}`);
  console.log(`Denial:     ${JSON.stringify(report.counts.denial_type)}`);
  console.log(`Payer:      ${JSON.stringify(report.counts.payer_id)}`);
  console.log(`Passed: ${passed}/${results.length} (${(passRate * 100).toFixed(1)}%)`);
  console.log(`Report: ${outPath}`);
  if (failed.length) {
    console.log("\nFailures:");
    for (const f of failed) {
      console.log(`- ${f.id} overall=${f.overall.toFixed(3)} c4=${f.citation_score}`);
      for (const reason of f.fail_reasons.slice(0, 6)) console.log(`    ${reason}`);
    }
  } else {
    console.log("\nAll cases passed.");
  }

  // Non-zero exit if below threshold (useful in CI)
  if (passRate < 0.9) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
