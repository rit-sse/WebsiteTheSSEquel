CREATE TYPE "MembershipAwardEmailStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED');

CREATE TABLE "PendingMembershipAward" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "reason" TEXT NOT NULL,
    "dateGiven" TIMESTAMP(3) NOT NULL,
    "term" "AcademicTerm" NOT NULL,
    "year" INTEGER NOT NULL,
    "awardedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "emailStatus" "MembershipAwardEmailStatus" NOT NULL DEFAULT 'PENDING',
    "emailLastAttemptAt" TIMESTAMP(3),
    CONSTRAINT "PendingMembershipAward_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Memberships" ADD COLUMN "pendingAwardId" TEXT;
CREATE UNIQUE INDEX "Memberships_pendingAwardId_key" ON "Memberships"("pendingAwardId");
CREATE INDEX "PendingMembershipAward_email_claimedAt_cancelledAt_idx" ON "PendingMembershipAward"("email", "claimedAt", "cancelledAt");
ALTER TABLE "PendingMembershipAward" ADD CONSTRAINT "PendingMembershipAward_awardedById_fkey" FOREIGN KEY ("awardedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Memberships" ADD CONSTRAINT "Memberships_pendingAwardId_fkey" FOREIGN KEY ("pendingAwardId") REFERENCES "PendingMembershipAward"("id") ON DELETE SET NULL ON UPDATE CASCADE;
