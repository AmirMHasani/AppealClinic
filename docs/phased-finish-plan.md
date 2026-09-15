# AppealClinic — phased finish plan

**Updated:** 2026-09-15  
**Live demo:** https://appealclinic.onrender.com  
**Rule:** Stripe last. BAA before real PHI. Approach clinics only when the phase exit says so.

---

## North stars

| Track | Definition of done |
| --- | --- |
| **Show-PM demo** | Already largely met — hosted URL, Postgres, wizard→letter→DOCX, desk queue |
| **Confident synthetic pilot** | PM can trial on de-ID/synthetic data, pay test Checkout, multi-staff login, no “shared global cases” surprise |
| **Sellable HIPAA desk** | BAA-capable host/DB (+ optional BAA LLM), tenant isolation, audit/retention, customer BAA |

---

## Phase 0 — Stabilize what we shipped (≤2 days) · CoS / Engineering

**Goal:** Docs and infra match reality; no silent landmines.

| Work | Owner |
| --- | --- |
| Rewrite `docs/security-one-pager.md` for live Postgres + demo banner (drop “JSON MVP” language) | Engineering |
| Calendar note / routine: Free Postgres **`dpg-dakns77qj5pc73d7koj0-a`** expires **~2026-10-15** — migrate Neon free or paid Render before then (`docs/deploy-cheap.md`) | CoS + Amir pick vendor |
| Optional keep-alive ping every ~10–14 min (UptimeRobot / cron → `/api/health`; `docs/keepalive.md`) so PM demos don’t hit spin-up interstitial | CoS |
| IBX pack pass: document portal-only gaps honestly; add any public commercial PDFs found | Engineering / Data |

**Exit:** Security one-pager accurate; DB expiry plan chosen; demo doesn’t surprise a PM on cold start (or warning is clear).

---

## Phase 1 — Confident synthetic pilot (3–7 days) · Engineering + Amir (keys)

**Goal:** Charge-ready *test* money path + multi-staff on synthetic data — still **no real PHI**.

| Work | Owner |
| --- | --- |
| Stripe **test** keys + Price ID `$249` on Render; Checkout E2E; webhook stub→real for subscription status | Amir (keys) + Engineering |
| Lite invites: create clinic staff user (email/password) or magic invite link; **no** global case bleed once Phase 2 tenancy lands — until then, single-clinic mode with clear “demo clinic” banner | Engineering |
| Pilot onboarding checklist in-app (10 denials → generate → export → outcome) | Engineering / Marketing copy |
| Pack depth: strengthen weakest payers (IBX first) from public sources only | Engineering + Data |
| Custom domain optional (`appealclinic.com` or similar) | Amir DNS |

**Exit:** Stripe test Checkout green; second user can log in; pilot one-pager + security doc match the product; still `APP_MODE=demo` / redaction-first for PHI.

**Do *not* approach clinics for PHI yet.** Synthetic / de-ID pilots only.

---

## Phase 2 — Multi-tenant + audit foundation (1–2 weeks) · Engineering

**Goal:** Real product architecture under the desk UI.

| Work | Owner |
| --- | --- |
| Schema: `Clinic`, `Membership` (role), `clinicId` on cases/settings; migrate existing demo rows into one “Demo Clinic” | Engineering |
| Enforce clinic scoping on all case/settings APIs | Engineering |
| Audit log: login, case create/update, generate, export, settings change (who/when/what) | Engineering |
| Retention: admin “delete clinic data” + documented retention window | Engineering |
| Roles: owner vs coordinator (minimum) | Engineering |

**Exit:** Two clinics cannot see each other’s cases; audit trail queryable; delete path works.

---

## Phase 3 — HIPAA / BAA path (parallel with Phase 2 legal; 1–3 weeks calendar) · Amir + CoS

**Goal:** Legal/ops posture that matches $249 clinic trust.

| Work | Owner |
| --- | --- |
| Pick BAA-capable Postgres + app host (Neon/Render paid / Fly / etc. per `docs/baa-and-hosting-options.md`) | Amir + CoS |
| Vendor BAAs signed; customer BAA template + subprocessors list | Amir (+ counsel if needed) |
| Product flag: `APP_MODE=phi` only when BAAs live; keep demo mode for public URL | Engineering |
| If LLM polish used: Azure OpenAI or Bedrock with BAA — else keep rules-only | Amir + Engineering |
| Migrate off Free Render sleep / free DB for any PHI pilot | CoS / Engineering |

**Exit:** Written path to accept PHI under BAA; public demo can stay synthetic forever.

---

## Phase 4 — Paid live + GTM (after Phase 1–3 gates) · Amir + Sales / Marketing

| Work | Owner |
| --- | --- |
| Stripe **live** (`STRIPE_LIVE_ENABLED`) only after test E2E + security checklist | Amir |
| Pilot outreach with one-pager (not “send us denials to validate”) | Sales + Amir |
| Optional shadow packets for quality — not a gate | Data / Clinical |

**Exit:** First paying pilot clinic on synthetic or BAA-backed PHI as agreed.

---

## Explicit non-goals (v1)

- EHR write-back  
- Auto-submit to payer portals  
- Guaranteed overturn rates  
- Behavioral health specialty  

---

## Suggested sequence (dependency order)

```
Phase 0 (docs + DB expiry + keep-alive)
    ↓
Phase 1 (Stripe test + invites lite + packs)     ← Amir keys unblocks Checkout
    ↓
Phase 2 (tenancy + audit)                        ← can start in parallel with Phase 1 late
    ↓
Phase 3 (BAA/host)                               ← Amir-critical path; overlaps Phase 2
    ↓
Phase 4 (live Stripe + outreach)
```

---

## What Amir owns vs bots

| Amir | CoS / Engineering / Data |
| --- | --- |
| Stripe account + test/live keys | Desk, tenancy, audit, packs, keep-alive |
| BAA vendor choice + signatures | Deploy, migrate DB before Oct 15 |
| Domain DNS | Docs accuracy, pilot UX |
| Go/no-go on clinic outreach | Smoke / health monitoring |
