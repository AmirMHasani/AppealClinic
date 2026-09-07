# Deploy to Vercel (optional — not preferred)

> **Hosting preference:** Vercel is **optional**, not the primary path for Amir’s bootstrap demo.  
> Prefer **$0 / cheap Node hosts** in **`docs/deploy-cheap.md`** (default: **Render Free**).  
> Use this doc only if you already have Vercel set up or explicitly want it.

See also: `docs/baa-and-hosting-options.md` (PHI / BAA later — separate from first demo URL).

## Why it is not preferred for this MVP

- This app persists demo state with **`data/store.json` via Node `fs`**. On Vercel, the filesystem is **ephemeral / not a durable store** across serverless invocations — fine for throwaway clicks, awkward as a “stable demo workspace.”
- Cold/serverless behavior and platform lock-in are unnecessary when Render Free / Railway / a $4–6 VPS run plain `next start`.
- Stripe stays **last** either way — do not couple “first URL” to Checkout.

## If you still deploy on Vercel

1. Import repo on vercel.com  
2. Set `AUTH_SECRET` and `APP_MODE=demo`  
3. Optional Stripe **test** keys for `/upgrade` only — leave unset for first demos; never enable live payments here  
4. Deploy; use `*.vercel.app` until custom domain  
5. Treat `store.json` as **ephemeral** — demo / synthetic only  
6. PHI pilots need BAA-capable hosting (Enterprise or alternate) — not Hobby Vercel as a compliance story  

## Env checklist

- `AUTH_SECRET` (required)
- `APP_MODE=demo`
- `REQUIRE_REDACTION_CHECK=true` (recommended)
- Stripe test keys + `STRIPE_PRICE_ID` (optional — **last**)
- `STRIPE_LIVE_ENABLED` only for live (do **not** set for demos)
- `NEXT_PUBLIC_APP_URL` = deploy URL

## Custom domain

Add in Vercel Domains later; not required for first demos.

## Required env for hosted demo

| Var | Notes |
| --- | --- |
| AUTH_SECRET | Random secret for session cookies |
| APP_MODE | Keep `demo` until BAAs |
| DATABASE_URL | Neon (or other) Postgres — **required**; JSON file store does not work on Vercel |
| REQUIRE_REDACTION_CHECK | Prefer `true` on shared demos |

### Neon free tier

1. Create a project at https://neon.tech  
2. Copy the connection string into Vercel → Settings → Environment Variables as `DATABASE_URL`  
3. From your laptop (or a one-off CI step): `bun run db:generate && bun run db:push`  
4. Redeploy

Also see `docs/deploy-cheap.md` and `docs/baa-and-hosting-options.md`.
