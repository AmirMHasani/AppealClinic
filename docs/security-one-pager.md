# AppealClinic — Security overview (practice managers)

**Audience:** Independent dermatology practice managers and PA coordinators evaluating AppealClinic.  
**As of:** 2026-09-15  
**Tone:** Honest MVP status. Items not built yet are labeled **production target**. What ships today is labeled **MVP today**.

---

## What the product does — and does not

| Does | Does not |
| --- | --- |
| Helps staff draft insurer-ready appeal / medical-necessity letters from denial text + clinical bullets | Connect to your EHR |
| Exports DOCX / print-to-PDF for human review | Auto-submit appeals to payers or portals |
| Tracks draft status and optional outcomes you enter | Replace clinical or billing judgment |
| Uses a redaction-first UI and synthetic demo data | Claim HIPAA certification or “fully HIPAA-compliant” out of the box |

Every letter includes a footer: *Draft for clinical/billing review. Confirm payer criteria and deadlines before submission.*

**Hosted demo (MVP today):** [https://appealclinic.onrender.com](https://appealclinic.onrender.com) on **Render Free** (web + Free Postgres). Stripe payments are **not enabled** — Stripe stays last.

---

## Data we handle

**Typical inputs (MVP today):** denial language, payer/indication/drug selections, clinical evidence bullets (failed therapies, severity scores, labs as free text), clinic letterhead settings, and login email for demo accounts.

**What we urge you to avoid:** full patient names, SSNs, full MRNs/member IDs, dates of birth, street addresses, phone numbers, or photos of insurance cards. Prefer internal case IDs and optional initials. **De-identify before paste.**

| Persistence | MVP today | Notes |
| --- | --- | --- |
| **Hosted demo** | **Managed Postgres** via `DATABASE_URL` (Prisma) | Primary path on Render. Cases survive sleep/redeploy. |
| **Local laptop / CI** | JSON file (`data/store.json`) | Used **only** when `DATABASE_URL` is unset. Not the hosted primary store. |

**Do not put real PHI into the MVP.** Demo mode (`APP_MODE=demo`) + redaction-first UX + synthetic seed data are the intended posture until BAAs are in place.

**Production target:** multi-tenant hosted app with encrypted storage, clinic-scoped access controls, audit-friendly retention/deletion, and BAA-covered subprocessors before any PHI workflows.

---

## Redaction-first UX (**MVP today**)

- Amber **EnvironmentBanner** when `APP_MODE=demo` (default if unset): **“Development / Demo · Not for real PHI — synthetic or de-identified data only”**.
- Banner on the new-case wizard: do not enter full names, SSNs, full MRNs, DOB, or street addresses.
- `REQUIRE_REDACTION_CHECK=true` (recommended on shared demos) hard-blocks common PHI patterns.
- Landing and docs reinforce synthetic / de-identified use for demos and shadow validation.
- Staff remain responsible for scrubbing packets before entry.

---

## Auth, encryption & hosting (**MVP today** vs target)

| Topic | MVP today (live demo) | Production target |
| --- | --- | --- |
| Host | Render Free — `https://appealclinic.onrender.com` | Paid / BAA-capable host when PHI is in scope |
| In transit | **HTTPS** (TLS at Render) | HTTPS only |
| At rest | **Managed Postgres** (Render Free Postgres via `DATABASE_URL`); provider disk encryption | BAA-capable Postgres; optional Neon or paid Render |
| Auth | **JWT session cookie** (`ac_session`) + **scrypt** password hashes; **`AUTH_SECRET` required** on shared/production-like hosts | Strong secrets, HTTPS-only cookies, MFA / production identity as needed |
| LLM | Optional; not required for core drafts; **unset** on demo | Azure OpenAI **or** AWS Bedrock under a BAA — only after BAAs |
| Payments | **Stripe unset** (last) | Stripe Checkout after Phase 1 test path |

---

## Retention & deletion (**proposed policy** — not fully productized)

Until productized tooling ships, treat the following as **intended production policy**, not a guarantee of the MVP:

- **Retention:** Case drafts and related inputs retained while the clinic subscription is active, plus a short grace period after cancellation (proposed: 30 days) for export.
- **Deletion:** On written request, or after the grace period, clinic case data is deleted from application databases within a defined SLA (proposed: 30 days). Backups age out on the provider’s backup cycle.
- **Exports:** Clinics can export DOCX/PDF of their drafts before deletion.
- **MVP today:** **No self-serve “delete all my data” admin UI.** Hosted data lives as **Postgres rows**; deletion is operator/manual (SQL / provider console) until Phase 2 retention work. Local JSON wipe only applies when `DATABASE_URL` is unset.

---

## Subprocessors (**MVP today** vs placeholders)

| Role | MVP today | Notes / production target |
| --- | --- | --- |
| App hosting | **Render** (Free web service) | HTTPS, deploy; upgrade/BAA path later |
| Database | **Render Free Postgres** (`appealclinic-db`, instance **`dpg-dakns77qj5pc73d7koj0-a`**) today | Free tier expires ~**2026-10-15** — migrate to **Neon free** (external `DATABASE_URL`) **or** paid Render Postgres before then. Prefer **internal** URL when DB stays on Render same region. Optional keep-alive: UptimeRobot/cron → `/api/health` every 10–14 min (`docs/keepalive.md`). See also `docs/deploy-cheap.md`. |
| LLM (optional polish) | Unset on demo | **Azure OpenAI** or **AWS Bedrock** under BAA only |
| Payments | **Stripe unset** (last) | Subscription Checkout; card data stays with Stripe when enabled |
| Email (if added later) | None | Only with BAA or transactional no-PHI mail |

Exact legal entities and DPAs will be listed in a customer-facing subprocessors schedule before PHI go-live.

---

## Business Associate Agreements (BAA)

**Founder gate before PHI:**

1. AppealClinic (or its operating entity) will execute a **BAA with each customer** before that customer may use workflows involving PHI.
2. We will execute **BAAs with BAA-capable vendors** (hosting/DB/LLM as applicable) **before** enabling PHI workflows on those systems.
3. Until those BAAs are in place, use remains **synthetic, de-identified, or shadow-validation** only.

We do **not** claim HIPAA Covered Entity status for your practice; you remain responsible for your own compliance program. We aim to be a careful Business Associate when PHI is in scope. See `docs/baa-and-hosting-options.md`.

---

## Current posture summary

| | |
| --- | --- |
| **MVP today** | Hosted demo on Render Free + managed Postgres; demo banner; redaction-first; synthetic data; JWT + scrypt; HTTPS; Stripe **off**; no live PHI commitment |
| **Sellable v1 target** | Hosted app + BAA path (DB/host ± Azure OpenAI or Bedrock) + Stripe $249/mo after Phase 2 exit and security review |
| **Not claimed** | SOC 2, HITRUST, or “HIPAA certified” product badge |

---

## Security questions

**Contact:** Amir Hasani — founder, AppealClinic  
Use the email / channel you already use for product evaluation, or reply to your trial intro thread and ask for “security / BAA.”

We prefer calm, specific questions (data flow, retention, BAA timeline, subprocessors) over marketing claims. If we have not built it yet, we will say so.
