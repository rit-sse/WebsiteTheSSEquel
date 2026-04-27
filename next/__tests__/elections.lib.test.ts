import { describe, expect, it } from "vitest";
import {
  PRIMARY_OFFICER_TITLES,
  canTransitionElectionStatus,
  dedupeMultiOfficeWinners,
  getAcceptedRunningMate,
  isTicketDerivedOffice,
  tallyInstantRunoffElection,
} from "@/lib/elections";
import {
  ElectionEligibilityStatus,
  ElectionNominationStatus,
  ElectionRunningMateStatus,
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

  it("post-Amendment 13: Mentoring Head is a primary, VP is not", () => {
    expect(PRIMARY_OFFICER_TITLES).toContain("Mentoring Head");
    expect(PRIMARY_OFFICER_TITLES).not.toContain("Vice President");
  });

  it("post-Amendment 12: VP is a ticket-derived office", () => {
    expect(isTicketDerivedOffice("Vice President")).toBe(true);
    expect(isTicketDerivedOffice("President")).toBe(false);
    expect(isTicketDerivedOffice("Mentoring Head")).toBe(false);
  });

  it("resolves an accepted running mate from a nomination", () => {
    const invitee = {
      id: 99,
      name: "Mel Okonkwo",
      email: "mel@example.com",
    };
    expect(
      getAcceptedRunningMate({
        id: 1,
        nomineeUserId: 5,
        runningMateInvitation: {
          status: ElectionRunningMateStatus.ACCEPTED,
          invitee,
        },
      })
    ).toEqual(invitee);
    expect(
      getAcceptedRunningMate({
        id: 1,
        nomineeUserId: 5,
        runningMateInvitation: {
          status: ElectionRunningMateStatus.INVITED,
          invitee,
        },
      })
    ).toBeNull();
    expect(
      getAcceptedRunningMate({ id: 1, nomineeUserId: 5 })
    ).toBeNull();
  });

  describe("dedupeMultiOfficeWinners", () => {
    // Helpers — keep the test data terse. `nom` builds a "ranked
    // nomination" entry, `result` builds a per-office IRV result
    // shaped the way `tallyElectionResults` produces it.
    const nom = (id: number, userId: number, name: string) => ({
      id,
      nomineeUserId: userId,
      nominee: { id: userId, name, email: `${name}@e.com` },
    });
    const result = (
      title: string,
      ranked: ReturnType<typeof nom>[],
      extra: Record<string, unknown> = {}
    ) => ({
      officeTitle: title,
      status: "ok" as string,
      winner: ranked[0]
        ? { ...ranked[0], nomineeUserId: ranked[0].nomineeUserId }
        : null,
      runnerUp: ranked[1] ?? null,
      rankedNominations: ranked,
      ...extra,
    });

    it("leaves a single-position winner alone", () => {
      const sam = nom(1, 50, "Sam");
      const isabell = nom(2, 92, "Isabell");
      const results = [result("Treasurer", [sam, isabell])];
      dedupeMultiOfficeWinners(results as any);
      expect(results[0].winner?.nomineeUserId).toBe(50);
      expect((results[0] as any).displaced).toBeUndefined();
    });

    it("when one person wins two offices, gives them the higher-priority seat (per WINNER_PRIORITY_ORDER) and bumps the other to its runner-up", () => {
      // Sam wins both Treasurer and Secretary in IRV. Per the priority
      // order Pres > VP > Sec > Treas > MH, Sam takes Secretary; the
      // Treasurer race falls to its next-best ranked candidate.
      const sam = nom(1, 50, "Sam");
      const isabell = nom(2, 92, "Isabell");
      const cayden = nom(3, 117, "Cayden");
      const results = [
        result("Treasurer", [sam, isabell]),
        result("Secretary", [sam, cayden]),
      ];

      dedupeMultiOfficeWinners(results as any);

      const treas = results.find((r) => r.officeTitle === "Treasurer")!;
      const sec = results.find((r) => r.officeTitle === "Secretary")!;
      expect(sec.winner?.nomineeUserId).toBe(50); // Sam keeps Secretary
      expect((sec as any).displaced).toBeUndefined();
      expect(treas.winner?.nomineeUserId).toBe(92); // Isabell promoted
      expect((treas as any).displaced).toBe(true);
      expect((treas as any).originalWinner.nomineeUserId).toBe(50);
    });

    it("walks past every claimed candidate when the runner-up is also displaced", () => {
      // Sam wins President. Sam ALSO wins Mentoring Head with Theo as
      // runner-up. Theo wins Treasurer. After dedupe: Sam takes
      // President; Mentoring Head's #1 (Sam) is claimed and #2 (Theo)
      // is also claimed by Treasurer (which is processed later but VP
      // priority-order processing means Treasurer runs *before*
      // Mentoring Head — Treas claims Theo, Mentoring Head finds its
      // #3 unclaimed candidate). Verify the cascade.
      const sam = nom(1, 50, "Sam");
      const theo = nom(2, 200, "Theo");
      const amber = nom(3, 117, "Amber");
      const results = [
        result("President", [sam, nom(4, 999, "Other")]),
        result("Treasurer", [theo]),
        result("Mentoring Head", [sam, theo, amber]),
      ];

      dedupeMultiOfficeWinners(results as any);

      const pres = results.find((r) => r.officeTitle === "President")!;
      const treas = results.find((r) => r.officeTitle === "Treasurer")!;
      const mh = results.find((r) => r.officeTitle === "Mentoring Head")!;
      expect(pres.winner?.nomineeUserId).toBe(50); // Sam → President
      expect(treas.winner?.nomineeUserId).toBe(200); // Theo → Treasurer
      // Mentoring Head: Sam (claimed by Pres) and Theo (claimed by
      // Treas) skipped → Amber gets it.
      expect(mh.winner?.nomineeUserId).toBe(117);
      expect((mh as any).displaced).toBe(true);
    });

    it("for ticket-derived VP, drops the running mate if they're already serving elsewhere", () => {
      // Synthetic VP entry — President's running mate would have won
      // VP, but they ALSO won President directly somehow. Per the
      // dedupe pass, VP gets nulled out in this edge case.
      const sam = nom(1, 50, "Sam");
      const results = [
        result("President", [sam]),
        // Synthetic VP row that points at the same user (Sam).
        {
          officeTitle: "Vice President",
          status: "ok",
          winner: { nomineeUserId: 50 },
          runnerUp: null,
          rankedNominations: [],
          ticketDerived: true,
        },
      ];
      dedupeMultiOfficeWinners(results as any);
      const vp = results.find((r) => r.officeTitle === "Vice President")!;
      expect(vp.winner).toBeNull();
      expect(vp.status).toBe("no_candidates");
      expect((vp as any).displaced).toBe(true);
    });

    it("Secretary > Treasurer in priority — same race, same person, opposite outcomes verify the order", () => {
      // Sam wins both Treasurer and Secretary, Isabell is runner-up
      // for both. Sam should get Secretary (higher priority); Isabell
      // gets Treasurer.
      const sam = nom(1, 50, "Sam");
      const isabell = nom(2, 92, "Isabell");
      const results = [
        result("Treasurer", [sam, isabell]),
        result("Secretary", [sam, isabell]),
      ];
      dedupeMultiOfficeWinners(results as any);
      expect(results.find((r) => r.officeTitle === "Secretary")!.winner?.nomineeUserId).toBe(50);
      expect(results.find((r) => r.officeTitle === "Treasurer")!.winner?.nomineeUserId).toBe(92);
    });
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
