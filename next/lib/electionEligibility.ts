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
  // Grace period: for the first 14 days of a new term, still count
  // previous-term memberships so returning members don't get locked out
  // while they re-enroll.
  const current = getCurrentAcademicTerm(atDate);
  const currentRange = getAcademicTermDateRange(current.term, current.year);
  const millisSinceCurrentTermStart =
    atDate.getTime() - currentRange.startDate.getTime();
  const inGracePeriod = millisSinceCurrentTermStart < 14 * 24 * 60 * 60 * 1000;

  return { inGracePeriod };
}

function buildMembershipWhere(atDate = new Date()) {
  // Memberships now carry an explicit `term` + `year` — match on those
  // directly rather than inferring the term from `dateGiven`. This also
  // exercises the new `(term, year)` composite index.
  const { inGracePeriod } = getElectionEligibilityRanges(atDate);
  const current = getCurrentAcademicTerm(atDate);
  const previous = getPreviousAcademicTerm(current.term, current.year);

  const clauses: Array<{ term: AcademicTerm; year: number }> = [
    { term: current.term, year: current.year },
    ...(inGracePeriod
      ? [{ term: previous.term, year: previous.year }]
      : []),
  ];

  return { OR: clauses };
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

