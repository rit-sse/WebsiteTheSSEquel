-- Memberships grow a `term` + `year` column so we can archive by term
-- at new-semester handover instead of wholesale-wiping every row.
-- Backfill strategy: existing rows are tagged with the CURRENT term +
-- year (computed from migration run time). Future memberships default
-- to `getCurrentAcademicTerm()` via the API helpers.

-- Add nullable columns first so the backfill can run before the NOT NULL lock-in.
ALTER TABLE "Memberships" ADD COLUMN "term" "AcademicTerm";
ALTER TABLE "Memberships" ADD COLUMN "year" INTEGER;

-- Backfill: derive current academic term from the calendar month at migration time.
--   Month 1..5   -> SPRING
--   Month 6..7   -> SUMMER
--   Month 8..12  -> FALL
-- This mirrors `lib/academicTerm.ts::getAcademicTermFromDate`.
UPDATE "Memberships"
SET "term" = CASE
    WHEN EXTRACT(MONTH FROM NOW()) BETWEEN 1  AND 5  THEN 'SPRING'::"AcademicTerm"
    WHEN EXTRACT(MONTH FROM NOW()) BETWEEN 6  AND 7  THEN 'SUMMER'::"AcademicTerm"
    ELSE 'FALL'::"AcademicTerm"
  END,
    "year" = EXTRACT(YEAR FROM NOW())::INTEGER
WHERE "term" IS NULL OR "year" IS NULL;

-- Lock in the columns.
ALTER TABLE "Memberships" ALTER COLUMN "term" SET NOT NULL;
ALTER TABLE "Memberships" ALTER COLUMN "year" SET NOT NULL;

-- Composite unique + index to support fast per-term lookups and one
-- membership row per (user, term, year).
CREATE INDEX "Memberships_term_year_idx" ON "Memberships"("term", "year");
CREATE UNIQUE INDEX "Memberships_userId_term_year_key" ON "Memberships"("userId", "term", "year");
