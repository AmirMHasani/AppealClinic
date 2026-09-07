# BAA & hosting options (founder note)

**For:** Amir Hasani  
**Goal:** Choose a path that is sellable to independent derm clinics without overbuilding on a ~$500 bootstrap.

**Demo hosting lock (bootstrap):** Public demo URL is **locked to Render Free** — follow `docs/deploy-cheap.md`. **Stripe test is last** (after hosted demo smoke). **Vercel is optional** only (`docs/deploy-vercel.md`), not the default. This note is about **sellable / PHI-capable** hosting later — not the ASAP demo link.

---

## Option A — Redaction-only forever

**Model:** Never accept PHI. Product remains “paste de-identified denial + clinical bullets only.” No customer BAA; no BAA with LLM vendors required if nothing identifiable is stored or sent.

| Pros | Cons |
| --- | --- |
| Lowest legal/ops burden | Weaker sales story — many PMs expect a BAA before they trust a vendor |
| Stays cheap (Render Free / cheap Postgres or even file store) | Shadow validation and real workflows are awkward; staff will slip and paste PHI anyway |
| Honest if enforced | Harder to expand into sticky “clinic workspace” features |

**Verdict:** Fine as a **demo / Phase 1–2** posture. Weak as the **only** forever posture for paid SaaS.

---

## Option B — Cheap Node host / Fly + Postgres + Azure OpenAI or Bedrock (BAA) — **recommended for sellable v1**

**Model:** Hosted Next.js app; managed Postgres; optional letter polish via a **BAA-capable** LLM; Stripe for $249/mo; customer BAA + vendor BAAs before PHI workflows.

### Suggested stack

| Layer | Choice | Why |
| --- | --- | --- |
| App | **Render / Railway / small VPS** for demos (`deploy-cheap.md`); **Fly.io** when you want long-lived Node closer to the DB; Vercel optional | Prefer real Node while JSON store remains; HTTPS |
| DB | **Managed Postgres** (Neon free / Render Postgres early; BAA-capable vendor when PHI) | Replace `data/store.json` |
| LLM | **Azure OpenAI** *or* **AWS Bedrock** | Both are realistic BAA paths; core generator stays deterministic/rules-based so LLM is optional |
| Payments | **Stripe** Checkout subscription | Industry-standard; PCI stays with Stripe |
| Auth | Keep simple at first; upgrade secrets + HTTPS cookies | Don’t boil the ocean before Phase 2 exit |

### Rough cost (bootstrap within/near **$500** where possible)

| Item | Ballpark (USD) | Notes |
| --- | --- | --- |
| Domain + DNS | $10–20/yr | One-time-ish |
| Render Free → Starter | $0–7/mo | Free for demo; Starter if cold starts hurt. Vercel is optional/expensive — not default |
| Managed Postgres | $0–25/mo | Free tiers exist; budget ~$15–25 when you need persistence + backups |
| Azure OpenAI / Bedrock | **Usage** | Often **$20–150+/mo** depending on polish volume — **ongoing LLM cost is the swing factor** |
| Stripe | % + fixed per charge | No large fixed fee; $249/mo subscription fees are customer-paid |
| Legal BAA templates / review | $0–500 one-time | Biggest bootstrap risk; reuse counsel templates if possible |

**Bootstrap tip:** Ship **rules engine without LLM** in production first; add Azure/Bedrock only when a pilot needs polish *and* BAAs are signed. That keeps month-1 infra nearer the $0–50 band and reserves cash for BAA counsel + Stripe live mode.

**Ongoing LLM:** Treat as COGS. Meter tokens; default polish off or on a short prompt; never send full charts.

### BAA sequence (Option B)

1. Customer BAA template ready.  
2. Vendor BAAs for DB (+ LLM if used) before PHI.  
3. Stripe live charges only after **Phase 2 shadow-validation exit** (see `stripe-go-live.md`).

---

## Option C — Fully self-hosted later

**Model:** Clinic or Amir runs the stack in a VPC (ECS/EKS/k8s, private Postgres, private LLM endpoint). Maximum control; maximum ops.

| Pros | Cons |
| --- | --- |
| Strong enterprise narrative | Not realistic on a $500 bootstrap |
| Data never leaves customer cloud (in theory) | Support burden, patching, on-call |
| Useful as a **Phase 3+** upsell | Slows sellable v1 |

**Verdict:** Document as a **future** path for multi-location groups; do not block v1 on it.

---

## Recommendation

**Choose Option B for sellable v1.**

- Keep **Option A behaviors** (redaction-first UX, urge de-identification) as the default UX even under B.  
- Use **Option C** only when a large customer pays for it.  
- Cap early spend: cheap Node host (`deploy-cheap.md`) + small Postgres later + Stripe **last** (test only until Phase 2); defer LLM until BAAs + real volume.  
- Do not take live $249 charges until Phase 2 exit criteria are met (`docs/phase-2-shadow-validation.md`) and security review is done.

---

## Decision checklist

- [ ] Pick Postgres vendor and confirm BAA availability  
- [ ] Pick Azure OpenAI **or** Bedrock (or “LLM later”)  
- [ ] Draft customer BAA + subprocessors list (`security-one-pager.md`)  
- [ ] Migrate off JSON store before PHI  
- [ ] Stripe test → live gated by Phase 2 (`stripe-go-live.md`)
