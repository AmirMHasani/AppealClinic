# Neon cutover (Render Free Postgres → Neon Scale + BAA)

**Status:** Planning only — **do not provision Neon or change Render `DATABASE_URL` in this pass.**  
**Locked by Amir (2026-09-15):** PHI database path = **Neon Postgres with BAA** (Scale plan).  
**App host:** Stay on **Render Free** web until closer to PHI. Do **not** provision Render Starter/paid or Fly in this phase.  
**Stripe:** Still last (Phase 4).  
**Public demo:** Keep `APP_MODE=demo` and current Render Free Postgres until an explicit cutover.

Official HIPAA docs: [https://neon.com/docs/security/hipaa](https://neon.com/docs/security/hipaa)

---

## Why cut over

| Today (demo) | PHI path (later) |
| --- | --- |
| Render Free web (`appealclinic.onrender.com`) | Same Render Free web for now; paid Render web **TBD** only when Amir chooses closer to PHI |
| Render Free Postgres `dpg-dakns77qj5pc73d7koj0-a` | **Neon Scale + HIPAA BAA** |
| Expires ~**2026-10-15** | BAA-capable; Free/Launch must **not** hold PHI |
| `APP_MODE=demo` | Separate PHI env may set `APP_MODE=phi` only after checklist |

---

## What Amir must click in Neon Console (before any migrate)

1. Open [https://console.neon.tech](https://console.neon.tech) and create/upgrade the org to the **Scale** plan.  
   - HIPAA is available on **Scale** (not Free, not Launch).  
   - Currently listed at **no extra cost** on Scale; confirm in Console (a future surcharge may apply per Neon docs).
2. **Organization settings → HIPAA support → enable → accept** the self-serve **BAA**.
3. **Create a project** (or enable HIPAA on an existing project).  
   - Enabling HIPAA on a project is **irreversible** and **restarts computes** (brief connection interrupt).  
   - Prefer creating the PHI project with HIPAA enabled from the start.
4. Copy the **pooled** connection string with `sslmode=require` (Neon Console → Connection details → pooled).  
   - Paste as `DATABASE_URL` on Render **only at cutover** — **not yet**.

Do **not** put PHI on Free/Launch projects.

---

## Connection string notes

- Prefer Neon **pooled** URL for the Next.js / Prisma app on Render (serverless-friendly pooling).
- Ensure `sslmode=require` (or Neon’s equivalent SSL params) is present.
- Example shape (placeholder — never commit real credentials):

```text
postgresql://USER:PASSWORD@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require
```

- Keep the Render Free Postgres URL as a rollback reference until cutover is verified (do not delete the Free instance until smoke passes and Free expiry is handled).

---

## Cutover checklist (execute later — not this task)

**Pre-flight (Amir + CoS)**

- [ ] Neon org on **Scale**; org-level HIPAA + BAA accepted
- [ ] PHI project HIPAA-enabled
- [ ] Customer BAA + subprocessors published (`docs/subprocessors.md`, `docs/phi-mode-checklist.md`)
- [ ] Backup / dump of Render Free Postgres (demo data only; no real PHI expected)
- [ ] Decide whether cutover target is still public demo URL or a separate PHI host/env

**Migrate (Engineering — when Amir says go)**

- [ ] Create schema on Neon: set local/CI `DATABASE_URL` to Neon pooled URL → `bunx prisma db push` (or `npm run db:push`) — **no `--force-reset`**
- [ ] Optional: `pg_dump` / restore demo rows if keeping Demo Clinic continuity
- [ ] On Render Dashboard → Environment: set `DATABASE_URL` to Neon pooled URL (replace Free Postgres)
- [ ] Leave **`APP_MODE=demo`** on the public demo unless this env is intentionally the BAA PHI environment
- [ ] Redeploy / rely on `npm run start:render` (`prisma db push` then `next start`)
- [ ] Smoke: `/api/health`, login, list cases, create synthetic case, generate, export DOCX
- [ ] Confirm Free Postgres can be retired before ~**2026-10-15** expiry

**PHI mode (only on a BAA environment — not the public synthetic demo)**

- [ ] Complete `docs/phi-mode-checklist.md`
- [ ] Set `APP_MODE=phi` only on that env (safety latch blocks `phi` on `*.onrender.com` unless `ALLOW_PHI_ON_DEMO_HOST=true`)
- [ ] Do **not** flip the public demo to PHI casually

---

## Explicit non-actions for this engineering prep

- Do **not** create the Neon project or accept the BAA from bots.
- Do **not** change live Render `DATABASE_URL` or `APP_MODE`.
- Do **not** provision Render Starter/paid or Fly.
- Do **not** enable Stripe live.

See also: `docs/baa-and-hosting-options.md`, `docs/deploy-cheap.md`, `docs/subprocessors.md`.
