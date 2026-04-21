-- Memberships grow a `term` + `year` column so we can archive by term
-- at new-semester handover instead of wholesale-wiping every row.
-- Backfill strategy: each existing row is tagged with the term + year
-- derived from its own `dateGiven`, mirroring `lib/academicTerm.ts`.
-- Historical rows that collide on (userId, term, year) — e.g. multiple
-- grants recorded in the same semester — are collapsed to the most
-- recent grant (max id) before the unique constraint is applied.
-- Future memberships default to `getCurrentAcademicTerm()` via the API
-- helpers.

-- Add nullable columns first so the backfill can run before the NOT NULL lock-in.
ALTER TABLE "Memberships" ADD COLUMN "term" "AcademicTerm";
ALTER TABLE "Memberships" ADD COLUMN "year" INTEGER;

-- Backfill: derive each row's term + year from its own dateGiven.
--   Month 1..5   -> SPRING
--   Month 6..7   -> SUMMER
--   Month 8..12  -> FALL
-- This mirrors `lib/academicTerm.ts::getAcademicTermFromDate`.
UPDATE "Memberships"
SET "term" = CASE
    WHEN EXTRACT(MONTH FROM "dateGiven") BETWEEN 1 AND 5 THEN 'SPRING'::"AcademicTerm"
    WHEN EXTRACT(MONTH FROM "dateGiven") BETWEEN 6 AND 7 THEN 'SUMMER'::"AcademicTerm"
    ELSE 'FALL'::"AcademicTerm"
  END,
    "year" = EXTRACT(YEAR FROM "dateGiven")::INTEGER
WHERE "term" IS NULL OR "year" IS NULL;

-- Collapse duplicate grants within the same (userId, term, year): keep
-- only the most recent row (max id). Earlier rows represent superseded
-- grants for the same semester and would violate the unique constraint
-- introduced below.
DELETE FROM "Memberships" a
USING "Memberships" b
WHERE a."userId" = b."userId"
  AND a."term"   = b."term"
  AND a."year"   = b."year"
  AND a."id"    < b."id";

-- Lock in the columns.
ALTER TABLE "Memberships" ALTER COLUMN "term" SET NOT NULL;
ALTER TABLE "Memberships" ALTER COLUMN "year" SET NOT NULL;

-- Composite unique + index to support fast per-term lookups and one
-- membership row per (user, term, year).
CREATE INDEX "Memberships_term_year_idx" ON "Memberships"("term", "year");
CREATE UNIQUE INDEX "Memberships_userId_term_year_key" ON "Memberships"("userId", "term", "year");
