# Stripe go-live checklist — $249/mo Checkout

**Priority:** Stripe is **last**. Get a public demo URL first (`docs/deploy-cheap.md`). Use **TEST mode only** for Phase 1.  
**Never enable live:** keep `STRIPE_LIVE_ENABLED=false` (or unset). Live keys / livemode webhook events are rejected.

**Product:** AppealClinic Clinic plan — **$249/month** per location (unlimited drafts).  
**Code today:** `POST /api/stripe/checkout`, `GET /api/stripe/status`, and `POST /api/stripe/webhook` (signature verify + AppMeta entitlement). Soft success/cancel pages exist. Do **not** process live charges until Phase 2 exit + security review.

---

## Soft-launch gate (mandatory)

| Gate | Rule |
| --- | --- |
| Phase 2 exit | Shadow validation complete per `docs/phase-2-shadow-validation.md` |
| Security review | Customer-facing story matches `docs/security-one-pager.md`; BAAs in motion if PHI is in scope |
| Live charges | **Still no live Stripe charges** until this gate is explicitly cleared |

Until the gate clears: use **test mode** only, or leave keys unset so `/upgrade` shows “not configured.”

---

## Exact Render env vars (TEST only) — paste list for Amir

Set these on **https://dashboard.render.com** → Web Service `appealclinic` → Environment.  
**Do not commit real keys.** Leave unset until you are ready to test Checkout.

```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_LIVE_ENABLED=false
NEXT_PUBLIC_APP_URL=https://appealclinic.onrender.com
```

| Variable | Exact form | Notes |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Stripe Dashboard → Developers → API keys (Test mode) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | Same page, publishable key |
| `STRIPE_PRICE_ID` | `price_...` | Recurring $249/mo Price ID |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | From the webhook endpoint signing secret |
| `STRIPE_LIVE_ENABLED` | `false` | **Omit or false** — never `true` for Phase 1 |
| `NEXT_PUBLIC_APP_URL` | `https://appealclinic.onrender.com` | Checkout success/cancel return base |

### Webhook URL (exact)

```
https://appealclinic.onrender.com/api/stripe/webhook
```

Stripe Dashboard → Developers → Webhooks → Add endpoint → select events:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Optional later: `invoice.paid`, `invoice.payment_failed`.

Handler verifies signature with raw body, rejects `livemode` events unless `STRIPE_LIVE_ENABLED=true`, and stores a minimal entitlement flag on `AppMeta` (`planEntitled`, `subscriptionStatus`, customer/subscription ids).

---

## 1. Stripe account & catalog

1. Create a Stripe account (or use an existing one under the operating entity).  
2. Complete business / payout details before live mode.  
3. **Product:** e.g. `AppealClinic — Clinic (per location)`.  
4. **Price:** recurring **$249.00 USD / month**. Copy the Price ID (`price_...`).  
5. Optional: trial (product concept is “3 free drafts”) — implement as app-side draft limits *or* Stripe trial days; decide one approach and document it.

---

## 2. What the app does today

| Route | Behavior |
| --- | --- |
| `POST /api/stripe/checkout` | Auth required; creates subscription Checkout Session when **test** keys present (or live only if flag on) |
| `GET /api/stripe/status` | Keys present, mode, checkout allowed, `planEntitled` |
| `POST /api/stripe/webhook` | Signature verify; entitlement on AppMeta; live events blocked by default |
| `/upgrade` | Gates on keys; test Checkout button when allowed |

---

## 3. Test mode vs live

| Mode | Keys | Use |
| --- | --- | --- |
| **Test** | `sk_test_` / `pk_test_` | Card `4242…`; verify session + webhook |
| **Live** | `sk_live_` / `pk_live_` | Only after soft-launch gate; requires `STRIPE_LIVE_ENABLED=true` |

Checklist before flipping live keys:

- [ ] Test Checkout end-to-end  
- [ ] Webhook updates `planEntitled` correctly  
- [ ] Cancel / failed payment paths understood  
- [ ] Phase 2 exit signed off  
- [ ] Security one-pager reviewed with first pilot  
- [ ] `STRIPE_LIVE_ENABLED` explicitly true  

---

## 4. Soft launch messaging

Until the gate clears, UI should say roughly:

> Checkout not configured — set test keys in the host env, or keep gated until security review.

Do not imply the product is broken; imply it is **intentionally gated**.

---

## 5. Rollback

- Remove or rotate keys.  
- Set `STRIPE_LIVE_ENABLED=false` so live is blocked.  
- Pause the Price in Stripe Dashboard if needed.
