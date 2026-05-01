-- Add and commit this enum value before the committee-head nomination
-- migration uses it in UPDATE statements. PostgreSQL rejects use of a
-- newly-added enum value in the same transaction that added it.
ALTER TYPE "PositionCategory" ADD VALUE IF NOT EXISTS 'COMMITTEE_HEAD';
