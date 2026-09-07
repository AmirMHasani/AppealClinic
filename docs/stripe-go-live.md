# Stripe go-live checklist — $249/mo Checkout

**Priority:** Stripe is **last**. Get a public demo URL first (`docs/deploy-cheap.md`). Keep Checkout stubbed or test-only; do **not** push live payments for the bootstrap demo.

**Product:** AppealClinic Clinic plan — **$249/month** per location (unlimited drafts).  
**Code today:** `POST /api/stripe/checkout` + `/api/stripe/status` are wired for **test mode**. Soft success/cancel pages exist. Webhook handler is still TODO for entitlements. Do **not** process live charges until Phase 2 exit + security review.

---

## Soft-launch gate (mandatory)

| Gate | Rule |
| --- | --- |
| Phase 2 exit | Shadow validation complete per `docs/phase-2-shadow-validation.md` (usable drafts, citation discipline, sample size) |
| Security review | Customer-facing story matches `docs/security-one-pager.md`; BAAs in motion if PHI is in scope |
| Live charges | **Still no live Stripe charges** until this gate is explicitly cleared — even if keys exist in an env |

Until the gate clears: use **test mode** only, or leave keys unset so `/upgrade` shows “Available after security review.”

---

## 1. Stripe account & catalog

1. Create a Stripe account (or use an existing one under the operating entity).  
2. Complete business / payout details before live mode.  
3. **Product:** e.g. `AppealClinic — Clinic (per location)`.  
4. **Price:** recurring **$249.00 USD / month**. Copy the Price ID (`price_...`).  
5. Optional: trial (product concept is “3 free drafts”) — implement as app-side draft limits *or* Stripe trial days; decide one approach and document it.

---

## 2. Webhook

1. Developers → Webhooks → Add endpoint.  
2. URL (production target): `https://<your-domain>/api/stripe/webhook`  
3. Events to start with:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid` / `invoice.payment_failed` (recommended)
4. Copy **Webhook signing secret** → `STRIPE_WEBHOOK_SECRET`.  
5. Implement signature verification with the raw body (Next.js App Router: use the request text, not parsed JSON twice).

*Not implemented in the MVP repo yet — add when enabling Checkout.*

---

## 3. Environment variables

See `.env.example`. Set in Vercel/host secrets (never commit real keys):

| Variable | Purpose |
| --- | --- |
| `AUTH_SECRET` | Strong random secret for session cookies (required in any shared deploy) |
| `STRIPE_SECRET_KEY` | `sk_test_...` then later `sk_live_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` / `pk_live_...` |
| `STRIPE_PRICE_ID` | `price_...` for the $249/mo price |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |

**Do not implement live charges without keys** — and do not put live keys in the repo.

---

## 4. What to change in the app (read `/upgrade` first)

### Current behavior (`src/app/upgrade/page.tsx`)

- Client page; requires login via `/api/auth/me`.  
- Shows $249/mo copy.  
- If keys missing → configure prompt. If test keys present → Checkout enabled. Live keys need `STRIPE_LIVE_ENABLED=true`.  
- Test Checkout redirects to Stripe; do not take real money until MVP checklist + live flag.  
- Footer: no charges until Phase 2 / security review.

### When implementing Checkout (future PR)

1. **API route** e.g. `POST /api/stripe/checkout`  
   - Auth required.  
   - Create Stripe Checkout Session in `subscription` mode with `STRIPE_PRICE_ID`.  
   - `success_url` / `cancel_url` back to app.  
   - Return `{ url }` and redirect client.
2. **Webhook route** e.g. `POST /api/stripe/webhook`  
   - Verify signature.  
   - Mark clinic/location as `plan: paid` (requires DB beyond JSON demo when multi-tenant).  
3. **`/upgrade` page**  
   - Call checkout API on button click.  
   - Disable button while redirecting.  
   - Keep clear copy if soft-launch gate is closed (feature flag recommended: `STRIPE_LIVE_ENABLED=false`).
4. **`/pricing`**  
   - Point CTA at `/upgrade`; avoid “broken stub” language once gated copy is in place.
5. **Entitlements**  
   - Enforce free-draft limit vs paid in API when you leave pure demo mode.

---

## 5. Test mode vs live

| Mode | Keys | Use |
| --- | --- | --- |
| **Test** | `sk_test_` / `pk_test_` | Card `4242…`; verify session + webhook locally (`stripe listen`) |
| **Live** | `sk_live_` / `pk_live_` | Only after soft-launch gate; real $249 charges |

Checklist before flipping live keys:

- [ ] Test Checkout end-to-end  
- [ ] Webhook updates subscription state correctly  
- [ ] Cancel / failed payment paths understood  
- [ ] Phase 2 exit signed off  
- [ ] Security one-pager reviewed with first pilot  
- [ ] `STRIPE_LIVE_ENABLED` (or equivalent) explicitly true  

---

## 6. Soft launch messaging

Until the gate clears, UI should say roughly:

> **Available after security review** — Checkout will be enabled when Phase 2 validation and security review are complete. No live charges in this build.

Do not imply the product is broken; imply it is **intentionally gated**.

---

## 7. Rollback

- Remove or rotate live keys.  
- Set publishable key unset or `STRIPE_LIVE_ENABLED=false` so `/upgrade` returns to gated stub.  
- Pause the Price in Stripe Dashboard if needed.
