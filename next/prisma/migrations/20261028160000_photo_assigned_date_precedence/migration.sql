-- Assigned dates take precedence over camera metadata for existing photos too.
-- Keep both source dates intact; only repair the derived gallery sort date.
UPDATE "Photo"
SET "sortDate" = "manualTakenAt"
WHERE "manualTakenAt" IS NOT NULL
  AND "sortDate" IS DISTINCT FROM "manualTakenAt";
