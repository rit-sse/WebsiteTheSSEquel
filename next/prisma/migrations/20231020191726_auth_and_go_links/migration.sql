/*
  Warnings:

  - You are about to alter the column `title` on the `Course` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(40)`.
  - You are about to drop the column `userId` on the `Mentor` table. All the data in the column will be lost.
  - You are about to drop the column `mentorId` on the `MentorSkill` table. All the data in the column will be lost.
  - You are about to drop the column `skillId` on the `MentorSkill` table. All the data in the column will be lost.
  - You are about to alter the column `firstName` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(40)`.
  - You are about to alter the column `lastName` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(40)`.
  - A unique constraint covering the columns `[email]` on the table `OfficerPosition` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_Id` to the `Mentor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mentor_Id` to the `MentorSkill` table without a default value. This is not possible if the table is not empty.
  - Added the required column `skill_Id` to the `MentorSkill` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Mentor" DROP CONSTRAINT "Mentor_userId_fkey";

-- DropForeignKey
ALTER TABLE "MentorSkill" DROP CONSTRAINT "MentorSkill_mentorId_fkey";

-- DropForeignKey
ALTER TABLE "MentorSkill" DROP CONSTRAINT "MentorSkill_skillId_fkey";

-- AlterTable
ALTER TABLE "Course" ALTER COLUMN "title" SET DATA TYPE VARCHAR(40);

-- AlterTable
ALTER TABLE "Mentor" DROP COLUMN "userId",
ADD COLUMN     "user_Id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "MentorSkill" DROP COLUMN "mentorId",
DROP COLUMN "skillId",
ADD COLUMN     "mentor_Id" INTEGER NOT NULL,
ADD COLUMN     "skill_Id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "firstName" SET DATA TYPE VARCHAR(40),
ALTER COLUMN "lastName" SET DATA TYPE VARCHAR(40);

-- CreateTable
CREATE TABLE "GoLinks" (
    "id" SERIAL NOT NULL,
    "golink" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "author" TEXT NOT NULL,

    CONSTRAINT "GoLinks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "accessTokenExpires" TIMESTAMP(3) NOT NULL,
    "tokenType" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "idToken" TEXT NOT NULL,
    "sessionState" TEXT NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_key" ON "VerificationToken"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "OfficerPosition_email_key" ON "OfficerPosition"("email");

-- AddForeignKey
ALTER TABLE "Mentor" ADD CONSTRAINT "Mentor_user_Id_fkey" FOREIGN KEY ("user_Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorSkill" ADD CONSTRAINT "MentorSkill_mentor_Id_fkey" FOREIGN KEY ("mentor_Id") REFERENCES "Mentor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorSkill" ADD CONSTRAINT "MentorSkill_skill_Id_fkey" FOREIGN KEY ("skill_Id") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
