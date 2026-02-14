-- Create enums
CREATE TYPE "AcademicTerm" AS ENUM ('SPRING', 'SUMMER', 'FALL');
CREATE TYPE "AlumniSource" AS ENUM ('manual', 'from_user');
CREATE TYPE "AlumniCandidateStatus" AS ENUM ('pending', 'approved', 'rejected');

-- Alter User table
ALTER TABLE "User"
ADD COLUMN "graduationTerm" "AcademicTerm",
ADD COLUMN "graduationYear" INTEGER,
ADD COLUMN "major" TEXT,
ADD COLUMN "coopSummary" TEXT,
ADD COLUMN "profileCompletionGrantedTerm" "AcademicTerm",
ADD COLUMN "profileCompletionGrantedYear" INTEGER;

-- Alter Alumni table
ALTER TABLE "Alumni"
ADD COLUMN "userId" INTEGER,
ADD COLUMN "source" "AlumniSource" NOT NULL DEFAULT 'manual',
ADD COLUMN "graduationTerm" "AcademicTerm",
ADD COLUMN "graduationYear" INTEGER;

-- Create AlumniCandidate table
CREATE TABLE "AlumniCandidate" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "linkedIn" TEXT,
  "gitHub" TEXT,
  "description" TEXT,
  "imageKey" TEXT,
  "graduationTerm" "AcademicTerm",
  "graduationYear" INTEGER,
  "major" TEXT,
  "coopSummary" TEXT,
  "status" "AlumniCandidateStatus" NOT NULL DEFAULT 'pending',
  "reviewedById" INTEGER,
  "reviewedAt" TIMESTAMP(3),
  "reviewNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AlumniCandidate_pkey" PRIMARY KEY ("id")
);

-- Create indexes / constraints
CREATE UNIQUE INDEX "Alumni_userId_key" ON "Alumni"("userId");
CREATE UNIQUE INDEX "AlumniCandidate_userId_key" ON "AlumniCandidate"("userId");

-- Add foreign keys
ALTER TABLE "Alumni"
ADD CONSTRAINT "Alumni_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AlumniCandidate"
ADD CONSTRAINT "AlumniCandidate_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AlumniCandidate"
ADD CONSTRAINT "AlumniCandidate_reviewedById_fkey"
FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
