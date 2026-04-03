-- Create new officer-slot based approval column
ALTER TABLE "ConstitutionProposalPrimaryApproval"
ADD COLUMN "approverOfficerId" INTEGER;

-- Backfill from the current approver user when possible, preferring the lowest-id
-- active primary officer slot for that user.
UPDATE "ConstitutionProposalPrimaryApproval" AS approval
SET "approverOfficerId" = officer_slot."id"
FROM (
  SELECT DISTINCT ON (approval_inner."id")
    approval_inner."id" AS approval_id,
    officer."id"
  FROM "ConstitutionProposalPrimaryApproval" AS approval_inner
  JOIN "Officer" AS officer
    ON officer."user_id" = approval_inner."approverId"
   AND officer."is_active" = true
  JOIN "OfficerPosition" AS position
    ON position."id" = officer."position_id"
   AND position."is_primary" = true
  ORDER BY approval_inner."id", officer."id"
) AS officer_slot
WHERE approval."id" = officer_slot.approval_id;

-- Existing approvals without a matching primary officer slot are not valid under
-- the new slot-based quorum model, so remove them before enforcing constraints.
DELETE FROM "ConstitutionProposalPrimaryApproval"
WHERE "approverOfficerId" IS NULL;

ALTER TABLE "ConstitutionProposalPrimaryApproval"
ALTER COLUMN "approverOfficerId" SET NOT NULL;

DROP INDEX "ConstitutionProposalPrimaryApproval_proposalId_approverId_key";

CREATE UNIQUE INDEX "ConstitutionProposalPrimaryApproval_proposalId_approverOfficerId_key"
ON "ConstitutionProposalPrimaryApproval"("proposalId", "approverOfficerId");

ALTER TABLE "ConstitutionProposalPrimaryApproval"
ADD CONSTRAINT "ConstitutionProposalPrimaryApproval_approverOfficerId_fkey"
FOREIGN KEY ("approverOfficerId") REFERENCES "Officer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConstitutionProposalPrimaryApproval"
DROP CONSTRAINT "ConstitutionProposalPrimaryApproval_approverId_fkey";

ALTER TABLE "ConstitutionProposalPrimaryApproval"
DROP COLUMN "approverId";
