/*
  Warnings:

  - You are about to drop the column `date_given` on the `Memberships` table. All the data in the column will be lost.
  - Added the required column `dateGiven` to the `Memberships` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Memberships" DROP COLUMN "date_given",
ADD COLUMN     "dateGiven" TIMESTAMP(3) NOT NULL;
