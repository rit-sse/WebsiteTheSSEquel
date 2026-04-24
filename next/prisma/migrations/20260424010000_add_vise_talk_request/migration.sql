-- CreateTable
CREATE TABLE "ViseTalkRequest" (
    "id" SERIAL NOT NULL,
    "speakerName" TEXT NOT NULL,
    "speakerEmail" TEXT NOT NULL,
    "speakerPhone" TEXT,
    "affiliation" TEXT,
    "talkTitle" TEXT NOT NULL,
    "talkAbstract" TEXT NOT NULL,
    "speakerBio" TEXT NOT NULL,
    "preferredDates" TEXT NOT NULL,
    "talkFormat" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ViseTalkRequest_pkey" PRIMARY KEY ("id")
);
