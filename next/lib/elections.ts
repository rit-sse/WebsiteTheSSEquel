import prisma from "@/lib/prisma";
import {
  ElectionApprovalStage,
  ElectionEligibilityStatus,
  ElectionNominationStatus,
  ElectionStatus,
  type ElectionOffice,
  type ElectionNomination,
} from "@prisma/client";
import { getDefaultOfficerTermDateRange } from "@/lib/academicTerm";
import { SE_ADMIN_POSITION_TITLE } from "@/lib/seAdmin";
import { resolveUserImage } from "@/lib/s3Utils";

export const PRIMARY_OFFICER_TITLES = [
  "President",
  "Vice President",
  "Treasurer",
  "Secretary",
] as const;

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
  const diff = input.votingOpenAt.getTime() - input.nominationsCloseAt.getTime();
  if (diff < 48 * 60 * 60 * 1000) {
    throw new Error(
      "Nominations must close at least 48 hours before voting opens."
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
                select: { id: true, name: true, email: true, profileImageKey: true, googleImageURL: true },
              },
              nominator: {
                select: { id: true, name: true, email: true, profileImageKey: true, googleImageURL: true },
              },
              reviewedBy: {
                select: { id: true, name: true, email: true },
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
                select: { id: true, name: true, email: true, profileImageKey: true, googleImageURL: true },
              },
              nominator: {
                select: { id: true, name: true, email: true, profileImageKey: true, googleImageURL: true },
              },
              reviewedBy: {
                select: { id: true, name: true, email: true },
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
  stage: ElectionApprovalStage
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
              position: { title: { in: ["President", SE_ADMIN_POSITION_TITLE] } },
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
        (officer) => officer.position.title === "President"
      )
    )
    .map((approval) => approval.userId);
  const seAdminApprovers = approvals
    .filter((approval) =>
      approval.user.officers.some(
        (officer) => officer.position.title === SE_ADMIN_POSITION_TITLE
      )
    )
    .map((approval) => approval.userId);

  return presidentApprovers.some((presidentId) =>
    seAdminApprovers.some((adminId) => adminId !== presidentId)
  );
}

type TallyCandidate = Pick<ElectionNomination, "id" | "nomineeUserId"> & {
  nominee: { id: number; name: string; email: string };
};

type TallyBallot = {
  rankings: { nominationId: number; rank: number }[];
};

function deriveRank(ballot: TallyBallot, nominationId: number, fallbackRank: number) {
  const explicit = ballot.rankings.find((ranking) => ranking.nominationId === nominationId);
  return explicit?.rank ?? fallbackRank;
}

function rankScores(
  tiedCandidates: TallyCandidate[],
  ballots: TallyBallot[],
  officeCandidateCount: number
) {
  return tiedCandidates.map((candidate) => {
    const ranks = ballots.map((ballot) =>
      deriveRank(ballot, candidate.id, officeCandidateCount)
    );
    const total = ranks.reduce((sum, rank) => sum + rank, 0);
    const average = ballots.length > 0 ? total / ballots.length : officeCandidateCount;
    return { candidate, total, average };
  });
}

function chooseBestCandidate(
  tiedCandidates: TallyCandidate[],
  ballots: TallyBallot[],
  officeCandidateCount: number
) {
  const scores = rankScores(tiedCandidates, ballots, officeCandidateCount).sort(
    (a, b) => a.total - b.total || a.average - b.average
  );
  if (scores.length < 2) return { resolved: true, candidate: scores[0]?.candidate ?? null };
  const [first, second] = scores;
  if (!first) return { resolved: false, candidate: null };
  if (second && first.total === second.total && first.average === second.average) {
    return { resolved: false, candidate: null };
  }
  return { resolved: true, candidate: first.candidate };
}

function chooseWorstCandidate(
  tiedCandidates: TallyCandidate[],
  ballots: TallyBallot[],
  officeCandidateCount: number
) {
  const scores = rankScores(tiedCandidates, ballots, officeCandidateCount).sort(
    (a, b) => b.total - a.total || b.average - a.average
  );
  if (scores.length < 2) return { resolved: true, candidate: scores[0]?.candidate ?? null };
  const [first, second] = scores;
  if (!first) return { resolved: false, candidate: null };
  if (second && first.total === second.total && first.average === second.average) {
    return { resolved: false, candidate: null };
  }
  return { resolved: true, candidate: first.candidate };
}

function getTopRemainingChoice(
  ballot: TallyBallot,
  remainingIds: Set<number>
) {
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
      nomination.eligibilityStatus === ElectionEligibilityStatus.APPROVED
  );

  if (eligibleNominations.length === 0) {
    return {
      officeId: params.office.id,
      officeTitle: params.office.officerPosition.title,
      status: "no_candidates" as const,
      winner: null,
      runnerUp: null,
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

  const remaining = new Set<number>(eligibleNominations.map((nomination) => nomination.id));
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
        lowest.some((entry) => entry.nominationId === nomination.id)
      );
      const tieBreak = chooseWorstCandidate(
        tiedCandidates.map((nomination) => ({
          id: nomination.id,
          nomineeUserId: nomination.nomineeUserId,
          nominee: nomination.nominee,
        })),
        officeBallots,
        eligibleNominations.length
      );

      if (!tieBreak.resolved || !tieBreak.candidate) {
        return {
          officeId: params.office.id,
          officeTitle: params.office.officerPosition.title,
          status: "tie" as const,
          winner: null,
          runnerUp: null,
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
      rounds,
    };
  }

  const winner = eligibleNominations.find((nomination) => nomination.id === winnerId) ?? null;
  let runnerUp =
    eligibleNominations.find(
      (nomination) => nomination.id === eliminationOrder[eliminationOrder.length - 1]
    ) ?? null;

  if (!runnerUp && eligibleNominations.length === 2) {
    runnerUp =
      eligibleNominations.find((nomination) => nomination.id !== winnerId) ?? null;
  }

  return {
    officeId: params.office.id,
    officeTitle: params.office.officerPosition.title,
    status: "ok" as const,
    winner,
    runnerUp,
    rounds,
  };
}

export function shouldUsePresidentOnlyBallot(
  election: {
    offices: Array<{
      officerPosition: { title: string };
      nominations: ElectionNomination[];
    }>;
  }
) {
  const presidentOffice = election.offices.find(
    (office) => office.officerPosition.title === "President"
  );
  const vicePresidentOffice = election.offices.find(
    (office) => office.officerPosition.title === "Vice President"
  );
  if (!presidentOffice || !vicePresidentOffice) return false;

  const presidentNominees = presidentOffice.nominations
    .filter(
      (nomination) =>
        nomination.status === ElectionNominationStatus.ACCEPTED &&
        nomination.eligibilityStatus === ElectionEligibilityStatus.APPROVED
    )
    .map((nomination) => nomination.nomineeUserId)
    .sort((a, b) => a - b);
  const vicePresidentNominees = vicePresidentOffice.nominations
    .filter(
      (nomination) =>
        nomination.status === ElectionNominationStatus.ACCEPTED &&
        nomination.eligibilityStatus === ElectionEligibilityStatus.APPROVED
    )
    .map((nomination) => nomination.nomineeUserId)
    .sort((a, b) => a - b);

  return (
    presidentNominees.length > 0 &&
    presidentNominees.length === vicePresidentNominees.length &&
    presidentNominees.every((nomineeId, index) => nomineeId === vicePresidentNominees[index])
  );
}

export async function tallyElectionResults(electionId: number) {
  const election = await getElectionWithRelations({ id: electionId });
  if (!election) return null;

  const presidentOnlyBallot = shouldUsePresidentOnlyBallot(election);
  const results: Array<any> = election.offices
    .filter(
      (office) =>
        !(presidentOnlyBallot && office.officerPosition.title === "Vice President")
    )
    .map((office) =>
      tallyInstantRunoffElection({
        office,
        ballots: election.ballots.map((ballot) => ({
          rankings: ballot.rankings.map((ranking) => ({
            electionOfficeId: ranking.electionOfficeId,
            nominationId: ranking.nominationId,
            rank: ranking.rank,
          })),
        })),
      })
    );

  if (presidentOnlyBallot) {
    const presidentResult = results.find((result) => result.officeTitle === "President");
    const vicePresidentOffice = election.offices.find(
      (office) => office.officerPosition.title === "Vice President"
    );
    if (presidentResult && vicePresidentOffice) {
      results.push({
        officeId: vicePresidentOffice.id,
        officeTitle: "Vice President",
        status: presidentResult.status,
        winner: presidentResult.runnerUp,
        runnerUp: null,
        rounds: presidentResult.rounds,
      });
    }
  }

  return {
    electionId: election.id,
    electionTitle: election.title,
    presidentOnlyBallot,
    results,
    unresolvedTie: results.some((result) => result.status === "tie"),
  };
}

export async function certifyElection(electionId: number, certifiedById: number) {
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

      const office = election.offices.find((item) => item.id === result.officeId);
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
  nextStatus: ElectionStatus
) {
  const transitions: Record<ElectionStatus, ElectionStatus[]> = {
    [ElectionStatus.DRAFT]: [ElectionStatus.NOMINATIONS_OPEN, ElectionStatus.CANCELLED],
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
    throw new Error("Only primary officer positions can be included in elections.");
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
        record.googleImageURL as string | undefined | null
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
