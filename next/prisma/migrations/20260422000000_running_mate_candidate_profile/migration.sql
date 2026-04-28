-- Amendment 12 follow-up: VP running mates fill out their own candidate
-- profile when they accept their invitation. Mirror the candidate-profile
-- columns on `ElectionNomination` so the same UI primitives can render
-- both presidential and VP candidates.
ALTER TABLE "ElectionRunningMateInvitation"
  ADD COLUMN "statement"                 TEXT             NOT NULL DEFAULT '',
  ADD COLUMN "yearLevel"                 INTEGER,
  ADD COLUMN "program"                   VARCHAR(100),
  ADD COLUMN "canRemainEnrolledFullYear" BOOLEAN,
  ADD COLUMN "canRemainEnrolledNextTerm" BOOLEAN,
  ADD COLUMN "isOnCampus"                BOOLEAN,
  ADD COLUMN "isOnCoop"                  BOOLEAN;
