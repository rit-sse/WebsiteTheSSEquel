/*
  Warnings:

  - The `status` column on the `TechCommitteeApplication` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `TechCommitteeApplicationConfig` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,cycleId]` on the table `TechCommitteeApplication` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cycleId` to the `TechCommitteeApplication` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ASSIGNED');

-- AlterTable
ALTER TABLE "TechCommitteeApplication" ADD COLUMN     "cycleId" INTEGER NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'PENDING';

-- DropTable
DROP TABLE "TechCommitteeApplicationConfig";

-- CreateTable
CREATE TABLE "TechCommitteeApplicationCycle" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechCommitteeApplicationCycle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TechCommitteeApplicationCycle_name_key" ON "TechCommitteeApplicationCycle"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TechCommitteeApplication_userId_cycleId_key" ON "TechCommitteeApplication"("userId", "cycleId");

-- AddForeignKey
ALTER TABLE "TechCommitteeApplication" ADD CONSTRAINT "TechCommitteeApplication_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "TechCommitteeApplicationCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
