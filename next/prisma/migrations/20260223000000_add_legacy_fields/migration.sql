-- Add isImported flag to User for legacy data import
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isImported" BOOLEAN NOT NULL DEFAULT false;

-- Add endDate to Event for legacy events with start/end times
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMPTZ(3);

-- Make Quote.user_id optional for legacy anonymous quotes
ALTER TABLE "Quote" ALTER COLUMN "user_id" DROP NOT NULL;

-- Drop the existing foreign key constraint on Quote.user_id and recreate without NOT NULL
-- (Prisma requires this for optional relations)
ALTER TABLE "Quote" DROP CONSTRAINT IF EXISTS "Quote_user_id_fkey";
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add is_defunct flag to OfficerPosition for historical-only positions
ALTER TABLE "OfficerPosition" ADD COLUMN IF NOT EXISTS "is_defunct" BOOLEAN NOT NULL DEFAULT false;

-- Create Announcement table
CREATE TABLE IF NOT EXISTS "Announcement" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "category" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);
