-- Primary review votes are per officer position, not per user.
-- A single user may hold multiple primary positions and must be able to vote once per position.
DROP INDEX IF EXISTS "AmendmentVote_amendmentId_userId_phase_key";
DROP INDEX IF EXISTS "AmendmentVote_amendmentId_userId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "AmendmentVote_amendmentId_userId_voting_key"
  ON "AmendmentVote"("amendmentId", "userId")
  WHERE phase = 'VOTING';

CREATE UNIQUE INDEX IF NOT EXISTS "AmendmentVote_amendmentId_officerPositionId_phase_key"
  ON "AmendmentVote"("amendmentId", "officerPositionId", phase)
  WHERE "officerPositionId" IS NOT NULL;
