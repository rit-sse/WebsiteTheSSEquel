CREATE TYPE "SiteRole" AS ENUM ('SE_ADMIN');
CREATE TYPE "ElectionKind" AS ENUM ('PRIMARY_OFFICER');
CREATE TYPE "ElectionStatus" AS ENUM (
  'DRAFT',
  'NOMINATIONS_OPEN',
  'NOMINATIONS_CLOSED',
  'VOTING_OPEN',
  'VOTING_CLOSED',
  'CERTIFIED',
  'CANCELLED',
  'TIE_RUNOFF_REQUIRED'
);
CREATE TYPE "ElectionApprovalStage" AS ENUM ('CONFIG', 'BALLOT', 'CERTIFICATION');
CREATE TYPE "ElectionNominationStatus" AS ENUM (
  'PENDING_RESPONSE',
  'ACCEPTED',
  'DECLINED',
  'EXPIRED'
);
CREATE TYPE "ElectionEligibilityStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "ElectionEmailKind" AS ENUM (
  'NOMINATION_NOTICE',
  'BALLOT_ANNOUNCEMENT',
  'BALLOT_REMINDER'
);

CREATE TABLE "UserSiteRole" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "role" "SiteRole" NOT NULL,
  "grantedById" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserSiteRole_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Election" (
  "id" SERIAL NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "slug" VARCHAR(200) NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "kind" "ElectionKind" NOT NULL DEFAULT 'PRIMARY_OFFICER',
  "status" "ElectionStatus" NOT NULL DEFAULT 'DRAFT',
  "nominationsOpenAt" TIMESTAMP(3) NOT NULL,
  "nominationsCloseAt" TIMESTAMP(3) NOT NULL,
  "votingOpenAt" TIMESTAMP(3) NOT NULL,
  "votingCloseAt" TIMESTAMP(3) NOT NULL,
  "termStartDate" TIMESTAMP(3) NOT NULL,
  "termEndDate" TIMESTAMP(3) NOT NULL,
  "createdById" INTEGER NOT NULL,
  "certifiedById" INTEGER,
  "certifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Election_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ElectionOffice" (
  "id" SERIAL NOT NULL,
  "electionId" INTEGER NOT NULL,
  "officerPositionId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ElectionOffice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ElectionApproval" (
  "id" SERIAL NOT NULL,
  "electionId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "stage" "ElectionApprovalStage" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ElectionApproval_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ElectionNomination" (
  "id" SERIAL NOT NULL,
  "electionOfficeId" INTEGER NOT NULL,
  "nomineeUserId" INTEGER NOT NULL,
  "nominatorUserId" INTEGER NOT NULL,
  "statement" TEXT NOT NULL DEFAULT '',
  "yearLevel" INTEGER,
  "program" VARCHAR(100),
  "canRemainEnrolledFullYear" BOOLEAN,
  "canRemainEnrolledNextTerm" BOOLEAN,
  "isOnCampus" BOOLEAN,
  "isOnCoop" BOOLEAN,
  "status" "ElectionNominationStatus" NOT NULL DEFAULT 'PENDING_RESPONSE',
  "eligibilityStatus" "ElectionEligibilityStatus" NOT NULL DEFAULT 'PENDING',
  "reviewNotes" TEXT,
  "reviewedById" INTEGER,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ElectionNomination_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ElectionBallot" (
  "id" SERIAL NOT NULL,
  "electionId" INTEGER NOT NULL,
  "voterId" INTEGER NOT NULL,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ElectionBallot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ElectionBallotRanking" (
  "id" SERIAL NOT NULL,
  "ballotId" INTEGER NOT NULL,
  "electionOfficeId" INTEGER NOT NULL,
  "nominationId" INTEGER NOT NULL,
  "rank" INTEGER NOT NULL,
  CONSTRAINT "ElectionBallotRanking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ElectionEmailLog" (
  "id" SERIAL NOT NULL,
  "electionId" INTEGER NOT NULL,
  "sentById" INTEGER NOT NULL,
  "kind" "ElectionEmailKind" NOT NULL,
  "subject" VARCHAR(255) NOT NULL,
  "message" TEXT NOT NULL,
  "recipientCount" INTEGER NOT NULL,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ElectionEmailLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserSiteRole_userId_role_key" ON "UserSiteRole"("userId", "role");
CREATE UNIQUE INDEX "Election_slug_key" ON "Election"("slug");
CREATE UNIQUE INDEX "ElectionOffice_electionId_officerPositionId_key" ON "ElectionOffice"("electionId", "officerPositionId");
CREATE UNIQUE INDEX "ElectionApproval_electionId_userId_stage_key" ON "ElectionApproval"("electionId", "userId", "stage");
CREATE UNIQUE INDEX "ElectionNomination_electionOfficeId_nomineeUserId_key" ON "ElectionNomination"("electionOfficeId", "nomineeUserId");
CREATE UNIQUE INDEX "ElectionBallot_electionId_voterId_key" ON "ElectionBallot"("electionId", "voterId");
CREATE UNIQUE INDEX "ElectionBallotRanking_ballotId_electionOfficeId_nominationId_key" ON "ElectionBallotRanking"("ballotId", "electionOfficeId", "nominationId");
CREATE UNIQUE INDEX "ElectionBallotRanking_ballotId_electionOfficeId_rank_key" ON "ElectionBallotRanking"("ballotId", "electionOfficeId", "rank");

ALTER TABLE "UserSiteRole"
  ADD CONSTRAINT "UserSiteRole_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserSiteRole"
  ADD CONSTRAINT "UserSiteRole_grantedById_fkey"
  FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Election"
  ADD CONSTRAINT "Election_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Election"
  ADD CONSTRAINT "Election_certifiedById_fkey"
  FOREIGN KEY ("certifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ElectionOffice"
  ADD CONSTRAINT "ElectionOffice_electionId_fkey"
  FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElectionOffice"
  ADD CONSTRAINT "ElectionOffice_officerPositionId_fkey"
  FOREIGN KEY ("officerPositionId") REFERENCES "OfficerPosition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ElectionApproval"
  ADD CONSTRAINT "ElectionApproval_electionId_fkey"
  FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElectionApproval"
  ADD CONSTRAINT "ElectionApproval_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ElectionNomination"
  ADD CONSTRAINT "ElectionNomination_electionOfficeId_fkey"
  FOREIGN KEY ("electionOfficeId") REFERENCES "ElectionOffice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElectionNomination"
  ADD CONSTRAINT "ElectionNomination_nomineeUserId_fkey"
  FOREIGN KEY ("nomineeUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElectionNomination"
  ADD CONSTRAINT "ElectionNomination_nominatorUserId_fkey"
  FOREIGN KEY ("nominatorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElectionNomination"
  ADD CONSTRAINT "ElectionNomination_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ElectionBallot"
  ADD CONSTRAINT "ElectionBallot_electionId_fkey"
  FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElectionBallot"
  ADD CONSTRAINT "ElectionBallot_voterId_fkey"
  FOREIGN KEY ("voterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ElectionBallotRanking"
  ADD CONSTRAINT "ElectionBallotRanking_ballotId_fkey"
  FOREIGN KEY ("ballotId") REFERENCES "ElectionBallot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElectionBallotRanking"
  ADD CONSTRAINT "ElectionBallotRanking_electionOfficeId_fkey"
  FOREIGN KEY ("electionOfficeId") REFERENCES "ElectionOffice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElectionBallotRanking"
  ADD CONSTRAINT "ElectionBallotRanking_nominationId_fkey"
  FOREIGN KEY ("nominationId") REFERENCES "ElectionNomination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ElectionEmailLog"
  ADD CONSTRAINT "ElectionEmailLog_electionId_fkey"
  FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElectionEmailLog"
  ADD CONSTRAINT "ElectionEmailLog_sentById_fkey"
  FOREIGN KEY ("sentById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
