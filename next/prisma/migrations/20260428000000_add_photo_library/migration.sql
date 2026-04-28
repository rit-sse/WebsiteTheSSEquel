-- CreateTable
CREATE TABLE "Photo" (
    "id" SERIAL NOT NULL,
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
    "uploadedById" INTEGER,
    "exifTakenAt" TIMESTAMP(3),
    "manualTakenAt" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sortDate" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(40) NOT NULL DEFAULT 'published',
    "batchId" VARCHAR(80) NOT NULL,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Photo_originalKey_key" ON "Photo"("originalKey");

-- CreateIndex
CREATE UNIQUE INDEX "Photo_galleryKey_key" ON "Photo"("galleryKey");

-- CreateIndex
CREATE INDEX "Photo_status_sortDate_idx" ON "Photo"("status", "sortDate");

-- CreateIndex
CREATE INDEX "Photo_eventId_idx" ON "Photo"("eventId");

-- CreateIndex
CREATE INDEX "Photo_category_idx" ON "Photo"("category");

-- CreateIndex
CREATE INDEX "Photo_batchId_idx" ON "Photo"("batchId");

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
