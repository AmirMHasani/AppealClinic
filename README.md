# AppealClinic

Self-serve SaaS MVP for independent US dermatology clinics: paste a biologic/JAK prior-auth or claim denial + clinical evidence, then generate an insurer-ready appeal / medical-necessity letter + evidence checklist. Export DOCX/PDF. No EHR. No auto-submit. Synthetic/demo data only.

## Stack

- Next.js App Router + TypeScript + Tailwind CSS
- Local demo auth (JWT cookie via jose) — no external SaaS keys required
- Persistence: JSON store under `data/store.json` (works on Render/Railway/VPS Node). Optional `DATABASE_URL` (Prisma/Neon) mainly if using Vercel — not required for the preferred cheap demo host
- Letter generator: deterministic template/rules engine (required). Optional OpenAI if OPENAI_API_KEY is set
- DOCX via docx package; PDF via print-friendly route (/cases/[id]/print)
- Stripe: **last** — Checkout stubbed / test-only; leave keys unset for demos; do not push live payments

## Quick start

```bash
cd /workspace/AppealClinic
bun install
# or use your Node package manager: install then run dev
cp .env.example .env.local
bun run dev
```

Open http://localhost:3000

### Demo login

- Email: demo@appealclinic.local
- Password: demo1234

On login, three synthetic demo cases (PsO / AD / HS) are seeded if missing. Use Reload demo cases on the dashboard to reset them.

### Production build

```bash
bun run build
bun run start
```

## Postgres (optional)

When `DATABASE_URL` is set, the app uses Prisma (`prisma/schema.prisma`). Apply schema with `bun run db:push`. Leave unset for local demo / Render Free JSON. See `docs/deploy-cheap.md`.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| AUTH_SECRET | Required on deploy | Signs session cookies; refuse weak defaults in production |
| APP_MODE | No (default demo) | demo banner vs production |
| REQUIRE_REDACTION_CHECK | No | Hard-block non-SSN redaction hits when true |
| DATABASE_URL | No | Prisma Postgres when set; else JSON |
| APP_MODE | No | `demo` (default) shows banner; `production` hides it |
| REQUIRE_REDACTION_CHECK | No | When true, block any PHI-pattern hits; SSN always blocks |
| DATABASE_URL | No* | Prisma Postgres (Neon). *Required on Vercel; leave unset for local/Render JSON |
| OPENAI_API_KEY | No | Optional letter polish |
| STRIPE_SECRET_KEY | No | Stripe Checkout |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | No | Stripe UI |
| STRIPE_PRICE_ID | No | Stripe price |

## PHI / HIPAA warning

Do not enter real PHI in this MVP. Use synthetic data, internal case IDs, and optional initials only. The UI shows a redaction warning on the wizard.

Every generated letter includes the footer:
Draft for clinical/billing review. Confirm payer criteria and deadlines before submission.

## Generation rules (hard)

- Only wizard field facts are used
- Citations only from payer pack slots or user-pasted guidelines; otherwise emit Citation needed
- Payer packs ship with placeholder citation slots

## v1 scope

- Indications: plaque_psoriasis, atopic_dermatitis, hidradenitis_suppurativa
- Denial types: step_therapy, medical_necessity, non_formulary, quantity_limit
- Payers: UHC, Aetna, Cigna, Anthem, Humana, Independence Blue Cross

## Main routes

- / — Landing
- /pricing — Pricing
- /login — Demo login
- /dashboard — Case list + status counts
- /cases/new — Multi-step wizard
- /cases/[id] — Letter edit, checklist, gaps, outcome, export
- /cases/[id]/print — Print / Save as PDF
- /settings — Clinic letterhead
- /upgrade — Stripe stub

## Project layout

```
src/app/           App Router pages + API
src/components/    Nav, banners, badges
src/lib/config/    indications, drugs, payers, denial types
src/lib/auth/      demo session
src/lib/db/        JSON store + seed
src/lib/generator/ generateAppeal + checklist
src/lib/export/    DOCX
data/              store.json at runtime
```

## What works vs stubbed

| Feature | Status |
| --- | --- |
| Demo login + seeded cases | Works |
| Wizard create + generate | Works |
| Checklist + gaps | Works |
| Edit letter markdown | Works |
| DOCX export | Works |
| PDF via print route | Works |
| Settings / letterhead | Works |
| Outcome tracking | Works |
| OpenAI polish | Optional |
| Stripe checkout | Test-mode wired; live gated |
| EHR / auto-submit | Out of scope |

## Publish to Origin (amir-hasani/AppealClinic)

The empty Origin repo already exists. From a machine with the Origin CLI authenticated:

```bash
# If you downloaded the tarball, unpack first
# tar -xzf AppealClinic-mvp.tar.gz && cd AppealClinic

cd /path/to/AppealClinic
git init
git add .
git commit -m "Initial AppealClinic MVP"
git branch -M main
git remote add origin https://origin.cursor.com/amir-hasani/AppealClinic.git
git push -u origin main
```

Or clone the empty Origin repo, copy these files in, commit, and push:

```bash
origin repo clone amir-hasani/AppealClinic
# copy project files into the clone (exclude node_modules and .next)
git add . && git commit -m "Initial AppealClinic MVP" && git push
```



## Hosting (preferred: cheap / $0 first)

**Default for a solo-founder public demo URL ASAP:** **Render Free** web service — **$0** to start, full Node so `next start` + `data/store.json` work. Expect ~30–60s cold start after idle.

Full comparison (Cloudflare/OpenNext caveats, Railway Hobby, Hetzner/DO VPS $4–6, when to upgrade): **`docs/deploy-cheap.md`**.

- **Stripe is last** — leave Checkout unset for the first demo; test-only if you exercise `/upgrade`; do **not** enable live payments (`docs/stripe-go-live.md`).
- **Vercel is optional, not preferred** — see `docs/deploy-vercel.md` only if you already want it. Ephemeral serverless FS is a poor fit for the JSON demo store.
- PHI / BAA hosting later: `docs/baa-and-hosting-options.md` (separate from first demo URL).

## Golden-set QA (Phase 1)

Synthetic letter-quality suite (40 cases) that calls the same `generateAppeal` path as the app and scores letters against `golden-set/rubric.md`.

```bash
# (Re)build case JSON fixtures if needed
bun run golden:build-cases

# Run suite — writes golden-set/results/latest-report.json and prints pass rate
bun run golden
```

Pass rule per case: overall average ≥ 0.9 **and** citation criterion (4) = 1.0. Suite target: ≥ 90% cases pass. OpenAI polish is disabled during golden runs for determinism.

Cases: `golden-set/cases/*.json` (also `golden-set/cases.json`). Rubric: `golden-set/rubric.md`.

## Roadmap (MVP-first)

1. **Ship approachable MVP** — demo URL, redaction, golden-set, docs (`docs/mvp-definition.md`).
2. **Then approach businesses** — pilot one-pager + security one-pager; 14-day pilot at $249/mo.
3. **Deprioritized as MVP prerequisite:** asking clinics for shadow packets. Shadow validation is optional quality fuel after you have a product to show — not a gate to build.

Deploy: `docs/deploy-cheap.md` (default Render Free; Vercel optional). Stripe **last**: `docs/stripe-go-live.md` (no real money until founder flips live + checklist).



## Hosted demo (preferred path)

**Prefer:** **Render Free** (or other cheap Node hosts) so `next start` can use the local JSON store for synthetic demos — see **`docs/deploy-cheap.md`**. Leave Stripe unset.

**Optional / not preferred:** Vercel — serverless FS cannot reliably write `data/store.json`. Only if you insist on Vercel, use Postgres (`DATABASE_URL` / Neon) and follow `docs/deploy-vercel.md`. When `DATABASE_URL` is unset, the app keeps using the local JSON store (fine for `bun run dev` and Render-style Node hosts).

## CI

GitHub Actions: `.github/workflows/ci.yml` runs install → `prisma generate` → lint → `bun run build` → `bun run golden`.

Locally:

```bash
bun run ci
# or: bash scripts/ci.sh
```

## License

Private unpublished MVP — internal use until product-spec phase gates are met.
