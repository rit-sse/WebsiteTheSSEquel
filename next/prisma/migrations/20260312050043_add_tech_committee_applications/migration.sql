-- CreateTable
CREATE TABLE "TechCommitteeApplicationConfig" (
    "id" INTEGER NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechCommitteeApplicationConfig_pkey" PRIMARY KEY ("id")
);
