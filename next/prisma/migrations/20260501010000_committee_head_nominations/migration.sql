-- Committee Head nominations are a post-primary-election appointment workflow.
-- Primary elections remain in the Election tables; this adds a separate
-- application/nomination pool for committee-head selection by active primaries.

ALTER TYPE "PositionCategory" ADD VALUE IF NOT EXISTS 'COMMITTEE_HEAD';

CREATE TYPE "CommitteeHeadNominationCycleStatus" AS ENUM ('OPEN', 'CLOSED', 'ARCHIVED');
CREATE TYPE "CommitteeHeadApplicationSource" AS ENUM ('SELF', 'NOMINATED');
CREATE TYPE "CommitteeHeadApplicationStatus" AS ENUM ('PENDING_ACCEPTANCE', 'SUBMITTED', 'SELECTED', 'NOT_SELECTED', 'DECLINED', 'WITHDRAWN');
CREATE TYPE "CommitteeHeadThirdPartyNominationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

UPDATE "OfficerPosition"
SET "category" = 'COMMITTEE_HEAD'
WHERE "category" = 'PRIMARY_OFFICER'
  AND "is_primary" = false;

CREATE TABLE "CommitteeHeadNominationCycle" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "term" "AcademicTerm" NOT NULL,
  "year" INTEGER NOT NULL,
  "status" "CommitteeHeadNominationCycleStatus" NOT NULL DEFAULT 'OPEN',
  "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "officerTermStart" TIMESTAMP(3) NOT NULL,
  "officerTermEnd" TIMESTAMP(3) NOT NULL,
  "sourceElectionId" INTEGER,

  CONSTRAINT "CommitteeHeadNominationCycle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommitteeHeadApplication" (
  "id" SERIAL NOT NULL,
  "cycleId" INTEGER NOT NULL,
  "applicantUserId" INTEGER NOT NULL,
  "source" "CommitteeHeadApplicationSource" NOT NULL,
  "status" "CommitteeHeadApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
  "yearLevel" VARCHAR(80) NOT NULL DEFAULT '',
  "major" VARCHAR(120) NOT NULL DEFAULT '',
  "experienceText" TEXT NOT NULL DEFAULT '',
  "whyInterested" TEXT NOT NULL DEFAULT '',
  "weeklyCommitment" TEXT NOT NULL DEFAULT '',
  "comments" TEXT,
  "submittedAt" TIMESTAMP(3),
  "acceptedAt" TIMESTAMP(3),
  "declinedAt" TIMESTAMP(3),
  "withdrawnAt" TIMESTAMP(3),
  "selectedAt" TIMESTAMP(3),
  "selectedById" INTEGER,
  "selectedPositionId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CommitteeHeadApplication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommitteeHeadApplicationPreference" (
  "id" SERIAL NOT NULL,
  "applicationId" INTEGER NOT NULL,
  "officerPositionId" INTEGER NOT NULL,
  "rank" INTEGER NOT NULL,

  CONSTRAINT "CommitteeHeadApplicationPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommitteeHeadThirdPartyNomination" (
  "id" SERIAL NOT NULL,
  "applicationId" INTEGER NOT NULL,
  "cycleId" INTEGER NOT NULL,
  "nomineeUserId" INTEGER NOT NULL,
  "nominatorUserId" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "suggestedPositionIdsJson" TEXT NOT NULL,
  "status" "CommitteeHeadThirdPartyNominationStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CommitteeHeadThirdPartyNomination_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CommitteeHeadNominationCycle_term_year_key" ON "CommitteeHeadNominationCycle"("term", "year");
CREATE UNIQUE INDEX "CommitteeHeadApplication_cycleId_applicantUserId_key" ON "CommitteeHeadApplication"("cycleId", "applicantUserId");
CREATE UNIQUE INDEX "CommitteeHeadApplicationPreference_applicationId_officerPositionId_key" ON "CommitteeHeadApplicationPreference"("applicationId", "officerPositionId");
CREATE UNIQUE INDEX "CommitteeHeadApplicationPreference_applicationId_rank_key" ON "CommitteeHeadApplicationPreference"("applicationId", "rank");
CREATE UNIQUE INDEX "CommitteeHeadThirdPartyNomination_cycleId_nomineeUserId_nominatorUserId_key" ON "CommitteeHeadThirdPartyNomination"("cycleId", "nomineeUserId", "nominatorUserId");

ALTER TABLE "CommitteeHeadNominationCycle"
  ADD CONSTRAINT "CommitteeHeadNominationCycle_sourceElectionId_fkey"
  FOREIGN KEY ("sourceElectionId") REFERENCES "Election"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CommitteeHeadApplication"
  ADD CONSTRAINT "CommitteeHeadApplication_cycleId_fkey"
  FOREIGN KEY ("cycleId") REFERENCES "CommitteeHeadNominationCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommitteeHeadApplication"
  ADD CONSTRAINT "CommitteeHeadApplication_applicantUserId_fkey"
  FOREIGN KEY ("applicantUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommitteeHeadApplication"
  ADD CONSTRAINT "CommitteeHeadApplication_selectedById_fkey"
  FOREIGN KEY ("selectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CommitteeHeadApplication"
  ADD CONSTRAINT "CommitteeHeadApplication_selectedPositionId_fkey"
  FOREIGN KEY ("selectedPositionId") REFERENCES "OfficerPosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CommitteeHeadApplicationPreference"
  ADD CONSTRAINT "CommitteeHeadApplicationPreference_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "CommitteeHeadApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommitteeHeadApplicationPreference"
  ADD CONSTRAINT "CommitteeHeadApplicationPreference_officerPositionId_fkey"
  FOREIGN KEY ("officerPositionId") REFERENCES "OfficerPosition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommitteeHeadThirdPartyNomination"
  ADD CONSTRAINT "CommitteeHeadThirdPartyNomination_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "CommitteeHeadApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommitteeHeadThirdPartyNomination"
  ADD CONSTRAINT "CommitteeHeadThirdPartyNomination_cycleId_fkey"
  FOREIGN KEY ("cycleId") REFERENCES "CommitteeHeadNominationCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommitteeHeadThirdPartyNomination"
  ADD CONSTRAINT "CommitteeHeadThirdPartyNomination_nomineeUserId_fkey"
  FOREIGN KEY ("nomineeUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommitteeHeadThirdPartyNomination"
  ADD CONSTRAINT "CommitteeHeadThirdPartyNomination_nominatorUserId_fkey"
  FOREIGN KEY ("nominatorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
