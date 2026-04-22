-- CreateEnum
CREATE TYPE "PositionCategory" AS ENUM ('PRIMARY_OFFICER', 'SE_OFFICE');

-- AlterTable: add category column to OfficerPosition
ALTER TABLE "OfficerPosition" ADD COLUMN "category" "PositionCategory" NOT NULL DEFAULT 'PRIMARY_OFFICER';

-- Seed SE Office positions
INSERT INTO "OfficerPosition" ("title", "is_primary", "email", "category")
VALUES
  ('Administrative Assistant', false, 'se-admin-assistant@rit.edu', 'SE_OFFICE'),
  ('SE Office Head', false, 'se-office-head@rit.edu', 'SE_OFFICE'),
  ('Undergraduate Dean', false, 'se-undergrad-dean@rit.edu', 'SE_OFFICE'),
  ('Dean', false, 'se-dean@rit.edu', 'SE_OFFICE')
ON CONFLICT ("title") DO NOTHING;
