import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockNominationUpdateMany, mockInvitationUpdateMany } = vi.hoisted(
  () => ({
    mockNominationUpdateMany: vi.fn(),
    mockInvitationUpdateMany: vi.fn(),
  })
);

vi.mock("@/lib/prisma", () => ({
  default: {
    electionNomination: {
      updateMany: mockNominationUpdateMany,
    },
    electionRunningMateInvitation: {
      updateMany: mockInvitationUpdateMany,
    },
  },
}));

import { propagateCandidateProfile } from "@/lib/electionCandidateProfile";

const profile = {
  statement: "I'm Sam, I love spreadsheets",
  yearLevel: 2,
  program: "Computer Science",
  canRemainEnrolledFullYear: true,
  canRemainEnrolledNextTerm: true,
  isOnCampus: true,
  isOnCoop: false,
};

describe("propagateCandidateProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNominationUpdateMany.mockResolvedValue({ count: 1 });
    mockInvitationUpdateMany.mockResolvedValue({ count: 0 });
  });

  it("targets only PENDING_RESPONSE/ACCEPTED nominations for this user in this election", async () => {
    await propagateCandidateProfile(7, 50, profile);

    expect(mockNominationUpdateMany).toHaveBeenCalledTimes(1);
    expect(mockNominationUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          nomineeUserId: 50,
          status: { in: ["PENDING_RESPONSE", "ACCEPTED"] },
          electionOffice: { electionId: 7 },
        }),
        data: profile,
      })
    );
  });

  it("targets only INVITED/ACCEPTED running-mate invitations for this user in this election", async () => {
    await propagateCandidateProfile(7, 50, profile);

    expect(mockInvitationUpdateMany).toHaveBeenCalledTimes(1);
    expect(mockInvitationUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          inviteeUserId: 50,
          status: { in: ["INVITED", "ACCEPTED"] },
          presidentNomination: { electionOffice: { electionId: 7 } },
        }),
        data: profile,
      })
    );
  });

  it("excludes the source nomination when an excludeNominationId is passed", async () => {
    await propagateCandidateProfile(7, 50, profile, {
      excludeNominationId: 123,
    });

    const where = mockNominationUpdateMany.mock.calls[0][0].where;
    expect(where.id).toEqual({ not: 123 });
    // And the invitations call should NOT pick up the exclude-nomination
    // hint — they live in a different table.
    const invWhere = mockInvitationUpdateMany.mock.calls[0][0].where;
    expect(invWhere.id).toBeUndefined();
  });

  it("excludes the source invitation when an excludeRunningMateInvitationId is passed", async () => {
    await propagateCandidateProfile(7, 50, profile, {
      excludeRunningMateInvitationId: 456,
    });

    const invWhere = mockInvitationUpdateMany.mock.calls[0][0].where;
    expect(invWhere.id).toEqual({ not: 456 });
    const nomWhere = mockNominationUpdateMany.mock.calls[0][0].where;
    expect(nomWhere.id).toBeUndefined();
  });

  it("returns the per-table updated counts", async () => {
    mockNominationUpdateMany.mockResolvedValue({ count: 3 });
    mockInvitationUpdateMany.mockResolvedValue({ count: 1 });

    const result = await propagateCandidateProfile(7, 50, profile);

    expect(result).toEqual({ nominationsUpdated: 3, invitationsUpdated: 1 });
  });
});
