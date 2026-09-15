# Deploy on Render Free (locked demo host)

**Audience:** Amir / CoS — public demo URL at **$0**, then durable Postgres for multi-user.  
**Locked host:** **Render Free Web Service** (Hobby workspace + Free compute).  
**Live service (current):** `srv-dafi4c5g1s2s73elki0g` → **https://appealclinic.onrender.com**  
**Postgres:** Render Free Postgres **already attached** via `DATABASE_URL` (same Blueprint / region). Free DB expires ~**Oct 15, 2026** (30-day free from ~Sep 15 create) — plan **Neon free** or **paid Render Postgres** before expiry.  
**Do not** treat Vercel as the default. Vercel remains optional only — see `docs/deploy-vercel.md`.  
**Stripe:** leave **unset**. Stripe is **last** — omit all `STRIPE_*` vars for bootstrap demos.  
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

- If `DATABASE_URL` **set**: `prisma db push` (**no** `--force-reset`) → `next start`
- If **unset**: `next start` only (JSON local/demo)

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
| `STRIPE_*` / `STRIPE_LIVE_ENABLED` | **Omit** | Stripe last — leave unset for bootstrap demos. |

---

## Postgres (canonical production path)

### Live status

- Render Free Postgres is **attached** to the web service; multi-user persistence is **LIVE**.
- Free tier expiry ~**Oct 15, 2026** — before then: migrate to **Neon free** (paste pooled URL as `DATABASE_URL`) or upgrade to paid Render Postgres. Do not wait until expiry day.

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

Hit periodically (e.g. cron every 10–14 min) to reduce cold starts:

- `GET https://appealclinic.onrender.com/` — landing
- `GET https://appealclinic.onrender.com/api/health` — lightweight JSON `{ ok: true, db: <boolean whether DATABASE_URL is set> }` (no secrets)

No paid always-on without Amir approving spend.

---

## Fallbacks (only if Render Free is wrong for you)

| Option | When | Notes |
| --- | --- | --- |
| **Railway** (Hobby) | Cold starts hurt; still want PaaS | Card + small spend usual. Same env; Node start. |
| **~$5 VPS** (Hetzner / DigitalOcean) | Want always-on + control | systemd/pm2 or Docker + Caddy/Nginx TLS. |
| **Cloudflare Pages** | — | **Not a fit** for plain `next start` + Node `fs` without OpenNext. |
| **Vercel** | Explicit preference only | Optional — `docs/deploy-vercel.md`. Not the locked default. |

---

## Smoke checklist (after deploy)

- [x] Public HTTPS URL loads landing + demo login — https://appealclinic.onrender.com
- [ ] Login → case list → new appeal wizard → generate letter
- [ ] Edit letter → DOCX download and/or print works on **synthetic** cases
- [ ] Env banner shows demo / non-PHI posture (`APP_MODE=demo`)
- [ ] No Stripe keys set; `/upgrade` stays gated or stub messaging
- [ ] You can paste the URL into `docs/pilot-one-pager.md` for outreach
- [x] **With `DATABASE_URL`:** Postgres attached; cases persist across sleep/redeploy
- [ ] Login `demo@appealclinic.local` / `demo1234` works after first Postgres deploy
- [ ] Optional: `/api/health` returns `{ ok: true, db: true }` for keep-alive probes

**Then (last):** Stripe **test** Checkout — see `docs/stripe-go-live.md`.  
**Never:** live Stripe or real PHI until BAAs (`docs/baa-and-hosting-options.md`).

---

## PHI reminder

This Render Free demo is **synthetic / demo-only** until a BAA path is in place. Do not load real patient data. Redaction-first UX stays on; treat the public URL as a product walkthrough, not a clinic system of record.
