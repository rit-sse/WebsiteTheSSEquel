-- Reverts the `(userId, term, year)` unique constraint added in
-- 20260420170000_memberships_term. The constraint silently collapsed
-- every legitimate duplicate grant — members who earned multiple
-- memberships in the same term (multi-event swipes, officer-grant on
-- top of an earned membership, etc.) — into a single row.
--
-- Replaced with a non-unique index so the per-user / per-term lookups
-- the API uses stay fast.
--
-- NOTE: this does NOT recover the rows the previous migration's
-- `DELETE … WHERE a.id < b.id` collapsed away — that data is gone
-- unless restored from a backup. Going forward, multiple membership
-- rows per (userId, term, year) are allowed again.
DROP INDEX IF EXISTS "Memberships_userId_term_year_key";
CREATE INDEX IF NOT EXISTS "Memberships_userId_term_year_idx"
  ON "Memberships"("userId", "term", "year");
