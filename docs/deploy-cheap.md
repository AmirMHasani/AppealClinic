# Deploy on Render Free (locked demo host)

**Audience:** Amir / CoS — public demo URL at **$0**, then durable Postgres for multi-user.  
**Free demo URL (current preference):** **Vercel Hobby** — see `docs/deploy-vercel.md`.  
**Rollback host:** **Render Free Web Service** (Hobby + Free compute) — keep until Vercel smoke-passes.  
**Live service (current):** `srv-dafi4c5g1s2s73elki0g` → **https://appealclinic.onrender.com**  
**Postgres:** Render Free Postgres **already attached** via `DATABASE_URL` (same Blueprint / region). Instance id **`dpg-dakns77qj5pc73d7koj0-a`**. Free DB expires ~**2026-10-15** (30-day free from ~Sep 15 create) — **before expiry**, migrate to **Neon free** (paste pooled URL as `DATABASE_URL`) or **paid Render Postgres**. Do not wait until expiry day.  
**Primary free demo:** Vercel Hobby — `docs/deploy-vercel.md`. This file remains the **Render rollback / Postgres** runbook.  
**Stripe:** **last**. Omit all `STRIPE_*` for bootstrap demos. When ready, use **TEST** keys only (`STRIPE_LIVE_ENABLED=false`) — see paste list near the bottom and `docs/stripe-go-live.md`.  
**PHI:** synthetic / demo data only. Do not invent or load real PHI.

---

## Persistence model (canonical)

| `DATABASE_URL` | Backend | When to use |
| --- | --- | --- |
| **Unset** | Local JSON (`data/store.json`) | Laptop / CI / ephemeral demo only |
| **Set** | **Prisma → Postgres** | **Required** for production multi-user / durable hosted demo |

On Render Free, the filesystem is **ephemeral** (sleep/redeploy resets JSON).  
**Production multi-user path REQUIRES `DATABASE_URL`** (Neon free **or** Render Postgres).

**Current hosted demo:** `DATABASE_URL` is set; start command is `npm run start:render` / `bun run start:render`.

---

## Why Render Free

| | |
| --- | --- |
| **Cost** | **$0** to start (web). Postgres may be free (30-day) or cheapest basic. |
| **Fit** | Real Node process, `next start`, App Router API routes |
| **URL** | `https://appealclinic.onrender.com` (live) |
| **Tradeoff** | Free web instances **spin down after ~15 min idle**; first request can take **~30–60s**. |

**Not a fit:** Cloudflare Pages / Workers for plain `next start` without OpenNext rewrites.

---

## Quick steps (Render Free Web Service)

1. Push the repo to GitHub that Render can connect (`AmirMHasani/AppealClinic`).
2. Render Dashboard → **New** → **Web Service** → connect the repo (or use existing `appealclinic`).
3. Runtime: **Node**. Instance type: **Free**.
4. **Build command** (exact):

```
npm install && npx prisma generate && npm run build
```

(Bun equivalent already in `render.yaml`: `bun install --frozen-lockfile && bunx prisma generate && bun run build`.)

5. **Start command** (exact — must push schema when Postgres is configured):

```
npm run start:render
```

Which runs `scripts/start-with-db.sh`:

- If `DATABASE_URL` **set**:
  1. Best-effort `scripts/pre-tenancy-migrate.sql` (creates **Demo Clinic**, backfills `clinicId`)
  2. `prisma db push` — with **`--accept-data-loss`** when `APP_MODE=demo` or `PRISMA_ACCEPT_DATA_LOSS=true` (needed once for Phase 2 `ClinicSettings.clinicId` unique/FK from the old `id=default` row). **Not** `--force-reset`. `ensureTenancy()` re-seeds Demo Clinic letterhead/memberships on first request.
  3. `next start`
- If **unset**: `next start` only (JSON local/demo)

**Phase 2 note:** Hosted demo uses `APP_MODE=demo`, so the one-time accept-data-loss path is on. For a non-demo DB with real data, run a manual SQL migrate first and omit accept-data-loss — do not blindly accept data loss on PHI.

6. Set environment variables (table below). **Omit all Stripe vars.**
7. Deploy. After first deploy **with** `DATABASE_URL`: login `demo@appealclinic.local` / `demo1234` — cases persist across sleeps.
8. Smoke the checklist at the bottom.

---

## Environment variables

| Variable | Required? | Notes |
| --- | --- | --- |
| `AUTH_SECRET` | **Yes** | Strong random secret. Never ship `.env.example` default publicly. |
| `APP_MODE` | **Yes** | `demo` (banner + non-PHI posture). |
| `REQUIRE_REDACTION_CHECK` | **Yes (recommended)** | `true` on shared demos. |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Render HTTPS URL, e.g. `https://appealclinic.onrender.com`. |
| `DATABASE_URL` | **Required for multi-user** | Neon free **or** Render Postgres. Prefer **internal** connection string when DB is on Render in the **same region**. **Already set** on the live service. |
| `OPENAI_API_KEY` | Optional | Off is fine; rules engine is enough for demos. |
| `STRIPE_*` (test only) | Optional | When ready for test Checkout — see paste list below. **Never** set live keys / `STRIPE_LIVE_ENABLED=true` in Phase 1. |
| `STRIPE_LIVE_ENABLED` | **Omit or `false`** | Must stay false/unset. |

---

## Postgres (canonical production path)

### Live status

- Render Free Postgres is **attached** to the web service; multi-user persistence is **LIVE** (`/api/health` → `{ ok: true, db: true }`).
- Instance: **`dpg-dakns77qj5pc73d7koj0-a`** — Free tier expiry ~**2026-10-15**.
- **Before expiry (Amir / CoS pick):** migrate to **Neon free** (pooled URL → `DATABASE_URL`) **or** upgrade to **paid Render Postgres**. Calendar a cutover; do not wait until expiry day.

### Options

1. **Render Postgres** (same Blueprint / same region) — prefer the **Internal** Database URL for `DATABASE_URL` (lower latency, no egress). Blueprint wires:

```yaml
      - key: DATABASE_URL
        fromDatabase:
          name: appealclinic-db
          property: connectionString
```

`databases:` section names the DB `appealclinic-db` (`plan: free` if available; else `basic-256mb` or set a Neon URL manually).

2. **Neon free** — create project → copy pooled URL (`?sslmode=require`) → paste as `DATABASE_URL` on the web service (CoS may attach via Render REST API).

### Build / start (must match `render.yaml`)

| Phase | Command |
| --- | --- |
| **Build** | `npm install && npx prisma generate && npm run build` |
| **Start** | `npm run start:render` → `prisma db push` (safe, **no** force-reset) then `next start` when `DATABASE_URL` is set |

Do **not** use `--force-reset` or other destructive flags on production data.

### After first deploy with `DATABASE_URL`

1. Open the public URL (allow cold start).
2. Login: **`demo@appealclinic.local` / `demo1234`**
3. `ensureDefaults` + login `seedDemoCases(false)` create demo user, settings, AppMeta, and synthetic cases if missing.
4. Optional explicit seed from a laptop with the same URL:

```bash
export DATABASE_URL='postgresql://…'   # prefer Internal on Render
npm install && npx prisma generate
npm run db:seed            # upserts DEMO_USER + settings + AppMeta
npm run db:seed -- --cases # also upserts demo cases
# or: npm run seed         # seedDemoCases via app facade
```

5. Cases **persist across sleeps / redeploys** (unlike JSON).

### Local / laptop scripts

| Script | Purpose |
| --- | --- |
| `npm run db:generate` | `prisma generate` |
| `npm run db:push` | Push schema (dev); same safe push used on Render start |
| `npm run start:render` | Conditional `db push` + `next start` |
| `npm run db:seed` | Upsert demo user + settings (+ `--cases`) when `DATABASE_URL` set |
| `npm run seed` | `seedDemoCases` (JSON or Postgres) |
| `npm run db:migrate` / `db:migrate:deploy` / `db:release` | Optional migration history helpers (start path still uses `db push`) |

Without `DATABASE_URL`, leave Postgres scripts alone — JSON store is used automatically.

---

## Free tier: spin-down, cold start, keep-alive

- After ~15 minutes idle, the Free web service **spins down**.
- Next visitor hits a **cold start** (~30–60s). With Postgres, start also runs `prisma db push` (usually fast once schema matches).
- Acceptable for founder demos. For always-on: upgrade Render **only with Amir approving spend** — do not enable paid always-on without approval.

### Optional keep-alive (Free web sleep)

Free web sleeps after ~15 min idle; first hit can take ~30–60s (bad for a live PM walkthrough). Prefer a **keep-alive ping every 10–14 min**:

| Option | How |
| --- | --- |
| **UptimeRobot** (free) | HTTP(s) monitor → `https://appealclinic.onrender.com/api/health` every **10–14 min** |
| **cron** | `curl -fsS https://appealclinic.onrender.com/api/health` on the same interval |

Endpoints:

- `GET https://appealclinic.onrender.com/api/health` — preferred; lightweight JSON `{ ok: true, db: true|false }` (no secrets)
- `GET https://appealclinic.onrender.com/` — landing (heavier)

No paid always-on without Amir approving spend.

Short one-pager: **`docs/keepalive.md`**.

### Free Postgres expiry (calendar for CoS / Amir)

| | |
| --- | --- |
| **DB** | `appealclinic-db` / instance `dpg-dakns77qj5pc73d7koj0-a` |
| **Expires** | ~**2026-10-15** |
| **Options** | (1) **Neon free** — pooled URL → `DATABASE_URL`, or (2) **paid Render Postgres** |
| **Prefer** | **Internal** connection string when DB stays on Render same region |
| **Action** | Set a calendar reminder now; cut over before expiry day |

---

## Fallbacks (only if Render Free is wrong for you)

| Option | When | Notes |
| --- | --- | --- |
| **Railway** (Hobby) | Cold starts hurt; still want PaaS | Card + small spend usual. Same env; Node start. |
| **~$5 VPS** (Hetzner / DigitalOcean) | Want always-on + control | systemd/pm2 or Docker + Caddy/Nginx TLS. |
| **Cloudflare Pages** | — | **Not a fit** for plain `next start` + Node `fs` without OpenNext. |
| **Vercel Hobby** | **Preferred free demo URL** | Primary — `docs/deploy-vercel.md`. This Render doc = rollback. |

---

## Smoke checklist (after deploy)

- [x] Public HTTPS URL loads landing + demo login — https://appealclinic.onrender.com
- [ ] Login → case list → new appeal wizard → generate letter
- [ ] Edit letter → DOCX download and/or print works on **synthetic** cases
- [ ] Env banner shows demo / non-PHI posture (`APP_MODE=demo`)
- [ ] Stripe: leave unset for bootstrap OR use **test** keys only (`STRIPE_LIVE_ENABLED=false`); webhook `https://appealclinic.onrender.com/api/stripe/webhook`
- [ ] You can paste the URL into `docs/pilot-one-pager.md` for outreach
- [x] **With `DATABASE_URL`:** Postgres attached; cases persist across sleep/redeploy
- [ ] Login `demo@appealclinic.local` / `demo1234` works after first Postgres deploy
- [ ] Optional: `/api/health` returns `{ ok: true, db: true }` for keep-alive probes

**Then (last):** Stripe **test** Checkout — see `docs/stripe-go-live.md`.

### Stripe TEST env paste list (Render)

When enabling test Checkout (optional — omit entirely for bootstrap demos):

```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_LIVE_ENABLED=false
```

Webhook URL: `https://appealclinic.onrender.com/api/stripe/webhook`  
Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.  
**Never:** live Stripe or real PHI until BAAs (`docs/baa-and-hosting-options.md`).

---

## PHI reminder

This Render Free demo is **synthetic / demo-only** until a BAA path is in place. Do not load real patient data. Redaction-first UX stays on; treat the public URL as a product walkthrough, not a clinic system of record.

## Neon PHI cutover (later — do not execute now)

Amir locked PHI DB = **Neon Scale + HIPAA BAA**. Free demo app host = **Vercel Hobby** (Render Free = rollback). Do not provision Starter/Fly. Free Postgres expires ~**2026-10-15**. Runbook: `docs/neon-cutover.md`. Do **not** flip to PHI `DATABASE_URL` / `APP_MODE=phi` until Amir provisions Neon and signs the BAA. Stripe stays last.
