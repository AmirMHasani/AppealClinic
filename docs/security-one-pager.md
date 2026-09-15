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
| **Hosted demo** | **Managed Postgres** via `DATABASE_URL` (Prisma) | Primary path on Render Free. Cases survive sleep/redeploy. |
| **Local laptop / CI** | JSON file (`data/store.json`) | Used **only** when `DATABASE_URL` is unset. Not the hosted primary store. |

**Do not put real PHI into the MVP.** Demo mode (`APP_MODE=demo`, default) + redaction-first UX + synthetic seed data are the intended posture until BAAs are in place.

**PHI gate (Phase 3 engineering):** Real PHI workflows require `APP_MODE=phi` only after BAAs + `docs/phi-mode-checklist.md`. Unknown modes fail closed to demo. Public `*.onrender.com` demo refuses accidental PHI mode unless `ALLOW_PHI_ON_DEMO_HOST=true`.

**Production target:** multi-tenant hosted app with encrypted storage, clinic-scoped access controls, audit-friendly retention/deletion, and BAA-covered subprocessors before any PHI workflows.

---

## Redaction-first UX (**MVP today**)

- Amber **EnvironmentBanner** when `APP_MODE=demo` (default if unset): **“Development / Demo · Not for real PHI — synthetic or de-identified data only”**.
- Muted **PHI mode — BAA environment** banner when `APP_MODE=phi` (not the demo amber).
- Banner on the new-case wizard: do not enter full names, SSNs, full MRNs, DOB, or street addresses.
- `REQUIRE_REDACTION_CHECK` defaults **true** when unset (hard-blocks common PHI patterns beyond SSN).
- Landing and docs reinforce synthetic / de-identified use for demos and shadow validation.
- Staff remain responsible for scrubbing packets before entry.

---

## Auth, encryption & hosting (**MVP today** vs target)

| Topic | MVP today (live demo) | Production / PHI target |
| --- | --- | --- |
| Host | Render Free — `https://appealclinic.onrender.com` | Stay on Render Free until closer to PHI; paid Render web **TBD** (Amir). No Fly/Starter auto-provision. |
| In transit | **HTTPS** (TLS at Render) | HTTPS only |
| At rest | **Render Free Postgres** via `DATABASE_URL` (demo) | **Neon Scale + HIPAA BAA** for PHI (`docs/neon-cutover.md`). Free DB expires ~**2026-10-15**. |
| Auth | **JWT session cookie** (`ac_session`) + **scrypt** password hashes; **`AUTH_SECRET` required** on shared/production-like hosts | Strong secrets, HTTPS-only cookies, MFA / production identity as needed |
| Tenancy | **Clinic / Membership**, cases scoped by `clinicId` (Phase 2) | Same model under BAA env |
| LLM | Optional; not required for core drafts; **unset** on demo | Azure OpenAI **or** AWS Bedrock under a BAA — only after BAAs |
| Payments | **Stripe unset / test** (last) | Stripe Checkout after Phase 4 gates; live keys gated |

---

## Retention & deletion (**Phase 2 — productized for cases**)

- **Retention:** Case drafts and related inputs retained while the clinic subscription is active, plus a short grace period after cancellation (proposed: 30 days) for export.
- **Deletion:** **Owner-only** `DELETE /api/clinic/data` wipes all appeal cases for that clinic (see `docs/retention.md`). Broader account/subprocessor wipe remains operator/manual for backups.
- **Exports:** Clinics can export DOCX/PDF of their drafts before deletion.
- **Audit:** Clinic-scoped events at `GET /api/audit` (login, case ops, generate, export, settings, retention).
- **Tenancy:** Cases and settings are scoped by `clinicId`; Demo Clinic is the default hosted bootstrap.

---

## Subprocessors (**MVP today** vs placeholders)

| Role | MVP today | Notes / PHI target |
| --- | --- | --- |
| App hosting | **Render** (Free web service) | Stay Free until closer to PHI; paid Render TBD |
| Database (demo) | **Render Free Postgres** (`dpg-dakns77qj5pc73d7koj0-a`) | Expires ~**2026-10-15** — **not** BAA for PHI |
| Database (PHI) | Not live yet | **Neon Scale + BAA** — Amir provisions; see `docs/neon-cutover.md` |
| LLM (optional polish) | Unset on demo | **Azure OpenAI** or **AWS Bedrock** under BAA only |
| Payments | **Stripe** test/unset (last) | Subscription Checkout; card data stays with Stripe when enabled |
| Email (if added later) | None | Only with BAA or transactional no-PHI mail |

Draft list: `docs/subprocessors.md`. Exact legal entities and DPAs will be listed in a customer-facing schedule before PHI go-live.

---

## Business Associate Agreements (BAA)

**Founder gate before PHI:**

1. AppealClinic (or its operating entity) will execute a **BAA with each customer** before that customer may use workflows involving PHI.
2. We will execute **BAAs with BAA-capable vendors** (Neon for DB; host/LLM as applicable) **before** enabling PHI workflows / `APP_MODE=phi`.
3. Until those BAAs are in place, use remains **synthetic, de-identified, or shadow-validation** only (`APP_MODE=demo`).

We do **not** claim HIPAA Covered Entity status for your practice; you remain responsible for your own compliance program. We aim to be a careful Business Associate when PHI is in scope. See `docs/baa-and-hosting-options.md` and `docs/phi-mode-checklist.md`.

---

## Current posture summary

| | |
| --- | --- |
| **MVP today** | Hosted demo on Render Free + Free Postgres; demo banner; redaction-first; synthetic data; JWT + scrypt; HTTPS; Phase 2 tenancy/audit/retention; Stripe **off**; `APP_MODE=demo`; no live PHI |
| **Phase 3 prep** | Product flag `APP_MODE=phi` gated; Neon cutover docs; subprocessors draft — **no Neon provision / no Render env flip yet** |
| **Sellable v1 target** | Neon BAA DB + Render web (Free→paid TBD) ± Azure OpenAI/Bedrock + Stripe $249/mo after gates |
| **Not claimed** | SOC 2, HITRUST, or “HIPAA certified” product badge |

---

## Security questions

**Contact:** Amir Hasani — founder, AppealClinic  
Use the email / channel you already use for product evaluation, or reply to your trial intro thread and ask for “security / BAA.”

We prefer calm, specific questions (data flow, retention, BAA timeline, subprocessors) over marketing claims. If we have not built it yet, we will say so.
