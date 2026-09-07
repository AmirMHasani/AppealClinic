# MVP definition — ready to approach businesses

**Product:** AppealClinic  
**Rule:** Build a real approachable MVP **before** clinic outreach. Do **not** treat clinic shadow packets as a prerequisite to having a product you can show.

---

## What "MVP ready to approach businesses" means

You can put a **live demo URL** in front of a practice manager and say:

> Here is the tool. Try three synthetic cases. If useful, we run a short paid pilot.

You are **not** asking them to validate whether the product should exist.

---

## Exit criteria (all must be true)

### Product

- [x] End-to-end demo: login → case list → new appeal wizard → generate letter → edit → DOCX / print PDF
- [x] Deterministic rules generator with **fail-closed citations** (payer pack slots or user-pasted guidelines only)
- [x] Redaction-first UX + optional hard block (`REQUIRE_REDACTION_CHECK=true`)
- [x] Environment banner when `APP_MODE=demo` or unset (not for real PHI)
- [x] Golden-set letter QA runnable (`bun run golden`) with documented pass bar
- [ ] Demo hosted on a stable URL (**Render Free**) — **founder deploys** per `docs/deploy-cheap.md`
- [ ] Stripe **test-mode** Checkout works end-to-end with founder's test keys — **last**, after hosted demo; **founder adds keys**

### Docs / GTM readiness (no outreach required)

- [x] docs/security-one-pager.md
- [x] docs/deploy-cheap.md (Render Free — locked demo host)
- [x] docs/deploy-vercel.md (optional only)
- [x] docs/pilot-one-pager.md
- [x] docs/stripe-go-live.md
- [ ] Custom domain optional

### Explicit non-blockers

- Clinic shadow packets / Philly outreach
- Customer BAA signed
- Live Stripe charges
- Postgres / multi-tenant DB
- EHR or auto-submit (out of scope for v1)

---

## After MVP exit then approach businesses

1. Deploy demo on **Render Free** (`docs/deploy-cheap.md`). Stripe test is **last** after the URL works.
2. Use docs/pilot-one-pager.md + security one-pager.
3. Offer a 14-day pilot at $249/mo.
4. Shadow packets are optional quality fuel — not a gate.

---

## Still on founder (Amir)

- Render account + Free Web Service deploy — public demo URL (`docs/deploy-cheap.md`)
- Domain (optional) — branding
- Stripe account + test keys / Price ID — test Checkout **last** (after hosted demo smoke)
- Flip STRIPE_LIVE_ENABLED only after checklist — real money
- BAA vendor path when PHI pilots start — docs/baa-and-hosting-options.md
- Vercel — optional only (`docs/deploy-vercel.md`); not the preferred demo host
