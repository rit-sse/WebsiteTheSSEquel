-- Create TechCommitteeApplication table
CREATE TABLE "TechCommitteeApplication" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "yearLevel" TEXT NOT NULL,
    "experienceText" TEXT NOT NULL,
    "whyJoin" TEXT NOT NULL,
    "weeklyCommitment" TEXT NOT NULL,
    "preferredDivision" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "finalDivision" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechCommitteeApplication_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "TechCommitteeApplication"
ADD CONSTRAINT "TechCommitteeApplication_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
