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
- [x] Demo hosted on a stable URL (**Render Free**) — https://appealclinic.onrender.com (`srv-dafi4c5g1s2s73elki0g`); Postgres live (`appealclinic-db`) — see `docs/deploy-cheap.md`
- [ ] Stripe **test-mode** Checkout works end-to-end with founder's test keys — **last**, after hosted demo; **founder adds keys** (still stubbed / unset)

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
- EHR or auto-submit (out of scope for v1)

**Note:** Hosted Render Free + Postgres are live for the **synthetic demo**. A **sellable HIPAA desk** still needs a signed BAA path — demo is **not** for real PHI (`docs/baa-and-hosting-options.md`).

---

## After MVP exit then approach businesses

1. Demo URL is live on **Render Free** (`docs/deploy-cheap.md`). Stripe test is **last** — still unchecked.
2. Use docs/pilot-one-pager.md + security one-pager.
3. Offer a 14-day pilot at $249/mo (synthetic / non-PHI until BAA).
4. Shadow packets are optional quality fuel — not a gate.

---

## Ownership split (current)

### Still on founder (Amir)

- Stripe account + test keys / Price ID — test Checkout **last** (hosted demo is already up)
- Flip STRIPE_LIVE_ENABLED only after checklist — real money
- BAA vendor path when PHI pilots start — docs/baa-and-hosting-options.md
- Domain (optional) — branding
- Vercel — optional only (`docs/deploy-vercel.md`); not the preferred demo host

### CoS / Engineering

- Desk automation finish (ops / tooling around the live demo desk)
- Keep Render Free web + free Postgres healthy until expiry / upgrade (`docs/deploy-cheap.md`)
