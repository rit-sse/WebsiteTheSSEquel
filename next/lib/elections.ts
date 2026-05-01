import { cache } from "react";
import prisma from "@/lib/prisma";
import {
  ElectionApprovalStage,
  ElectionEligibilityStatus,
  ElectionNominationStatus,
  ElectionRunningMateStatus,
  ElectionStatus,
  type ElectionOffice,
  type ElectionNomination,
} from "@prisma/client";
import { getDefaultOfficerTermDateRange } from "@/lib/academicTerm";
import { SE_ADMIN_POSITION_TITLE } from "@/lib/seAdmin";
import { resolveUserImage } from "@/lib/s3Utils";

/**
 * Statuses that count as "an election is live on the public site".
 * Public CTA/nav treatment is only for active participation windows:
 * nominations are open or voting is open. Closed/certified elections
 * remain available by direct URL, but they should not advertise as a
 * pink homepage election button.
 */
const LIVE_ELECTION_STATUSES: ElectionStatus[] = [
  ElectionStatus.NOMINATIONS_OPEN,
  ElectionStatus.VOTING_OPEN,
];

export type ActiveElectionSummary = {
  id: number;
  title: string;
  slug: string;
  status: ElectionStatus;
};

/**
 * Fetch the most-recent live election (or null if none). Wrapped in
 * React's `cache` so the navbar, the banner, and the home-page CTA all
 * dedupe to a single DB roundtrip per request.
 */
export const getActiveElection = cache(
  async (): Promise<ActiveElectionSummary | null> => {
    const election = await prisma.election.findFirst({
      where: { status: { in: LIVE_ELECTION_STATUSES } },
      select: { id: true, title: true, slug: true, status: true },
      orderBy: { createdAt: "desc" },
    });
    return election;
  },
);

/**
 * Post-Amendment 12/13: Vice President is no longer separately elected —
 * it is chosen as a running mate by the President nominee. Mentoring Head
 * is now a Primary Officer elected by the membership.
 */
export const PRIMARY_OFFICER_TITLES = [
  "President",
  "Secretary",
  "Treasurer",
  "Mentoring Head",
] as const;

/**
 * Offices that cannot appear on a ballot independently because they are
 * derived from another office's ticket (Amendment 12).
 */
export const TICKET_DERIVED_OFFICE_TITLES = ["Vice President"] as const;

export const VICE_PRESIDENT_TITLE = "Vice President";
export const PRESIDENT_TITLE = "President";

/**
 * Canonical rendering order for primary offices — apply everywhere that
 * a list of primary-office tabs / tiles / slides appears so the user
 * sees the same ordering site-wide. Mentoring Head always tails the
 * list. Unknown titles sort to the end.
 */
export const PRIMARY_OFFICE_ORDER = [
  "President",
  "Vice President",
  "Treasurer",
  "Secretary",
  "Mentoring Head",
] as const;

export function compareByPrimaryOrder(a: string, b: string): number {
  const order = PRIMARY_OFFICE_ORDER as readonly string[];
  const ai = order.indexOf(a);
  const bi = order.indexOf(b);
  return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
}

/**
 * Office priority used when the same person wins more than one race —
 * they take the seat highest in this list and forfeit the lower ones,
 * which fall to the next-best candidate in those races. Per the SE
 * Office: President > Vice President > Secretary > Treasurer >
 * Mentoring Head. Note this differs from `PRIMARY_OFFICE_ORDER` (which
 * is purely a display ordering) — Treasurer and Secretary are
 * intentionally swapped here.
 */
export const WINNER_PRIORITY_ORDER = [
  "President",
  "Vice President",
  "Secretary",
  "Treasurer",
  "Mentoring Head",
] as const;

function compareByWinnerPriority(a: string, b: string): number {
  const order = WINNER_PRIORITY_ORDER as readonly string[];
  const ai = order.indexOf(a);
  const bi = order.indexOf(b);
  return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
}

export function getNominationResponseDeadline(election: {
  votingOpenAt: Date;
}) {
  return new Date(election.votingOpenAt.getTime() - 24 * 60 * 60 * 1000);
}

export function validateElectionWindow(input: {
  nominationsOpenAt: Date;
  nominationsCloseAt: Date;
  votingOpenAt: Date;
  votingCloseAt: Date;
}) {
  if (input.nominationsCloseAt <= input.nominationsOpenAt) {
    throw new Error("Nominations must close after they open.");
  }
  if (input.votingOpenAt <= input.nominationsCloseAt) {
    throw new Error("Voting must open after nominations close.");
  }
  const diff =
    input.votingOpenAt.getTime() - input.nominationsCloseAt.getTime();
  if (diff < 48 * 60 * 60 * 1000) {
    throw new Error(
      "Nominations must close at least 48 hours before voting opens.",
    );
  }
  if (input.votingCloseAt <= input.votingOpenAt) {
    throw new Error("Voting must close after it opens.");
  }
}

export async function syncElectionStatus(electionId: number) {
  const election = await prisma.election.findUnique({
    where: { id: electionId },
  });
  if (!election) return null;

  const now = new Date();
  let nextStatus: ElectionStatus | null = null;

  if (
    election.status === ElectionStatus.NOMINATIONS_OPEN &&
    now >= election.nominationsCloseAt
  ) {
    nextStatus = ElectionStatus.NOMINATIONS_CLOSED;
  }

  if (
    election.status === ElectionStatus.VOTING_OPEN &&
    now >= election.votingCloseAt
  ) {
    nextStatus = ElectionStatus.VOTING_CLOSED;
  }

  if (!nextStatus) return election;

  return prisma.election.update({
    where: { id: electionId },
    data: { status: nextStatus },
  });
}

export async function getElectionWithRelations(where: {
  id?: number;
  slug?: string;
}) {
  const election = await prisma.election.findFirst({
    where,
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      certifiedBy: {
        select: { id: true, name: true, email: true },
      },
      approvals: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      offices: {
        include: {
          officerPosition: {
            select: { id: true, title: true, is_primary: true, email: true },
          },
          nominations: {
            include: {
              nominee: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profileImageKey: true,
                  googleImageURL: true,
                },
              },
              nominator: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profileImageKey: true,
                  googleImageURL: true,
                },
              },
              reviewedBy: {
                select: { id: true, name: true, email: true },
              },
              runningMateInvitation: {
                include: {
                  invitee: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      profileImageKey: true,
                      googleImageURL: true,
                    },
                  },
                },
              },
            },
            orderBy: [{ createdAt: "asc" }],
          },
        },
        orderBy: {
          officerPosition: { title: "asc" },
        },
      },
      ballots: {
        include: {
          voter: {
            select: { id: true, name: true, email: true },
          },
          rankings: {
            include: {
              nomination: {
                include: {
                  nominee: {
                    select: { id: true, name: true, email: true },
                  },
                },
              },
            },
            orderBy: [{ electionOfficeId: "asc" }, { rank: "asc" }],
          },
        },
      },
      emailLogs: {
        include: {
          sentBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { sentAt: "desc" },
      },
    },
  });

  if (!election) return null;

  await syncElectionStatus(election.id);

  return prisma.election.findUnique({
    where: { id: election.id },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      certifiedBy: {
        select: { id: true, name: true, email: true },
      },
      approvals: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      offices: {
        include: {
          officerPosition: {
            select: { id: true, title: true, is_primary: true, email: true },
          },
          nominations: {
            include: {
              nominee: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profileImageKey: true,
                  googleImageURL: true,
                },
              },
              nominator: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profileImageKey: true,
                  googleImageURL: true,
                },
              },
              reviewedBy: {
                select: { id: true, name: true, email: true },
              },
              runningMateInvitation: {
                include: {
                  invitee: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      profileImageKey: true,
                      googleImageURL: true,
                    },
                  },
                },
              },
            },
            orderBy: [{ createdAt: "asc" }],
          },
        },
        orderBy: {
          officerPosition: { title: "asc" },
        },
      },
      ballots: {
        include: {
          voter: {
            select: { id: true, name: true, email: true },
          },
          rankings: {
            include: {
              nomination: {
                include: {
                  nominee: {
                    select: { id: true, name: true, email: true },
                  },
                },
              },
            },
            orderBy: [{ electionOfficeId: "asc" }, { rank: "asc" }],
          },
        },
      },
      emailLogs: {
        include: {
          sentBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { sentAt: "desc" },
      },
    },
  });
}

export function getElectionUrl(request: Request, slug: string) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto") ||
    (host?.includes("localhost") ? "http" : "https");
  const baseUrl = process.env.NEXTAUTH_URL
    ? process.env.NEXTAUTH_URL.replace(/\/+$/, "")
    : host
      ? `${proto}://${host}`
      : new URL(request.url).origin;
  return `${baseUrl}/elections/${slug}`;
}

export async function stageHasRequiredApprovals(
  electionId: number,
  stage: ElectionApprovalStage,
) {
  const approvals = await prisma.electionApproval.findMany({
    where: { electionId, stage },
    select: {
      userId: true,
      user: {
        select: {
          officers: {
            where: {
              is_active: true,
              position: {
                title: { in: ["President", SE_ADMIN_POSITION_TITLE] },
              },
            },
            select: {
              id: true,
              position: { select: { title: true } },
            },
          },
        },
      },
    },
  });

  const presidentApprovers = approvals
    .filter((approval) =>
      approval.user.officers.some(
        (officer) => officer.position.title === "President",
      ),
    )
    .map((approval) => approval.userId);
  const seAdminApprovers = approvals
    .filter((approval) =>
      approval.user.officers.some(
        (officer) => officer.position.title === SE_ADMIN_POSITION_TITLE,
      ),
    )
    .map((approval) => approval.userId);

  return presidentApprovers.some((presidentId) =>
    seAdminApprovers.some((adminId) => adminId !== presidentId),
  );
}

type TallyCandidate = Pick<ElectionNomination, "id" | "nomineeUserId"> & {
  nominee: { id: number; name: string; email: string };
};

type TallyBallot = {
  rankings: { nominationId: number; rank: number }[];
};

function deriveRank(
  ballot: TallyBallot,
  nominationId: number,
  fallbackRank: number,
) {
  const explicit = ballot.rankings.find(
    (ranking) => ranking.nominationId === nominationId,
  );
  return explicit?.rank ?? fallbackRank;
}

function rankScores(
  tiedCandidates: TallyCandidate[],
  ballots: TallyBallot[],
  officeCandidateCount: number,
) {
  return tiedCandidates.map((candidate) => {
    const ranks = ballots.map((ballot) =>
      deriveRank(ballot, candidate.id, officeCandidateCount),
    );
    const total = ranks.reduce((sum, rank) => sum + rank, 0);
    const average =
      ballots.length > 0 ? total / ballots.length : officeCandidateCount;
    return { candidate, total, average };
  });
}

function chooseBestCandidate(
  tiedCandidates: TallyCandidate[],
  ballots: TallyBallot[],
  officeCandidateCount: number,
) {
  const scores = rankScores(tiedCandidates, ballots, officeCandidateCount).sort(
    (a, b) => a.total - b.total || a.average - b.average,
  );
  if (scores.length < 2)
    return { resolved: true, candidate: scores[0]?.candidate ?? null };
  const [first, second] = scores;
  if (!first) return { resolved: false, candidate: null };
  if (
    second &&
    first.total === second.total &&
    first.average === second.average
  ) {
    return { resolved: false, candidate: null };
  }
  return { resolved: true, candidate: first.candidate };
}

function chooseWorstCandidate(
  tiedCandidates: TallyCandidate[],
  ballots: TallyBallot[],
  officeCandidateCount: number,
) {
  const scores = rankScores(tiedCandidates, ballots, officeCandidateCount).sort(
    (a, b) => b.total - a.total || b.average - a.average,
  );
  if (scores.length < 2)
    return { resolved: true, candidate: scores[0]?.candidate ?? null };
  const [first, second] = scores;
  if (!first) return { resolved: false, candidate: null };
  if (
    second &&
    first.total === second.total &&
    first.average === second.average
  ) {
    return { resolved: false, candidate: null };
  }
  return { resolved: true, candidate: first.candidate };
}

function getTopRemainingChoice(ballot: TallyBallot, remainingIds: Set<number>) {
  const rankedRemaining = ballot.rankings
    .filter((ranking) => remainingIds.has(ranking.nominationId))
    .sort((a, b) => a.rank - b.rank);
  return rankedRemaining[0]?.nominationId ?? null;
}

export function tallyInstantRunoffElection(params: {
  office: ElectionOffice & {
    officerPosition: { title: string };
    nominations: (ElectionNomination & {
      nominee: { id: number; name: string; email: string };
    })[];
  };
  ballots: {
    rankings: {
      electionOfficeId: number;
      nominationId: number;
      rank: number;
    }[];
  }[];
}) {
  const eligibleNominations = params.office.nominations.filter(
    (nomination) =>
      nomination.status === ElectionNominationStatus.ACCEPTED &&
      nomination.eligibilityStatus === ElectionEligibilityStatus.APPROVED,
  );

  if (eligibleNominations.length === 0) {
    return {
      officeId: params.office.id,
      officeTitle: params.office.officerPosition.title,
      status: "no_candidates" as const,
      winner: null,
      runnerUp: null,
      rankedNominations: [],
      rounds: [],
    };
  }

  const officeBallots: TallyBallot[] = params.ballots
    .map((ballot) => ({
      rankings: ballot.rankings
        .filter((ranking) => ranking.electionOfficeId === params.office.id)
        .map((ranking) => ({
          nominationId: ranking.nominationId,
          rank: ranking.rank,
        })),
    }))
    .filter((ballot) => ballot.rankings.length > 0);

  const remaining = new Set<number>(
    eligibleNominations.map((nomination) => nomination.id),
  );
  const rounds: Array<{
    counts: { nominationId: number; votes: number }[];
    eliminatedNominationId?: number;
  }> = [];
  const eliminationOrder: number[] = [];

  while (remaining.size > 1) {
    const counts = new Map<number, number>();
    for (const nominationId of remaining) {
      counts.set(nominationId, 0);
    }

    for (const ballot of officeBallots) {
      const topChoice = getTopRemainingChoice(ballot, remaining);
      if (topChoice) {
        counts.set(topChoice, (counts.get(topChoice) ?? 0) + 1);
      }
    }

    const countEntries = [...counts.entries()].map(([nominationId, votes]) => ({
      nominationId,
      votes,
    }));

    const minVotes = Math.min(...countEntries.map((entry) => entry.votes));
    const lowest = countEntries.filter((entry) => entry.votes === minVotes);

    let eliminatedNominationId: number | undefined;
    if (lowest.length === 1) {
      eliminatedNominationId = lowest[0]?.nominationId;
    } else {
      const tiedCandidates = eligibleNominations.filter((nomination) =>
        lowest.some((entry) => entry.nominationId === nomination.id),
      );
      const tieBreak = chooseWorstCandidate(
        tiedCandidates.map((nomination) => ({
          id: nomination.id,
          nomineeUserId: nomination.nomineeUserId,
          nominee: nomination.nominee,
        })),
        officeBallots,
        eligibleNominations.length,
      );

      if (!tieBreak.resolved || !tieBreak.candidate) {
        return {
          officeId: params.office.id,
          officeTitle: params.office.officerPosition.title,
          status: "tie" as const,
          winner: null,
          runnerUp: null,
          rankedNominations: [],
          rounds,
        };
      }
      eliminatedNominationId = tieBreak.candidate.id;
    }

    rounds.push({
      counts: countEntries,
      eliminatedNominationId,
    });

    if (!eliminatedNominationId) break;
    remaining.delete(eliminatedNominationId);
    eliminationOrder.push(eliminatedNominationId);
  }

  const winnerId = [...remaining][0] ?? null;
  if (!winnerId) {
    return {
      officeId: params.office.id,
      officeTitle: params.office.officerPosition.title,
      status: "tie" as const,
      winner: null,
      runnerUp: null,
      rankedNominations: [],
      rounds,
    };
  }

  const winner =
    eligibleNominations.find((nomination) => nomination.id === winnerId) ??
    null;
  let runnerUp =
    eligibleNominations.find(
      (nomination) =>
        nomination.id === eliminationOrder[eliminationOrder.length - 1],
    ) ?? null;

  if (!runnerUp && eligibleNominations.length === 2) {
    runnerUp =
      eligibleNominations.find((nomination) => nomination.id !== winnerId) ??
      null;
  }

  // Full ranking, winner first → last-place last. Built by walking
  // `eliminationOrder` (first eliminated = worst) in reverse and
  // prepending the winner. Used by the multi-office winner dedupe pass
  // in `tallyElectionResults` so that when the top finisher takes a
  // higher-priority seat, we can reach further down this list to find
  // the next eligible person for THIS race instead of just runner-up.
  const rankedNominations = [
    winner,
    ...eliminationOrder
      .slice()
      .reverse()
      .map(
        (id) =>
          eligibleNominations.find((nomination) => nomination.id === id) ??
          null,
      ),
  ].filter(
    (nomination): nomination is (typeof eligibleNominations)[number] =>
      nomination !== null,
  );

  return {
    officeId: params.office.id,
    officeTitle: params.office.officerPosition.title,
    status: "ok" as const,
    winner,
    runnerUp,
    rankedNominations,
    rounds,
  };
}

/**
 * Amendment 12: Vice President is derived from the winning presidential
 * ticket's accepted running-mate invitation. These helpers replace the old
 * `shouldUsePresidentOnlyBallot` shim that paired VP via identical nominee
 * lists.
 */
export function isTicketDerivedOffice(title: string) {
  return (TICKET_DERIVED_OFFICE_TITLES as readonly string[]).includes(title);
}

type NominationWithRunningMate = {
  id: number;
  nomineeUserId: number;
  runningMateInvitation?: {
    status: ElectionRunningMateStatus;
    invitee: {
      id: number;
      name: string;
      email: string;
      profileImageKey?: string | null;
      googleImageURL?: string | null;
    };
  } | null;
};

export function getAcceptedRunningMate(
  nomination: NominationWithRunningMate | null | undefined,
) {
  if (!nomination?.runningMateInvitation) return null;
  if (
    nomination.runningMateInvitation.status !==
    ElectionRunningMateStatus.ACCEPTED
  ) {
    return null;
  }
  return nomination.runningMateInvitation.invitee;
}

/**
 * Resolve the case where the same person finishes first in more than
 * one race in the same primary. Walks the supplied results array in
 * `WINNER_PRIORITY_ORDER` (Pres > VP > Sec > Treas > MH) and assigns
 * each candidate to the highest-priority seat they won. When a top
 * finisher takes a higher seat, fall through their `rankedNominations`
 * to the next-best unclaimed candidate for the displaced seat.
 *
 * Mutates the results in place. Sets:
 *   - `winner` / `runnerUp` to the FINAL (post-dedupe) values
 *   - `displaced: true` when the original IRV winner moved up
 *   - `originalWinner` to the IRV winner that was bumped (so UI can
 *     show "X actually won this but took a higher seat")
 *   - `status` to "no_candidates" if every ranked candidate is now
 *     serving somewhere higher (rare but possible with tiny ballots)
 *
 * Ticket-derived VP: only assigns the running mate if they're not
 * already claimed (which can't happen given VP's priority slot, but
 * the same set-membership check applies). Subsequent offices skip
 * the VP user automatically.
 */
export function dedupeMultiOfficeWinners(
  results: Array<{
    officeTitle: string;
    status: string;
    winner: { nomineeUserId: number; [key: string]: unknown } | null;
    runnerUp: unknown;
    rankedNominations?: Array<{
      id: number;
      nomineeUserId: number;
      nominee: { id: number; name: string; email: string };
    }>;
    ticketDerived?: boolean;
    displaced?: boolean;
    originalWinner?: unknown;
  }>,
) {
  const claimed = new Set<number>();
  for (const result of [...results].sort((a, b) =>
    compareByWinnerPriority(a.officeTitle, b.officeTitle),
  )) {
    if (result.status !== "ok" || !result.winner) continue;

    if (result.ticketDerived) {
      const vpUserId = result.winner.nomineeUserId;
      if (claimed.has(vpUserId)) {
        result.winner = null;
        result.status = "no_candidates";
        result.displaced = true;
      } else {
        claimed.add(vpUserId);
      }
      continue;
    }

    const ranked = result.rankedNominations ?? [];
    const originalWinnerUserId = result.winner.nomineeUserId;
    const newWinner = ranked.find((n) => !claimed.has(n.nomineeUserId)) ?? null;

    if (!newWinner) {
      result.winner = null;
      result.runnerUp = null;
      result.status = "no_candidates";
      result.displaced = true;
    } else if (newWinner.nomineeUserId !== originalWinnerUserId) {
      result.originalWinner = result.winner;
      result.winner = newWinner;
      result.runnerUp =
        ranked
          .slice(ranked.indexOf(newWinner) + 1)
          .find((n) => !claimed.has(n.nomineeUserId)) ?? null;
      result.displaced = true;
      claimed.add(newWinner.nomineeUserId);
    } else {
      claimed.add(newWinner.nomineeUserId);
    }
  }
}

export async function tallyElectionResults(electionId: number) {
  const election = await getElectionWithRelations({ id: electionId });
  if (!election) return null;

  // Offices on the ballot — VP is ticket-derived and never tallied.
  const ballotedOffices = election.offices.filter(
    (office) => !isTicketDerivedOffice(office.officerPosition.title),
  );

  const results: Array<any> = ballotedOffices.map((office) =>
    tallyInstantRunoffElection({
      office,
      ballots: election.ballots.map((ballot) => ({
        rankings: ballot.rankings.map((ranking) => ({
          electionOfficeId: ranking.electionOfficeId,
          nominationId: ranking.nominationId,
          rank: ranking.rank,
        })),
      })),
    }),
  );

  // Amendment 12: attach the winning presidential ticket's running mate as
  // the VP outcome. We expose it as a `runningMate` field on the President
  // result and as a synthetic "Vice President" result so that certification
  // and existing results UI can continue to key off office title.
  const presidentResult = results.find(
    (result) => result.officeTitle === PRESIDENT_TITLE,
  );
  const presidentOffice = election.offices.find(
    (office) => office.officerPosition.title === PRESIDENT_TITLE,
  );
  const vicePresidentOffice = election.offices.find(
    (office) => office.officerPosition.title === VICE_PRESIDENT_TITLE,
  );

  let runningMate: {
    userId: number;
    name: string;
    email: string;
    profileImageKey?: string | null;
    googleImageURL?: string | null;
  } | null = null;

  if (presidentResult && presidentResult.winner && presidentOffice) {
    const winningNomination = presidentOffice.nominations.find(
      (nomination) => nomination.id === presidentResult.winner.id,
    );
    const invitee = getAcceptedRunningMate(winningNomination);
    if (invitee) {
      runningMate = {
        userId: invitee.id,
        name: invitee.name,
        email: invitee.email,
        profileImageKey: invitee.profileImageKey,
        googleImageURL: invitee.googleImageURL,
      };
      presidentResult.runningMate = runningMate;
    }
  }

  if (vicePresidentOffice && presidentResult) {
    // Keep a derived VP result so downstream certification / UI continues
    // to see a Vice President row, but mark it ticket-derived.
    results.push({
      officeId: vicePresidentOffice.id,
      officeTitle: VICE_PRESIDENT_TITLE,
      status: runningMate ? ("ok" as const) : ("no_candidates" as const),
      ticketDerived: true,
      derivedFromOfficeId: presidentOffice?.id ?? null,
      winner: runningMate
        ? {
            // Shape this like an ElectionNomination "winner" so existing
            // consumers don't have to branch: they key off winner.nomineeUserId.
            id: null as unknown as number,
            nomineeUserId: runningMate.userId,
            nominee: {
              id: runningMate.userId,
              name: runningMate.name,
              email: runningMate.email,
            },
          }
        : null,
      runnerUp: null,
      rounds: [],
    });
  }

  dedupeMultiOfficeWinners(results);

  // Canonical primary-office order, applied site-wide via the tally
  // consumers (results page, reveal page, certify).
  results.sort((a, b) => compareByPrimaryOrder(a.officeTitle, b.officeTitle));

  return {
    electionId: election.id,
    electionTitle: election.title,
    // Kept for backwards-compat with existing callers; always false now
    // because ballot suppression is gone.
    presidentOnlyBallot: false,
    runningMate,
    results,
    unresolvedTie: results.some((result) => result.status === "tie"),
  };
}

export async function certifyElection(
  electionId: number,
  certifiedById: number,
) {
  const election = await prisma.election.findUnique({
    where: { id: electionId },
    include: {
      offices: {
        include: {
          officerPosition: true,
        },
      },
    },
  });

  if (!election) {
    throw new Error("Election not found.");
  }

  const results = await tallyElectionResults(electionId);
  if (!results) {
    throw new Error("Election results not found.");
  }

  if (results.unresolvedTie) {
    await prisma.election.update({
      where: { id: electionId },
      data: { status: ElectionStatus.TIE_RUNOFF_REQUIRED },
    });
    throw new Error("Election has an unresolved tie and cannot be certified.");
  }

  await prisma.$transaction(async (tx) => {
    const certificationDate = new Date();
    // Officer records still require an end date, so certification reuses the
    // existing officer-term default instead of collecting one during election setup.
    const { endDate: defaultEndDate } =
      getDefaultOfficerTermDateRange(certificationDate);
    for (const result of results.results) {
      if (!result.winner) {
        throw new Error(`No winner available for ${result.officeTitle}.`);
      }

      const office = election.offices.find(
        (item) => item.id === result.officeId,
      );
      if (!office) {
        throw new Error(`Office mapping missing for ${result.officeTitle}.`);
      }

      await tx.officer.updateMany({
        where: {
          position_id: office.officerPositionId,
          is_active: true,
        },
        data: {
          is_active: false,
          end_date: certificationDate,
        },
      });

      await tx.officer.create({
        data: {
          position_id: office.officerPositionId,
          user_id: result.winner.nomineeUserId,
          start_date: certificationDate,
          end_date: defaultEndDate,
          is_active: true,
        },
      });
    }

    await tx.election.update({
      where: { id: electionId },
      data: {
        status: ElectionStatus.CERTIFIED,
        certifiedById,
        certifiedAt: new Date(),
      },
    });
  });

  return getElectionWithRelations({ id: electionId });
}

export function canTransitionElectionStatus(
  currentStatus: ElectionStatus,
  nextStatus: ElectionStatus,
) {
  const transitions: Record<ElectionStatus, ElectionStatus[]> = {
    [ElectionStatus.DRAFT]: [
      ElectionStatus.NOMINATIONS_OPEN,
      ElectionStatus.CANCELLED,
    ],
    [ElectionStatus.NOMINATIONS_OPEN]: [
      ElectionStatus.NOMINATIONS_CLOSED,
      ElectionStatus.CANCELLED,
    ],
    [ElectionStatus.NOMINATIONS_CLOSED]: [
      ElectionStatus.VOTING_OPEN,
      ElectionStatus.CANCELLED,
    ],
    [ElectionStatus.VOTING_OPEN]: [
      ElectionStatus.VOTING_CLOSED,
      ElectionStatus.CANCELLED,
    ],
    [ElectionStatus.VOTING_CLOSED]: [
      ElectionStatus.CERTIFIED,
      ElectionStatus.TIE_RUNOFF_REQUIRED,
      ElectionStatus.CANCELLED,
    ],
    [ElectionStatus.CERTIFIED]: [],
    [ElectionStatus.CANCELLED]: [],
    [ElectionStatus.TIE_RUNOFF_REQUIRED]: [ElectionStatus.CANCELLED],
  };

  return transitions[currentStatus].includes(nextStatus);
}

export async function getElectionCandidatePageData(slug: string) {
  const election = await getElectionWithRelations({ slug });
  if (!election) return null;
  return election;
}

export async function assertPrimaryOfficerPositions(positionIds: number[]) {
  const positions = await prisma.officerPosition.findMany({
    where: { id: { in: positionIds } },
    select: { id: true, is_primary: true, title: true },
  });
  if (positions.length !== positionIds.length) {
    throw new Error("One or more officer positions were not found.");
  }
  if (positions.some((position) => !position.is_primary)) {
    throw new Error(
      "Only primary officer positions can be included in elections.",
    );
  }
  return positions;
}

export function serializeElectionForClient<T>(value: T): T {
  const serialized = JSON.parse(JSON.stringify(value));

  // Resolve profile images on user references within election data
  function resolveImages(obj: unknown): void {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      obj.forEach(resolveImages);
      return;
    }
    const record = obj as Record<string, unknown>;
    // If this object looks like a user with image fields, resolve the image
    if ("profileImageKey" in record || "googleImageURL" in record) {
      record.image = resolveUserImage(
        record.profileImageKey as string | undefined | null,
        record.googleImageURL as string | undefined | null,
      );
      delete record.profileImageKey;
      delete record.googleImageURL;
    }
    // Recurse into nested objects
    for (const val of Object.values(record)) {
      resolveImages(val);
    }
  }

  resolveImages(serialized);
  return serialized as T;
}

/**
 * Full tally → client-friendly rounds helper. Centralizes the pipeline
 * previously inlined in `app/(main)/elections/[slug]/results/page.tsx`
 * so both the results page and the new reveal ceremony can consume the
 * same shape.
 *
 * Returns:
 *   - `election`: the raw fetched election (including offices, nominations
 *     with runningMateInvitation, ballots, etc.) for any downstream lookups
 *   - `results`: IRV results per ballot-office + a synthetic Vice President
 *     row when the President's winning ticket has an ACCEPTED running mate
 */
export async function tallyElectionForDisplay(slug: string) {
  const election = await getElectionWithRelations({ slug });
  if (!election) return null;

  // Build nominee lookup from every office
  const nomineeNames = new Map<number, string>();
  for (const office of election.offices) {
    for (const nomination of office.nominations) {
      nomineeNames.set(nomination.id, nomination.nominee.name);
    }
  }

  // Tally each ballotable office. VP is ticket-derived and excluded here
  // — it's reattached via the running-mate invitation below.
  const officesToTally = election.offices.filter(
    (office) => !isTicketDerivedOffice(office.officerPosition.title),
  );

  const rawResults = officesToTally.map((office) =>
    tallyInstantRunoffElection({
      office,
      ballots: election.ballots.map((ballot) => ({
        rankings: ballot.rankings.map((ranking) => ({
          electionOfficeId: ranking.electionOfficeId,
          nominationId: ranking.nominationId,
          rank: ranking.rank,
        })),
      })),
    }),
  );

  // Attach the running-mate VP row derived from the winning presidential
  // ticket's ACCEPTED invitee.
  const presidentOffice = election.offices.find(
    (o) => o.officerPosition.title === PRESIDENT_TITLE,
  );
  const presidentResult = rawResults.find(
    (r) => r.officeTitle === PRESIDENT_TITLE,
  );
  if (presidentResult?.winner && presidentOffice) {
    const winningNomination = presidentOffice.nominations.find(
      (n) => n.id === presidentResult.winner!.id,
    );
    const invitee = getAcceptedRunningMate(winningNomination);
    if (invitee) {
      const vpOffice = election.offices.find(
        (o) => o.officerPosition.title === VICE_PRESIDENT_TITLE,
      );
      rawResults.push({
        // Modern elections do not include Vice President as a ballotable
        // office row. Use a stable synthetic id for display-only surfaces
        // when the legacy row is absent.
        officeId: vpOffice?.id ?? -presidentOffice.id,
        officeTitle: VICE_PRESIDENT_TITLE,
        status: "ok" as const,
        winner: {
          // Synthetic negative id — never used for lookups
          id: -winningNomination!.id,
          nomineeUserId: invitee.id,
          nominee: {
            id: invitee.id,
            name: invitee.name,
            email: invitee.email,
            // Preserve image fields so the downstream transform can
            // resolve the VP's photo just like any other winner.
            profileImageKey: invitee.profileImageKey,
            googleImageURL: invitee.googleImageURL,
          },
        } as unknown as (typeof rawResults)[number]["winner"],
        runnerUp: null,
        rounds: [],
      } as unknown as (typeof rawResults)[number]);
      nomineeNames.set(-winningNomination!.id, invitee.name);
    }
  }

  // Same dedupe pass the certify path uses — make sure the displayed
  // winners reflect the multi-office tie-break (one person can't hold
  // two seats, so they take the highest-priority race they won and
  // the others fall to the next-best candidate). The synthetic VP
  // entry above carries `ticketDerived: false` here (the display
  // pipeline marks it later in the .map below), so add a temporary
  // hint for the helper.
  for (const r of rawResults as Array<{
    officeTitle: string;
    ticketDerived?: boolean;
  }>) {
    if (r.officeTitle === VICE_PRESIDENT_TITLE) r.ticketDerived = true;
  }
  dedupeMultiOfficeWinners(
    rawResults as unknown as Parameters<typeof dedupeMultiOfficeWinners>[0],
  );

  // Transform into client-friendly IRVOfficeResult rows. The result
  // shape matches `next/components/elections/types.ts::IRVOfficeResult`
  // but we keep the type inline here so lib has no component import.
  const totalBallots = election.ballots.length;

  const results = rawResults.map((raw: any) => {
    const rounds = raw.rounds.map(
      (
        round: {
          counts: Array<{ nominationId: number; votes: number }>;
          eliminatedNominationId?: number | null;
        },
        index: number,
      ) => ({
        roundNumber: index + 1,
        counts: round.counts.map((entry) => ({
          nominationId: entry.nominationId,
          candidateName: nomineeNames.get(entry.nominationId) ?? "Unknown",
          votes: entry.votes,
          eliminated: entry.nominationId === round.eliminatedNominationId,
        })),
        eliminatedNominationId: round.eliminatedNominationId ?? null,
      }),
    );

    const lastRound = rounds[rounds.length - 1];
    const winnerFinalVotes =
      raw.winner && lastRound
        ? (lastRound.counts.find(
            (c: { nominationId: number }) => c.nominationId === raw.winner!.id,
          )?.votes ?? 0)
        : 0;
    const runnerUpFinalVotes =
      raw.runnerUp && lastRound
        ? (lastRound.counts.find(
            (c: { nominationId: number }) =>
              c.nominationId === raw.runnerUp!.id,
          )?.votes ?? 0)
        : 0;

    let runningMate: {
      userId: number;
      name: string;
      image: string | null;
    } | null = null;
    if (raw.officeTitle === PRESIDENT_TITLE && raw.winner && presidentOffice) {
      const winningNomination = presidentOffice.nominations.find(
        (n) => n.id === raw.winner.id,
      );
      const invitee = getAcceptedRunningMate(winningNomination);
      if (invitee) {
        runningMate = {
          userId: invitee.id,
          name: invitee.name,
          image: resolveUserImage(
            invitee.profileImageKey,
            invitee.googleImageURL,
          ),
        };
      }
    }

    return {
      officeId: raw.officeId,
      officeTitle: raw.officeTitle,
      status: raw.status,
      winner: raw.winner
        ? {
            nominationId: raw.winner.id,
            userId: raw.winner.nominee.id,
            name: raw.winner.nominee.name,
            image: resolveUserImage(
              raw.winner.nominee.profileImageKey,
              raw.winner.nominee.googleImageURL,
            ),
            finalVotes: winnerFinalVotes,
          }
        : null,
      runnerUp: raw.runnerUp
        ? {
            nominationId: raw.runnerUp.id,
            userId: raw.runnerUp.nominee.id,
            name: raw.runnerUp.nominee.name,
            image: resolveUserImage(
              raw.runnerUp.nominee.profileImageKey,
              raw.runnerUp.nominee.googleImageURL,
            ),
            finalVotes: runnerUpFinalVotes,
          }
        : null,
      rounds,
      totalBallots,
      ticketDerived: raw.officeTitle === VICE_PRESIDENT_TITLE,
      runningMate,
    };
  });

  // Canonical primary-office order — threads through the results page
  // and the reveal carousel because both consume this `results` array.
  results.sort((a, b) => compareByPrimaryOrder(a.officeTitle, b.officeTitle));

  return { election, results };
}
