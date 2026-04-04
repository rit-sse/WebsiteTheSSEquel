INSERT INTO "OfficerPosition" ("title", "is_primary", "email")
VALUES ('SE Admin', FALSE, 'sse-se-admin@rit.edu')
ON CONFLICT ("title") DO NOTHING;

INSERT INTO "Officer" ("position_id", "user_id", "is_active", "start_date", "end_date")
SELECT
  pos."id",
  usr."userId",
  TRUE,
  COALESCE(MIN(usr."createdAt"), NOW()),
  NOW() + INTERVAL '365 days'
FROM "UserSiteRole" usr
JOIN "OfficerPosition" pos
  ON pos."title" = 'SE Admin'
LEFT JOIN "Officer" off
  ON off."position_id" = pos."id"
 AND off."user_id" = usr."userId"
 AND off."is_active" = TRUE
GROUP BY pos."id", usr."userId"
HAVING COUNT(off."id") = 0;

ALTER TABLE "UserSiteRole" DROP CONSTRAINT "UserSiteRole_grantedById_fkey";
ALTER TABLE "UserSiteRole" DROP CONSTRAINT "UserSiteRole_userId_fkey";

DROP TABLE "UserSiteRole";
DROP TYPE "SiteRole";

ALTER TABLE "Election" DROP COLUMN "termStartDate";
ALTER TABLE "Election" DROP COLUMN "termEndDate";
