-- Amendments 12 & 13 — running-mate VP and Mentoring Head as Primary Officer.
-- Amendment 12: VP is no longer separately elected; the President nominee
--               invites an active member to run as VP.
-- Amendment 13: Mentoring Head becomes a Primary Officer.

-- CreateEnum: running mate invitation status
CREATE TYPE "ElectionRunningMateStatus" AS ENUM ('INVITED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'WITHDRAWN');

-- AlterEnum: new email kind for running mate invitations
ALTER TYPE "ElectionEmailKind" ADD VALUE 'RUNNING_MATE_INVITE';

-- CreateTable: running mate invitations
CREATE TABLE "ElectionRunningMateInvitation" (
    "id" SERIAL NOT NULL,
    "presidentNominationId" INTEGER NOT NULL,
    "inviteeUserId" INTEGER NOT NULL,
    "status" "ElectionRunningMateStatus" NOT NULL DEFAULT 'INVITED',
    "respondedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "declineReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectionRunningMateInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ElectionRunningMateInvitation_presidentNominationId_key" ON "ElectionRunningMateInvitation"("presidentNominationId");

-- CreateIndex
CREATE INDEX "ElectionRunningMateInvitation_inviteeUserId_status_idx" ON "ElectionRunningMateInvitation"("inviteeUserId", "status");

-- AddForeignKey
ALTER TABLE "ElectionRunningMateInvitation" ADD CONSTRAINT "ElectionRunningMateInvitation_presidentNominationId_fkey" FOREIGN KEY ("presidentNominationId") REFERENCES "ElectionNomination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionRunningMateInvitation" ADD CONSTRAINT "ElectionRunningMateInvitation_inviteeUserId_fkey" FOREIGN KEY ("inviteeUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data migration: flip primary-officer flags on Vice President (→ false)
-- and Mentoring Head (→ true). These positions are canonical seed rows,
-- matched by title.
UPDATE "OfficerPosition" SET "is_primary" = false WHERE "title" = 'Vice President';
UPDATE "OfficerPosition" SET "is_primary" = true  WHERE "title" = 'Mentoring Head';
