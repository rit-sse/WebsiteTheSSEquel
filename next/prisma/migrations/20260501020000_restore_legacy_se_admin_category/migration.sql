-- The committee-head migration intentionally recategorized non-primary
-- positions, but legacy "SE Admin" remains an SE Office access role.
UPDATE "OfficerPosition"
SET "category" = 'SE_OFFICE'
WHERE "title" = 'SE Admin';
