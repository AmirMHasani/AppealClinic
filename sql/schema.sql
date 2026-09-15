-- LEGACY / unused by the app.
-- Canonical schema is prisma/schema.prisma + prisma/migrations.
-- When DATABASE_URL is set, apply with: npm run db:migrate:deploy  (or npm run db:push)
-- Then seed synthetic demo user/cases: npm run seed
-- Do not invent PHI. Stripe stays off until docs/stripe-go-live.md.

CREATE TABLE IF NOT EXISTS clinic_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cases_updated_at_idx ON cases (updated_at DESC);
