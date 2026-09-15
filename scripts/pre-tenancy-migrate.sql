-- Phase 2 pre-step: create Demo Clinic before Prisma adds FKs / unique clinicId.
-- Safe to re-run. Letterhead may still need ensureTenancy() if db push recreates rows.

CREATE TABLE IF NOT EXISTS "Clinic" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Clinic" ("id", "name", "createdAt", "updatedAt")
VALUES ('clinic-demo', 'Demo Clinic', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "updatedAt" = CURRENT_TIMESTAMP;

-- AppealCase: add clinicId early so backfill is non-null before unique/FK tighten
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'AppealCase'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'AppealCase' AND column_name = 'clinicId'
  ) THEN
    ALTER TABLE "AppealCase" ADD COLUMN "clinicId" TEXT;
  END IF;
END $$;

UPDATE "AppealCase" SET "clinicId" = 'clinic-demo' WHERE "clinicId" IS NULL OR "clinicId" = '';

-- ClinicSettings: add clinicId + migrate legacy id "default" → clinic-demo when possible
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ClinicSettings'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ClinicSettings' AND column_name = 'clinicId'
  ) THEN
    ALTER TABLE "ClinicSettings" ADD COLUMN "clinicId" TEXT;
  END IF;
END $$;

UPDATE "ClinicSettings" SET "clinicId" = 'clinic-demo' WHERE "clinicId" IS NULL OR "clinicId" = '';

-- Prefer a single row keyed as clinic-demo (id == clinicId)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "ClinicSettings" WHERE "id" = 'default')
     AND NOT EXISTS (SELECT 1 FROM "ClinicSettings" WHERE "id" = 'clinic-demo') THEN
    UPDATE "ClinicSettings"
    SET "id" = 'clinic-demo', "clinicId" = 'clinic-demo'
    WHERE "id" = 'default';
  ELSIF EXISTS (SELECT 1 FROM "ClinicSettings" WHERE "id" = 'default')
     AND EXISTS (SELECT 1 FROM "ClinicSettings" WHERE "id" = 'clinic-demo') THEN
    DELETE FROM "ClinicSettings" WHERE "id" = 'default';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ClinicSettings id migrate skipped: %', SQLERRM;
END $$;
