#!/usr/bin/env bash
# Production start for Render (and similar hosts).
# When DATABASE_URL is set: apply Prisma schema safely, then next start.
# When unset: JSON local/demo store — just next start.
set -euo pipefail

cd "$(dirname "$0")/.."

run_prisma() {
  if command -v bunx >/dev/null 2>&1; then
    bunx prisma "$@"
  else
    npx prisma "$@"
  fi
}

if [ -n "${DATABASE_URL:-}" ]; then
  echo "[start-with-db] DATABASE_URL set — Phase 2 pre-tenancy SQL (Demo Clinic + backfill)"
  # Best-effort: ignore if SQL client unavailable; db push + ensureTenancy still recover demo.
  if run_prisma db execute --file scripts/pre-tenancy-migrate.sql --schema prisma/schema.prisma; then
    echo "[start-with-db] pre-tenancy SQL ok"
  else
    echo "[start-with-db] pre-tenancy SQL skipped or failed (continuing)"
  fi

  # Phase 2 ClinicSettings clinicId @unique + FK can require accept-data-loss on first push
  # from the Phase 1 "default" settings row. Demo Clinic is re-seeded by ensureTenancy().
  # Gate: APP_MODE=demo (hosted demo) or explicit PRISMA_ACCEPT_DATA_LOSS=true.
  ACCEPT="${PRISMA_ACCEPT_DATA_LOSS:-}"
  if [ "${APP_MODE:-}" = "demo" ] || [ "${ACCEPT}" = "true" ] || [ "${ACCEPT}" = "1" ]; then
    echo "[start-with-db] prisma db push --accept-data-loss (demo / explicit one-time Phase 2)"
    run_prisma db push --accept-data-loss
  else
    echo "[start-with-db] prisma db push (no force-reset; set PRISMA_ACCEPT_DATA_LOSS=true if Phase 2 unique blocks)"
    run_prisma db push
  fi
  echo "[start-with-db] schema ready — starting Next.js"
else
  echo "[start-with-db] DATABASE_URL unset — JSON store; starting Next.js"
fi

if command -v bun >/dev/null 2>&1 && [ -f bun.lock ]; then
  exec bun run start
elif command -v npm >/dev/null 2>&1; then
  exec npm run start
else
  exec npx next start
fi
