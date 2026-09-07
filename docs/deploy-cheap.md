# Deploy on Render Free (locked demo host)

**Audience:** Amir — first public demo URL at **$0**.  
**Locked host:** **Render Free Web Service** (Hobby workspace + Free compute).  
**Do not** treat Vercel as the default. Vercel remains optional only — see `docs/deploy-vercel.md`.  
**Stripe:** leave **unset** until the hosted demo smoke checklist passes. Stripe is **last**.

PHI / BAA later: `docs/baa-and-hosting-options.md`. This guide is **demo / synthetic data only**.

---

## Why Render Free

| | |
| --- | --- |
| **Cost** | **$0** to start |
| **Fit** | Real Node process, `npm run start` (`next start`), App Router API routes |
| **URL** | `https://<service>.onrender.com` after Git connect |
| **Tradeoff** | Free instances **spin down after ~15 min idle**; first request can take **~30–60s** (cold start / wake page). Fine for founder demos — warn PMs once. |

**Not a fit:** Cloudflare Pages / Workers for plain `next start` (no durable Node + local `fs` without OpenNext rewrites). Prefer Render Free first.

---

## Quick steps (Render Free Web Service)

1. Push the repo to GitHub/GitLab/Bitbucket that Render can connect.
2. Render Dashboard → **New** → **Web Service** → connect the repo.
3. Runtime: **Node**. Instance type: **Free**.
4. **Build command** (exact — see next fence):

```
npm install && npx prisma generate && npm run build
```

5. **Start command** (exact — see next fence):

```
npm run start
```

6. Set environment variables (below). **Omit all Stripe vars** for the first demo URL.
7. Deploy. Open the public HTTPS URL and use the README demo login.
8. Smoke the checklist at the bottom. Only then consider Stripe **test** keys (`docs/stripe-go-live.md`).

---

## Environment variables

| Variable | Required for first demo? | Notes |
| --- | --- | --- |
| `AUTH_SECRET` | **Yes** | Strong random secret. Never ship the `.env.example` default on a public URL. |
| `APP_MODE` | **Yes** | Set to `demo` (banner + non-PHI posture). |
| `REQUIRE_REDACTION_CHECK` | **Yes (recommended)** | `true` on shared demos. |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Your Render HTTPS URL, e.g. `https://appealclinic-demo.onrender.com`. |
| `DATABASE_URL` | When ready | Add managed Postgres (Neon / Render Postgres / etc.) before multi-user or durable demos. Prisma is already in the project — generate runs in the build command. |
| `OPENAI_API_KEY` | Optional | Off is fine; rules engine is enough for demos. |
| `STRIPE_*` / `STRIPE_LIVE_ENABLED` | **Omit until last** | No Stripe on first hosted demo. Test mode only after smoke; never live for bootstrap demos. |

Free-tier disk for `data/store.json` is **ephemeral** across restarts/sleep. Seeded synthetic cases are fine; do not rely on it for real multi-user persistence — add Postgres (`DATABASE_URL`) before that.

---

## Free tier: spin-down and cold start

- After ~15 minutes idle, the Free web service **spins down**.
- The next visitor hits a **cold start** (~30–60s). Render may show a wake/loading page.
- Acceptable for founder demos and one-off PM walkthroughs.
- If shared pilot links need always-on: upgrade Render (always-on / Starter class), or use a fallback below.

---

## Postgres (recommended before multi-user)

Prisma is already in the project. Before multiple people share a durable demo workspace:

1. Provision a small managed Postgres (Neon free tier, Render Postgres, etc.).
2. Set `DATABASE_URL` on the Render service.
3. Ensure build still runs `npx prisma generate` (already in the build command).
4. Apply schema from your laptop/CI as you already do locally (`db:push` / migrate — follow project scripts).
5. Redeploy.

Until then, the JSON file store is demo-only and may reset on sleep/redeploy.

---

## Fallbacks (only if Render Free is wrong for you)

| Option | When | Notes |
| --- | --- | --- |
| **Railway** (Hobby) | Cold starts hurt; still want PaaS | Card + small spend usual. Same env; Node start. |
| **~$5 VPS** (Hetzner / DigitalOcean) | Want always-on + control | systemd/pm2 or Docker + Caddy/Nginx TLS. More ops. |
| **Cloudflare Pages** | — | **Not a fit** for this app's plain `next start` + Node `fs` store without a Workers/OpenNext rewrite. Skip for ASAP demo. |
| **Vercel** | Explicit preference only | Optional — `docs/deploy-vercel.md`. Not the locked default. |

---

## Smoke checklist (after deploy)

- [ ] Public HTTPS URL loads landing + demo login
- [ ] Login → case list → new appeal wizard → generate letter
- [ ] Edit letter → DOCX download and/or print works on **synthetic** cases
- [ ] Env banner shows demo / non-PHI posture (`APP_MODE=demo`)
- [ ] No Stripe keys set; `/upgrade` stays gated or stub messaging
- [ ] You can paste the URL into `docs/pilot-one-pager.md` for outreach

**Then (last):** Stripe **test** Checkout with founder test keys — see `docs/stripe-go-live.md`.  
**Never:** live Stripe or real PHI until BAAs (`docs/baa-and-hosting-options.md`).

---

## PHI reminder

This Render Free demo is **synthetic / demo-only** until a BAA path is in place. Do not load real patient data. Redaction-first UX stays on; treat the public URL as a product walkthrough, not a clinic system of record.
