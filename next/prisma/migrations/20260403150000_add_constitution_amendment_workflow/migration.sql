-- CreateEnum
CREATE TYPE "ConstitutionProposalStatus" AS ENUM (
  'DRAFT',
  'PRIMARY_REVIEW',
  'SCHEDULED',
  'APPLIED',
  'WITHDRAWN',
  'STALE'
);

-- CreateTable
CREATE TABLE "ConstitutionProposal" (
  "id" SERIAL NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "summary" VARCHAR(1000) NOT NULL,
  "rationale" TEXT NOT NULL,
  "status" "ConstitutionProposalStatus" NOT NULL DEFAULT 'DRAFT',
  "authorId" INTEGER NOT NULL,
  "baseRepoOwner" VARCHAR(100) NOT NULL,
  "baseRepoName" VARCHAR(100) NOT NULL,
  "baseBranch" VARCHAR(100) NOT NULL,
  "basePath" VARCHAR(255) NOT NULL,
  "baseDocumentSha" VARCHAR(100) NOT NULL,
  "baseMarkdown" TEXT NOT NULL,
  "sectionHeadingPath" VARCHAR(500) NOT NULL,
  "proposedSectionMarkdown" TEXT NOT NULL,
  "fullProposedMarkdown" TEXT NOT NULL,
  "unifiedDiff" TEXT NOT NULL,
  "electionStartsAt" TIMESTAMP(3),
  "electionEndsAt" TIMESTAMP(3),
  "submittedAt" TIMESTAMP(3),
  "appliedAt" TIMESTAMP(3),
  "appliedCommitSha" VARCHAR(100),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ConstitutionProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstitutionProposalPrimaryApproval" (
  "id" SERIAL NOT NULL,
  "proposalId" INTEGER NOT NULL,
  "approverId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ConstitutionProposalPrimaryApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstitutionProposalVote" (
  "id" SERIAL NOT NULL,
  "proposalId" INTEGER NOT NULL,
  "voterId" INTEGER NOT NULL,
  "choice" VARCHAR(10) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ConstitutionProposalVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConstitutionProposalPrimaryApproval_proposalId_approverId_key"
ON "ConstitutionProposalPrimaryApproval"("proposalId", "approverId");

-- CreateIndex
CREATE UNIQUE INDEX "ConstitutionProposalVote_proposalId_voterId_key"
ON "ConstitutionProposalVote"("proposalId", "voterId");

-- AddForeignKey
ALTER TABLE "ConstitutionProposal"
ADD CONSTRAINT "ConstitutionProposal_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstitutionProposalPrimaryApproval"
ADD CONSTRAINT "ConstitutionProposalPrimaryApproval_proposalId_fkey"
FOREIGN KEY ("proposalId") REFERENCES "ConstitutionProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstitutionProposalPrimaryApproval"
ADD CONSTRAINT "ConstitutionProposalPrimaryApproval_approverId_fkey"
FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstitutionProposalVote"
ADD CONSTRAINT "ConstitutionProposalVote_proposalId_fkey"
FOREIGN KEY ("proposalId") REFERENCES "ConstitutionProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstitutionProposalVote"
ADD CONSTRAINT "ConstitutionProposalVote_voterId_fkey"
FOREIGN KEY ("voterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
