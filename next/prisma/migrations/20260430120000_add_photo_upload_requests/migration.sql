-- CreateEnum
CREATE TYPE "PhotoUploadRequestStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "PhotoUploadRequest" (
    "id" SERIAL NOT NULL,
    "requestToken" VARCHAR(160) NOT NULL,
    "batchId" VARCHAR(80) NOT NULL,
    "originalKey" VARCHAR(500) NOT NULL,
    "galleryKey" VARCHAR(500) NOT NULL,
    "originalFilename" VARCHAR(255) NOT NULL,
    "originalMimeType" VARCHAR(100) NOT NULL,
    "originalSizeBytes" INTEGER NOT NULL,
    "galleryMimeType" VARCHAR(100) NOT NULL DEFAULT 'image/webp',
    "gallerySizeBytes" INTEGER NOT NULL,
    "caption" VARCHAR(500),
    "altText" VARCHAR(500),
    "category" VARCHAR(80) NOT NULL DEFAULT 'general',
    "eventId" TEXT,
    "submitterName" VARCHAR(100),
    "submitterEmail" VARCHAR(255),
    "submitterNote" VARCHAR(1000),
    "submitterIpHash" VARCHAR(128),
    "exifTakenAt" TIMESTAMP(3),
    "manualTakenAt" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "PhotoUploadRequestStatus" NOT NULL DEFAULT 'pending',
    "reviewedById" INTEGER,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" VARCHAR(1000),
    "publishedPhotoId" INTEGER,

    CONSTRAINT "PhotoUploadRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhotoUploadRequest_originalKey_key" ON "PhotoUploadRequest"("originalKey");

-- CreateIndex
CREATE UNIQUE INDEX "PhotoUploadRequest_galleryKey_key" ON "PhotoUploadRequest"("galleryKey");

-- CreateIndex
CREATE UNIQUE INDEX "PhotoUploadRequest_publishedPhotoId_key" ON "PhotoUploadRequest"("publishedPhotoId");

-- CreateIndex
CREATE INDEX "PhotoUploadRequest_status_uploadedAt_idx" ON "PhotoUploadRequest"("status", "uploadedAt");

-- CreateIndex
CREATE INDEX "PhotoUploadRequest_batchId_idx" ON "PhotoUploadRequest"("batchId");

-- CreateIndex
CREATE INDEX "PhotoUploadRequest_eventId_idx" ON "PhotoUploadRequest"("eventId");

-- AddForeignKey
ALTER TABLE "PhotoUploadRequest" ADD CONSTRAINT "PhotoUploadRequest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoUploadRequest" ADD CONSTRAINT "PhotoUploadRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoUploadRequest" ADD CONSTRAINT "PhotoUploadRequest_publishedPhotoId_fkey" FOREIGN KEY ("publishedPhotoId") REFERENCES "Photo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
