-- AlterTable: Add attendance and membership fields to Event
ALTER TABLE "Event" ADD COLUMN "attendanceEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN "grantsMembership" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Add optional eventId to PurchaseRequest
ALTER TABLE "PurchaseRequest" ADD COLUMN "eventId" TEXT;

-- AlterTable: Remove isMember from User (membership is now determined by Memberships count)
ALTER TABLE "User" DROP COLUMN "isMember";

-- CreateTable: EventAttendance
CREATE TABLE "EventAttendance" (
    "id" SERIAL NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique constraint on eventId + userId
CREATE UNIQUE INDEX "EventAttendance_eventId_userId_key" ON "EventAttendance"("eventId", "userId");

-- AddForeignKey: EventAttendance -> Event
ALTER TABLE "EventAttendance" ADD CONSTRAINT "EventAttendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: EventAttendance -> User
ALTER TABLE "EventAttendance" ADD CONSTRAINT "EventAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: PurchaseRequest -> Event
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
