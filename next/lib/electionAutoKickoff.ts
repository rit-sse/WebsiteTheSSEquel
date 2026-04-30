import prisma from "@/lib/prisma";
import { ElectionStatus } from "@prisma/client";
import {
  getCurrentAcademicTerm,
  getAcademicTermFromDate,
  formatAcademicTerm,
  type TermYear,
} from "@/lib/academicTerm";
import {
  PRIMARY_OFFICER_TITLES,
  TICKET_DERIVED_OFFICE_TITLES,
} from "@/lib/elections";

/**
 * Statuses that count as "an election is currently in flight" — if any
 * exists, the auto-kickoff is a no-op. DRAFT counts because admins use
 * draft rows as a staging area; we don't want auto-creation to clobber
 * an admin's work in progress. CANCELLED and CERTIFIED do NOT count —
 * they're terminal.
 */
const IN_FLIGHT_STATUSES: ElectionStatus[] = [
  ElectionStatus.DRAFT,
  ElectionStatus.NOMINATIONS_OPEN,
  ElectionStatus.NOMINATIONS_CLOSED,
  ElectionStatus.VOTING_OPEN,
  ElectionStatus.VOTING_CLOSED,
  ElectionStatus.TIE_RUNOFF_REQUIRED,
];

/**
 * Office titles that should be created as ElectionOffice rows for an
 * auto-kicked-off election. Pulled from the canonical PRIMARY_OFFICER_TITLES
 * list, with ticket-derived titles (Vice President — chosen as a running
 * mate, not on the ballot) excluded.
 */
function getAutoKickoffOfficeTitles(): readonly string[] {
  const ticketDerived = new Set<string>(TICKET_DERIVED_OFFICE_TITLES);
  return PRIMARY_OFFICER_TITLES.filter((t) => !ticketDerived.has(t));
}

function sameTerm(a: TermYear, b: TermYear): boolean {
  return a.term === b.term && a.year === b.year;
}

/**
 * Decide whether the system should auto-create a new primary officer
 * election. Returns true when:
 *   - No election is currently in flight (DRAFT / NOMINATIONS_* / VOTING_* /
 *     TIE_RUNOFF_REQUIRED), AND
 *   - The most recent CERTIFIED election was for a different academic
 *     term than the current one (i.e. a new semester has begun since
 *     the last cycle was certified), OR there has never been a
 *     certified election at all (bootstrap).
 *
 * The term of a past election is derived from `nominationsCloseAt`
 * (the date the cycle was sealed), passed through
 * `getAcademicTermFromDate` so it ties to the canonical academic
 * calendar config in `lib/academicTerm.ts`.
 */
export async function shouldKickoffNewElection(
  atDate: Date = new Date()
): Promise<boolean> {
  const inFlight = await prisma.election.count({
    where: { status: { in: IN_FLIGHT_STATUSES } },
  });
  if (inFlight > 0) return false;

  const lastCertified = await prisma.election.findFirst({
    where: { status: ElectionStatus.CERTIFIED },
    orderBy: { nominationsCloseAt: "desc" },
    select: { nominationsCloseAt: true, certifiedAt: true },
  });

  if (!lastCertified) {
    // Bootstrap: no certified history. Allow auto-creation so a fresh
    // install isn't stuck waiting for a manual admin click. Production
    // deployments will already have certified history before reaching
    // this branch.
    return true;
  }

  const reference = lastCertified.certifiedAt ?? lastCertified.nominationsCloseAt;
  const certifiedTerm = {
    term: getAcademicTermFromDate(reference),
    year: reference.getFullYear(),
  };
  const currentTerm = getCurrentAcademicTerm(atDate);
  return !sameTerm(certifiedTerm, currentTerm);
}

/**
 * Pick a User row to attribute auto-kickoff creation to. The
 * `Election.createdById` foreign key is non-nullable, so we need a
 * concrete user. Preference order:
 *   1. Currently active President — the conventional kickoff role.
 *   2. Any active SE Office holder — they administer elections.
 *   3. Most recent past `Election.certifiedById` — at least someone
 *      historically associated with this responsibility.
 *
 * Returns null if none of those exist (very-fresh-install case), in
 * which case the caller should fall back to manual creation.
 */
async function pickKickoffActor(): Promise<number | null> {
  const president = await prisma.officer.findFirst({
    where: {
      is_active: true,
      position: { title: "President" },
    },
    select: { user_id: true },
  });
  if (president) return president.user_id;

  const seOfficeHolder = await prisma.officer.findFirst({
    where: {
      is_active: true,
      position: { category: "SE_OFFICE" },
    },
    select: { user_id: true },
  });
  if (seOfficeHolder) return seOfficeHolder.user_id;

  const lastCertifier = await prisma.election.findFirst({
    where: { certifiedById: { not: null } },
    orderBy: { certifiedAt: "desc" },
    select: { certifiedById: true },
  });
  return lastCertifier?.certifiedById ?? null;
}

function buildSlug(term: TermYear): string {
  return `${term.term.toLowerCase()}-${term.year}-primary`;
}

async function uniqueSlug(base: string): Promise<string> {
  let candidate = base;
  let suffix = 1;
  while (
    await prisma.election.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
  ) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export interface KickoffResult {
  created: boolean;
  electionId?: number;
  electionSlug?: string;
  reason?: string;
}

/**
 * Idempotently create a new NOMINATIONS_OPEN primary officer election
 * for the current academic term, plus the standard set of
 * ElectionOffice rows. No-op when an in-flight election already exists
 * or when the most recent CERTIFIED election is for the current term.
 *
 * Default windows (overridable):
 *   - Nominations: now → +14 days
 *   - Voting:      +16 days → +23 days
 * (>= 48 hour gap between nominations close and voting open per
 *  `validateElectionWindow` in `lib/elections.ts`.)
 */
export async function kickoffElectionForCurrentTerm(
  options: {
    atDate?: Date;
    nominationsDays?: number;
    breakDays?: number;
    votingDays?: number;
  } = {}
): Promise<KickoffResult> {
  const atDate = options.atDate ?? new Date();
  const nominationsDays = options.nominationsDays ?? 14;
  const breakDays = options.breakDays ?? 2;
  const votingDays = options.votingDays ?? 7;

  if (!(await shouldKickoffNewElection(atDate))) {
    return { created: false, reason: "An election is already in progress for this term." };
  }

  const actorId = await pickKickoffActor();
  if (actorId == null) {
    return {
      created: false,
      reason: "No eligible kickoff actor found (no active President, SE Office holder, or past certifier).",
    };
  }

  const term = getCurrentAcademicTerm(atDate);
  const title = `${formatAcademicTerm(term.term, term.year)} Primary Officer Election`;
  const slug = await uniqueSlug(buildSlug(term));

  const day = 24 * 60 * 60 * 1000;
  const nominationsOpenAt = new Date(atDate);
  const nominationsCloseAt = new Date(atDate.getTime() + nominationsDays * day);
  const votingOpenAt = new Date(
    nominationsCloseAt.getTime() + breakDays * day
  );
  const votingCloseAt = new Date(votingOpenAt.getTime() + votingDays * day);

  const officeTitles = getAutoKickoffOfficeTitles();
  const positions = await prisma.officerPosition.findMany({
    where: {
      title: { in: [...officeTitles] },
      category: "PRIMARY_OFFICER",
      is_defunct: false,
    },
    select: { id: true, title: true },
  });

  if (positions.length === 0) {
    return {
      created: false,
      reason: "No matching primary officer positions configured.",
    };
  }

  const election = await prisma.$transaction(async (tx) => {
    const created = await tx.election.create({
      data: {
        title,
        slug,
        description: `Auto-created at the start of ${formatAcademicTerm(
          term.term,
          term.year
        )}.`,
        status: ElectionStatus.NOMINATIONS_OPEN,
        nominationsOpenAt,
        nominationsCloseAt,
        votingOpenAt,
        votingCloseAt,
        createdById: actorId,
      },
      select: { id: true, slug: true },
    });

    await tx.electionOffice.createMany({
      data: positions.map((p) => ({
        electionId: created.id,
        officerPositionId: p.id,
      })),
      skipDuplicates: true,
    });

    return created;
  });

  return { created: true, electionId: election.id, electionSlug: election.slug };
}
