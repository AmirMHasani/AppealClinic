# AppealClinic — Security overview (practice managers)

**Audience:** Independent dermatology practice managers and PA coordinators evaluating AppealClinic.  
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

---

## Data we handle

**Typical inputs (MVP today):** denial language, payer/indication/drug selections, clinical evidence bullets (failed therapies, severity scores, labs as free text), clinic letterhead settings, and login email for demo accounts.

**What we urge you to avoid:** full patient names, SSNs, full MRNs/member IDs, dates of birth, street addresses, phone numbers, or photos of insurance cards. Prefer internal case IDs and optional initials. **De-identify before paste.**

**MVP today:** local/demo persistence (JSON store); optional OpenAI polish only if an API key is configured by the operator. Do not put real PHI into the MVP.

**Production target:** hosted multi-tenant app with encrypted storage, access controls, audit-friendly retention, and BAA-covered subprocessors before any PHI workflows.

---

## Redaction-first UX (**MVP today**)

- Banner on the new-case wizard: do not enter full names, SSNs, full MRNs, DOB, or street addresses.
- Landing and docs reinforce synthetic / de-identified use for demos and shadow validation.
- Staff remain responsible for scrubbing packets before entry.

---

## Encryption & hosting assumptions

| Topic | MVP today | Production target |
| --- | --- | --- |
| In transit | Local `http://localhost` for demos | HTTPS only (TLS terminated at the host, e.g. Render) |
| At rest | Local JSON file on disk | Managed Postgres (or equivalent) with provider encryption at rest |
| Auth | Demo JWT cookie (`AUTH_SECRET`) | Strong secrets, HTTPS cookies, production identity / MFA as needed |
| LLM | Optional; not required for core drafts | Azure OpenAI **or** AWS Bedrock under a BAA — only after BAAs are in place |

---

## Retention & deletion (**proposed policy** — not fully implemented)

Until productized tooling ships, treat the following as **intended production policy**, not a guarantee of the MVP:

- **Retention:** Case drafts and related inputs retained while the clinic subscription is active, plus a short grace period after cancellation (proposed: 30 days) for export.
- **Deletion:** On written request, or after the grace period, clinic case data is deleted from application databases within a defined SLA (proposed: 30 days). Backups age out on the provider’s backup cycle.
- **Exports:** Clinics can export DOCX/PDF of their drafts before deletion.
- **MVP today:** No self-serve “delete all my data” admin UI; operators delete local `data/store.json` or wipe the environment.

---

## Subprocessors (**production target** placeholders)

| Role | Candidate | Notes |
| --- | --- | --- |
| App hosting | **Render Free** (preferred demo; `docs/deploy-cheap.md`); Fly.io / VPS later; Vercel optional | HTTPS, deploy |
| Database | **Managed Postgres** (Neon, Supabase, RDS, etc.) | Prefer vendors offering BAA where PHI may be stored |
| LLM (optional polish) | **Azure OpenAI** or **AWS Bedrock** | BAA-capable options; not consumer ChatGPT for PHI |
| Payments | **Stripe** | Subscription Checkout; card data stays with Stripe |
| Email (if added later) | TBD | Only with BAA or transactional no-PHI mail |

Exact legal entities and DPAs will be listed in a customer-facing subprocessors schedule before PHI go-live.

---

## Business Associate Agreements (BAA)

**Production target / go-live gate:**

1. AppealClinic (or its operating entity) will execute a **BAA with each customer** before that customer may use workflows involving PHI.
2. We will execute **BAAs with BAA-capable vendors** (hosting/DB/LLM as applicable) **before** enabling PHI workflows on those systems.
3. Until those BAAs are in place, use remains **synthetic, de-identified, or shadow-validation** only (see Phase 2 plan).

We do **not** claim HIPAA Covered Entity status for your practice; you remain responsible for your own compliance program. We aim to be a careful Business Associate when PHI is in scope.

---

## Current posture summary

| | |
| --- | --- |
| **MVP today** | Redaction-first demo SaaS; no EHR; no auto-submit; human review; Stripe stub; local/demo auth & storage; no live PHI commitment |
| **Sellable v1 target** | Hosted app + Postgres + BAA path (Azure OpenAI or Bedrock) + Stripe $249/mo after Phase 2 exit and security review |
| **Not claimed** | SOC 2, HITRUST, or “HIPAA certified” product badge |

---

## Security questions

**Contact:** Amir Hasani — founder, AppealClinic  
Use the email / channel you already use for product evaluation, or reply to your trial intro thread and ask for “security / BAA.”

We prefer calm, specific questions (data flow, retention, BAA timeline, subprocessors) over marketing claims. If we have not built it yet, we will say so.
