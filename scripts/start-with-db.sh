#!/usr/bin/env bash
# Production start for Render (and similar hosts).
# When DATABASE_URL is set: apply Prisma schema safely, then next start.
# When unset: JSON local/demo store — just next start.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -n "${DATABASE_URL:-}" ]; then
  echo "[start-with-db] DATABASE_URL set — running prisma db push (no force-reset)"
  if command -v bunx >/dev/null 2>&1; then
    bunx prisma db push
  else
    npx prisma db push
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
