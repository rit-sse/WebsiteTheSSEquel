import { describe, expect, it } from "vitest";
import {
  canTransitionElectionStatus,
  shouldUsePresidentOnlyBallot,
  tallyInstantRunoffElection,
} from "@/lib/elections";
import {
  ElectionEligibilityStatus,
  ElectionNominationStatus,
  ElectionStatus,
} from "@prisma/client";

describe("election helpers", () => {
  it("allows only valid election status transitions", () => {
    expect(
      canTransitionElectionStatus(ElectionStatus.DRAFT, ElectionStatus.NOMINATIONS_OPEN)
    ).toBe(true);
    expect(
      canTransitionElectionStatus(ElectionStatus.DRAFT, ElectionStatus.VOTING_OPEN)
    ).toBe(false);
  });

  it("detects the President/VP shared-slate rule", () => {
    expect(
      shouldUsePresidentOnlyBallot({
        offices: [
          {
            officerPosition: { title: "President" },
            nominations: [
              {
                nomineeUserId: 1,
                status: ElectionNominationStatus.ACCEPTED,
                eligibilityStatus: ElectionEligibilityStatus.APPROVED,
              },
              {
                nomineeUserId: 2,
                status: ElectionNominationStatus.ACCEPTED,
                eligibilityStatus: ElectionEligibilityStatus.APPROVED,
              },
            ],
          },
          {
            officerPosition: { title: "Vice President" },
            nominations: [
              {
                nomineeUserId: 1,
                status: ElectionNominationStatus.ACCEPTED,
                eligibilityStatus: ElectionEligibilityStatus.APPROVED,
              },
              {
                nomineeUserId: 2,
                status: ElectionNominationStatus.ACCEPTED,
                eligibilityStatus: ElectionEligibilityStatus.APPROVED,
              },
            ],
          },
        ],
      } as any)
    ).toBe(true);
  });

  it("tallies an instant-runoff race and returns the winner and runner-up", () => {
    const result = tallyInstantRunoffElection({
      office: {
        id: 10,
        officerPositionId: 1,
        createdAt: new Date(),
        electionId: 1,
        officerPosition: { title: "President" },
        nominations: [
          {
            id: 1,
            nomineeUserId: 11,
            nominee: { id: 11, name: "Alex", email: "alex@example.com" },
            status: ElectionNominationStatus.ACCEPTED,
            eligibilityStatus: ElectionEligibilityStatus.APPROVED,
          },
          {
            id: 2,
            nomineeUserId: 12,
            nominee: { id: 12, name: "Blair", email: "blair@example.com" },
            status: ElectionNominationStatus.ACCEPTED,
            eligibilityStatus: ElectionEligibilityStatus.APPROVED,
          },
          {
            id: 3,
            nomineeUserId: 13,
            nominee: { id: 13, name: "Casey", email: "casey@example.com" },
            status: ElectionNominationStatus.ACCEPTED,
            eligibilityStatus: ElectionEligibilityStatus.APPROVED,
          },
        ],
      } as any,
      ballots: [
        { rankings: [{ electionOfficeId: 10, nominationId: 1, rank: 1 }, { electionOfficeId: 10, nominationId: 2, rank: 2 }] },
        { rankings: [{ electionOfficeId: 10, nominationId: 1, rank: 1 }, { electionOfficeId: 10, nominationId: 3, rank: 2 }] },
        { rankings: [{ electionOfficeId: 10, nominationId: 2, rank: 1 }, { electionOfficeId: 10, nominationId: 1, rank: 2 }] },
        { rankings: [{ electionOfficeId: 10, nominationId: 3, rank: 1 }, { electionOfficeId: 10, nominationId: 2, rank: 2 }] },
      ],
    });

    expect(result.status).toBe("ok");
    expect(result.winner?.nominee.name).toBe("Alex");
    expect(result.runnerUp?.nominee.name).toBe("Blair");
    expect(result.rounds.length).toBeGreaterThan(0);
  });
});
