CREATE TYPE "AmendmentStatus" AS ENUM ('DRAFT', 'OPEN', 'VOTING', 'APPROVED', 'REJECTED', 'MERGED', 'WITHDRAWN');

CREATE TABLE "Amendment" (
  "id" SERIAL NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "authorId" INTEGER NOT NULL,
  "status" "AmendmentStatus" NOT NULL DEFAULT 'DRAFT',
  "githubPrNumber" INTEGER,
  "githubBranch" TEXT,
  "originalContent" TEXT NOT NULL,
  "proposedContent" TEXT NOT NULL,
  "publishedAt" TIMESTAMP(3),
  "votingOpenedAt" TIMESTAMP(3),
  "votingClosedAt" TIMESTAMP(3),
  "isSemanticChange" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Amendment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Amendment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "AmendmentVote" (
  "id" SERIAL NOT NULL,
  "amendmentId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "approve" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AmendmentVote_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AmendmentVote_amendmentId_fkey" FOREIGN KEY ("amendmentId") REFERENCES "Amendment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AmendmentVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "AmendmentVote_amendmentId_userId_key" ON "AmendmentVote"("amendmentId", "userId");

CREATE TABLE "AmendmentComment" (
  "id" SERIAL NOT NULL,
  "amendmentId" INTEGER NOT NULL,
  "authorId" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AmendmentComment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AmendmentComment_amendmentId_fkey" FOREIGN KEY ("amendmentId") REFERENCES "Amendment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AmendmentComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
