import prisma from "@/lib/prisma";
import {
  getAcademicTermDateRange,
  getCurrentAcademicTerm,
  type AcademicTerm,
} from "@/lib/academicTerm";

function getPreviousAcademicTerm(
  term: AcademicTerm,
  year: number
): { term: AcademicTerm; year: number } {
  if (term === "SPRING") {
    return { term: "FALL", year: year - 1 };
  }
  if (term === "SUMMER") {
    return { term: "SPRING", year };
  }
  return { term: "SUMMER", year };
}

function getElectionEligibilityRanges(atDate = new Date()) {
  const current = getCurrentAcademicTerm(atDate);
  const currentRange = getAcademicTermDateRange(current.term, current.year);
  const millisSinceCurrentTermStart =
    atDate.getTime() - currentRange.startDate.getTime();
  const inGracePeriod = millisSinceCurrentTermStart < 14 * 24 * 60 * 60 * 1000;

  const previous = getPreviousAcademicTerm(current.term, current.year);
  const previousRange = getAcademicTermDateRange(previous.term, previous.year);

  return {
    currentRange,
    previousRange,
    inGracePeriod,
  };
}

function buildMembershipWhere(atDate = new Date()) {
  const { currentRange, previousRange, inGracePeriod } =
    getElectionEligibilityRanges(atDate);

  return {
    OR: [
      {
        dateGiven: {
          gte: currentRange.startDate,
          lte: currentRange.endDate,
        },
      },
      ...(inGracePeriod
        ? [
            {
              dateGiven: {
                gte: previousRange.startDate,
                lte: previousRange.endDate,
              },
            },
          ]
        : []),
    ],
  };
}

export async function isActiveMemberForElection(
  userId: number,
  atDate = new Date()
) {
  const count = await prisma.memberships.count({
    where: {
      userId,
      ...buildMembershipWhere(atDate),
    },
  });

  return count > 0;
}

export async function listEligibleElectionVoters(atDate = new Date()) {
  return prisma.user.findMany({
    where: {
      Memberships: {
        some: buildMembershipWhere(atDate),
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { name: "asc" },
  });
}

