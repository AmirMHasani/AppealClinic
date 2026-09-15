#!/usr/bin/env bash
# Render / CI release helper: apply Prisma migrations only when DATABASE_URL is set.
# Safe to include in the build command — skips cleanly for local/JSON demos.
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[db-release] DATABASE_URL unset — skipping prisma migrate deploy (JSON store)."
  exit 0
fi

echo "[db-release] DATABASE_URL set — running prisma migrate deploy"
npx prisma migrate deploy
