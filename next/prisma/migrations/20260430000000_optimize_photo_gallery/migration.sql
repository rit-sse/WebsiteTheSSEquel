CREATE INDEX "Photo_status_sortDate_id_idx" ON "Photo"("status", "sortDate", "id");
CREATE INDEX "Photo_status_category_sortDate_id_idx" ON "Photo"("status", "category", "sortDate", "id");
CREATE INDEX "Photo_status_eventId_sortDate_id_idx" ON "Photo"("status", "eventId", "sortDate", "id");
