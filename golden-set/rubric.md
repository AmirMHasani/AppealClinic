# AppealClinic golden-set rubric (Phase 1)

Synthetic QA set for the deterministic `generateAppeal` letter engine. Cases live in `golden-set/cases/*.json` (also aggregated as `golden-set/cases.json`). Run with `bun run golden`.

## Pass rule

For each case, score seven criteria on **0–1**. The case **passes** when:

1. **Overall average ≥ 0.9**, AND
2. **Criterion 4 (citations) = 1.0** (zero fabricated cites)

Suite target: **≥ 90%** of cases pass.

## Criteria

| # | Name | What “1.0” means |
| --- | --- | --- |
| 1 | Required sections | Letter contains all required markdown sections: Request for reconsideration, Clinical summary, Prior therapy / step history, Rationale addressing the denial, Guideline / policy anchors, Specific ask, Attachments checklist, and the review footer. |
| 2 | Facts only | Letter uses only clinical facts from the case intake (severity scores, failed therapies, labs, narrative). No invented BSA/IGA/PGA/DLQI/Hurley values or drugs not present in the case / config context. |
| 3 | Addresses denial | Rationale / ask clearly engages the stated denial type (step therapy, medical necessity, non-formulary, or quantity limit). |
| 4 | Citations fail-closed | Every URL or policy title in the letter is either (a) from the payer pack `citationSlots`, (b) from the user-pasted guideline excerpt, or (c) an explicit **Citation needed** placeholder. No fabricated policy numbers/URLs. **Must be 1.0 to pass.** |
| 5 | Professional tone | Professional appeal language; no overclaim verbs/phrases (e.g. “guaranteed”, “will cure”, “100% effective”). Footer retained. |
| 6 | Drug / indication consistency | Requested drug and indication label appear; drug is appropriate for the indication per config. |
| 7 | Specific ask | “Specific ask” section requests a concrete action (authorize / approve / formulary exception / quantity-limit exception) naming the drug. |

Weights default to `1` for each criterion (stored on each case as `rubric_weights`). Overall = weighted average.

## Case file shape

Each JSON file includes:

- `id` — synthetic ID (`SYN-PSO-001`, …)
- `case` — full `AppealCase` wizard inputs (no real PHI)
- `settings` — optional clinic letterhead override
- `expected_checklist_themes` — themes the checklist should cover
- `forbidden_hallucinated_cites` — substrings that must never appear in the letter
- `rubric_weights` — per-criterion weights `"1"`…`"7"`

## Scoring implementation

`scripts/run-golden-set.ts` loads cases, calls `generateAppeal` from `src/lib/generator/generateAppeal.ts` (same path as the app), scores the returned `letter_markdown`, and writes `golden-set/results/latest-report.json`.

OpenAI polish is **disabled** during golden runs (`OPENAI_API_KEY` cleared) so results stay deterministic.
