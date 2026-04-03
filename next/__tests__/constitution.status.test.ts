import { describe, expect, it } from "vitest";
import { ConstitutionProposalStatus } from "@prisma/client";
import {
  areConstitutionVoteResultsPublic,
  getConstitutionProposalComputedStatus,
} from "@/lib/constitution/status";

describe("constitution status helpers", () => {
  it("marks tied closed elections as failed", () => {
    const status = getConstitutionProposalComputedStatus(
      {
        status: ConstitutionProposalStatus.SCHEDULED,
        baseDocumentSha: "sha-1",
        electionStartsAt: new Date("2026-01-01T00:00:00.000Z"),
        electionEndsAt: new Date("2026-01-02T00:00:00.000Z"),
        appliedAt: null,
        votes: [{ choice: "YES" }, { choice: "NO" }],
      },
      {
        currentDocumentSha: "sha-1",
        now: new Date("2026-01-03T00:00:00.000Z"),
      }
    );

    expect(status).toBe("FAILED");
    expect(areConstitutionVoteResultsPublic(status)).toBe(true);
  });

  it("marks changed upstream documents as stale", () => {
    const status = getConstitutionProposalComputedStatus(
      {
        status: ConstitutionProposalStatus.PRIMARY_REVIEW,
        baseDocumentSha: "sha-old",
        electionStartsAt: null,
        electionEndsAt: null,
        appliedAt: null,
        votes: [],
      },
      {
        currentDocumentSha: "sha-new",
      }
    );

    expect(status).toBe("STALE");
  });
});
