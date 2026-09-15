# BAA & hosting options (founder note)

**For:** Amir Hasani  
**Updated:** 2026-09-15  
**Goal:** Choose a path that is sellable to independent derm clinics without overbuilding on a ~$500 bootstrap.

**Demo hosting (bootstrap):** Prefer **Vercel Hobby** for the free public demo URL (`docs/deploy-vercel.md`). Keep **Render Free** live as rollback until Vercel smokes (`docs/deploy-cheap.md`). **Stripe test is last**.

**Amir locks (Phase 3):**

| Layer | Decision |
| --- | --- |
| PHI database | **Neon Postgres + HIPAA BAA** (Scale plan) — see `docs/neon-cutover.md` |
| App host (now → near-PHI) | **Vercel Hobby** for free demo URL; keep Render Free until cutover smoke. Do **not** provision Render Starter/paid or Fly yet. Paid Render web **TBD** closer to PHI. |
| Free Render Postgres | Demo only until cutover; expires ~**2026-10-15** |
| Stripe | Still last (Phase 4) |

**Do not migrate or provision Neon / change Render `DATABASE_URL` until Amir creates the Neon project and signs the BAA.**

---

## Live status (demo)

| Piece | Status |
| --- | --- |
| Web | Vercel Hobby (target) + Render Free rollback — `https://appealclinic.onrender.com` |
| DB | Render Free Postgres `dpg-dakns77qj5pc73d7koj0-a` (demo) — expiry ~**2026-10-15** |
| `APP_MODE` | `demo` (do not change on public demo) |
| Stripe | Unset / test path only — not live |
| Neon | **Not provisioned** — docs + checklist only |

---

## Option A — Redaction-only forever

**Model:** Never accept PHI. Product remains “paste de-identified denial + clinical bullets only.” No customer BAA; no BAA with LLM vendors required if nothing identifiable is stored or sent.

| Pros | Cons |
| --- | --- |
| Lowest legal/ops burden | Weaker sales story — many PMs expect a BAA before they trust a vendor |
| Stays cheap (Render Free / cheap Postgres or even file store) | Shadow validation and real workflows are awkward; staff will slip and paste PHI anyway |
| Honest if enforced | Harder to expand into sticky “clinic workspace” features |

**Verdict:** Fine as a **demo / Phase 1–2** posture. Weak as the **only** forever posture for paid SaaS. Public demo can stay Option A forever even after a separate PHI env exists.

---

## Option B — Render web + Neon (BAA) ± Azure OpenAI / Bedrock — **locked direction for sellable v1**

**Model:** Hosted Next.js on Render; **Neon Scale + HIPAA BAA** for PHI data; optional letter polish via a **BAA-capable** LLM; Stripe for $249/mo; customer BAA + vendor BAAs before PHI / `APP_MODE=phi`.

### Suggested stack (Amir-locked pieces bolded)

| Layer | Choice | Why |
| --- | --- | --- |
| App | **Vercel Hobby** demo + Render Free rollback; paid Render TBD closer to PHI | No Starter/Fly provision in this phase |
| DB (demo) | Render Free Postgres until cutover | Cheap demo; expires ~2026-10-15 |
| DB (PHI) | **Neon Scale + BAA** | Self-serve HIPAA BAA; Free/Launch must not hold PHI |
| LLM | **Azure OpenAI** *or* **AWS Bedrock** (or none) | Both are realistic BAA paths; core generator stays rules-based |
| Payments | **Stripe** Checkout (last) | Industry-standard; PCI stays with Stripe |
| Auth | JWT + scrypt; strong `AUTH_SECRET` | Already on demo |

### Neon BAA steps (Amir)

1. [console.neon.tech](https://console.neon.tech) → org on **Scale** (HIPAA not on Free/Launch).  
2. Organization settings → **HIPAA support** → enable → accept self-serve **BAA**.  
3. Create/enable HIPAA on project (irreversible; restarts computes).  
4. Copy **pooled** connection string + `sslmode=require` → set as Render `DATABASE_URL` **only at cutover**.  

Details: [Neon HIPAA docs](https://neon.com/docs/security/hipaa), `docs/neon-cutover.md`. HIPAA currently listed at no extra cost on Scale; confirm in Console (future surcharge may apply).

### Rough cost (bootstrap within/near **$500** where possible)

| Item | Ballpark (USD) | Notes |
| --- | --- | --- |
| Domain + DNS | $10–20/yr | One-time-ish |
| Vercel Hobby + Render Free rollback → paid later | $0 now; paid TBD | Free demo until closer to PHI |
| Neon Scale (PHI) | Scale plan pricing | BAA path; confirm HIPAA billing note in Console |
| Azure OpenAI / Bedrock | **Usage** | Often **$20–150+/mo** — swing factor; defer until needed |
| Stripe | % + fixed per charge | Phase 4; customer-paid $249/mo |
| Legal BAA templates / review | $0–500 one-time | Customer BAA + counsel |

**Bootstrap tip:** Ship **rules engine without LLM** first; add Azure/Bedrock only when a pilot needs polish *and* BAAs are signed.

### BAA sequence (Option B)

1. Customer BAA template ready.  
2. Neon org BAA + HIPAA project; host/LLM BAAs as applicable.  
3. Cut over per `docs/neon-cutover.md`; set `APP_MODE=phi` only after `docs/phi-mode-checklist.md`.  
4. Stripe live charges only after Phase 4 gates (`stripe-go-live.md`).

---

## Option C — Fully self-hosted later

**Model:** Clinic or Amir runs the stack in a VPC. Maximum control; maximum ops.

**Verdict:** Document as a **future** path for multi-location groups; do not block v1 on it. **Do not** provision Fly in this phase.

---

## Recommendation

**Execute Option B with Amir’s locks:** Neon Scale+BAA for PHI DB later; Vercel Hobby free demo + Render Free rollback; Stripe last; public demo stays `APP_MODE=demo`.

- Keep **Option A behaviors** (redaction-first UX) as default UX even under B.  
- Subprocessors draft: `docs/subprocessors.md`.  
- Do not take live $249 charges until Phase 4.

---

## Decision checklist

- [x] Pick Postgres vendor for PHI — **Neon Scale + BAA** (Amir locked)
- [ ] Amir: create Neon Scale org, accept BAA, HIPAA project (bots must not)
- [ ] Pick Azure OpenAI **or** Bedrock **or** “LLM later”
- [ ] Draft customer BAA + publish subprocessors
- [ ] Cut over off Free Render Postgres before ~**2026-10-15** (`docs/neon-cutover.md`)
- [ ] Decide paid Render web timing closer to PHI (no provision now)
- [ ] Stripe test → live gated by Phase 4 (`stripe-go-live.md`)
