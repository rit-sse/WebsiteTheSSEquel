-- Add PRIMARY_REVIEW to AmendmentStatus enum
ALTER TYPE "AmendmentStatus" ADD VALUE IF NOT EXISTS 'PRIMARY_REVIEW' AFTER 'OPEN';

-- Add two-phase voting fields to Amendment
ALTER TABLE "Amendment" ADD COLUMN IF NOT EXISTS "primaryReviewOpenedAt" TIMESTAMP(3);
ALTER TABLE "Amendment" ADD COLUMN IF NOT EXISTS "primaryReviewClosedAt" TIMESTAMP(3);
ALTER TABLE "Amendment" ADD COLUMN IF NOT EXISTS "votingDurationHours" INTEGER;
ALTER TABLE "Amendment" ADD COLUMN IF NOT EXISTS "votingEndsAt" TIMESTAMP(3);

-- Add phase and officerPositionId to AmendmentVote
ALTER TABLE "AmendmentVote" ADD COLUMN IF NOT EXISTS "phase" TEXT NOT NULL DEFAULT 'VOTING';
ALTER TABLE "AmendmentVote" ADD COLUMN IF NOT EXISTS "officerPositionId" INTEGER;

-- Add foreign key for officerPositionId
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'AmendmentVote_officerPositionId_fkey'
  ) THEN
    ALTER TABLE "AmendmentVote"
      ADD CONSTRAINT "AmendmentVote_officerPositionId_fkey"
      FOREIGN KEY ("officerPositionId") REFERENCES "OfficerPosition"(id)
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Drop old unique constraint if it exists (per-user without phase)
DROP INDEX IF EXISTS "AmendmentVote_amendmentId_userId_key";

-- Create partial unique index for member votes (one per user in VOTING phase)
CREATE UNIQUE INDEX IF NOT EXISTS "AmendmentVote_amendmentId_userId_voting_key"
  ON "AmendmentVote"("amendmentId", "userId")
  WHERE phase = 'VOTING';

-- Create partial unique index for position votes (one per position per phase)
CREATE UNIQUE INDEX IF NOT EXISTS "AmendmentVote_amendmentId_officerPositionId_phase_key"
  ON "AmendmentVote"("amendmentId", "officerPositionId", phase)
  WHERE "officerPositionId" IS NOT NULL;
