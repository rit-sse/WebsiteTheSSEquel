/*
  Warnings:

  - You are about to drop the column `image` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Alumni" ADD COLUMN     "receiveEmails" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showEmail" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "AlumniRequest" ADD COLUMN     "alumniId" INTEGER,
ADD COLUMN     "receiveEmails" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showEmail" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "image",
ADD COLUMN     "googleImageURL" TEXT,
ADD COLUMN     "profileImageKey" TEXT;

-- AddForeignKey
ALTER TABLE "AlumniRequest" ADD CONSTRAINT "AlumniRequest_alumniId_fkey" FOREIGN KEY ("alumniId") REFERENCES "Alumni"("id") ON DELETE CASCADE ON UPDATE CASCADE;
