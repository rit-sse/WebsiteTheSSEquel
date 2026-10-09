-- Preserve unknown creation dates for existing users. Adding the default in
-- a separate statement makes it apply only to future inserts.
ALTER TABLE "User" ADD COLUMN "createdAt" TIMESTAMPTZ(3);
ALTER TABLE "User" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
