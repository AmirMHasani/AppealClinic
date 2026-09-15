# Deploy to Vercel Hobby (free demo URL)

**Audience:** Amir / CoS — public **free** demo after leaving Render auto-deploy spam.  
**Live Render rollback:** keep `https://appealclinic.onrender.com` up until this URL smoke-passes.  
**Stripe:** last. **APP_MODE:** `demo`. **PHI:** not here — Neon Scale + BAA later (`docs/neon-cutover.md`).

## Why Vercel Hobby for the free demo

- Durable **$0** host that runs this Next.js App Router + Prisma cleanly.
- Railway free (~$1/mo credit) and Fly (no free tier for new accounts) are weaker for an always-on demo.
- JSON `data/store.json` is **not** durable on Vercel — **`DATABASE_URL` is required** (Postgres).

## Postgres (required)

Use **one** of:

1. **Render Free Postgres — EXTERNAL connection string** (same DB as today until ~2026-10-15).  
   Internal hostname (`dpg-…-a` without `.oregon-postgres.render.com`) **will not work** from Vercel.  
   Dashboard → Postgres → **External** URL. Append `?sslmode=require` if missing.
2. **Neon free** for demo only — **not** Scale / HIPAA / BAA yet.

Do **not** flip to Neon Scale+HIPAA in this migrate.

## Import steps (Amir clicks)

1. [vercel.com](https://vercel.com) → Add New → Project → import `AmirMHasani/AppealClinic` (GitHub).
2. Framework: Next.js (auto). Root: repo root.
3. **Environment variables** (Production + Preview):

```
AUTH_SECRET=<same strong secret as Render>
APP_MODE=demo
REQUIRE_REDACTION_CHECK=true
DATABASE_URL=<EXTERNAL Postgres URL>?sslmode=require
NEXT_PUBLIC_APP_URL=https://<project>.vercel.app
```

Omit all `STRIPE_*` for bootstrap. Never `STRIPE_LIVE_ENABLED=true`.

4. Deploy. First build runs `postinstall` → `prisma generate`.
5. Smoke: `/api/health` → `{ ok: true, db: true }` → login `demo@appealclinic.local` / `demo1234`.
6. Set `NEXT_PUBLIC_APP_URL` to the real `*.vercel.app` URL and redeploy if the first deploy used a placeholder.
7. Only after smoke passes: optionally pause Render auto-deploy / sleep the web service — **do not delete** until you’re sure.

## Build / install

| | |
| --- | --- |
| Install | `npm install` (runs `prisma generate` via `postinstall`) |
| Build | `next build` (Vercel default) |
| Start | Vercel serverless — **do not** use `start:render` |

## Custom domain

Optional later. Not required for first demos.

## PHI / BAA

Hobby Vercel is **not** the HIPAA story. Public demo stays synthetic. PHI path: Neon Scale + BAA + `APP_MODE=phi` checklist (`docs/phi-mode-checklist.md`).
