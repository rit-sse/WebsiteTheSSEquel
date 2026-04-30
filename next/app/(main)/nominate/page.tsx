import prisma from "@/lib/prisma";
import { getAuthLevel } from "@/lib/services/authLevelService";
import {
  getActiveElectionWithAutoKickoff,
  PRIMARY_OFFICER_TITLES,
  TICKET_DERIVED_OFFICE_TITLES,
} from "@/lib/elections";
import { isActiveMemberForElection } from "@/lib/electionEligibility";
import { resolveUserImage } from "@/lib/s3Utils";
import {
  formatAcademicTerm,
  getNextSemester,
} from "@/lib/academicTerm";
import { ElectionStatus } from "@prisma/client";
import NominateClient from "./NominateClient";
import type { NominateData } from "./types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Nominate · SSE",
  description:
    "Nominate the next Society of Software Engineers officers. Public nomination form for SSE primary officer elections.",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  President:
    "Leads the society, presides over meetings, and represents SSE to the school and outside world.",
  "Vice President":
    "Runs on the President's ticket. Steps in when the President is away and shares the workload year-round.",
  Secretary:
    "Keeps the minutes, tracks attendance and memberships, runs elections paperwork.",
  Treasurer:
    "Owns the budget, the SG account, and every dollar SSE spends, raises, or sponsors.",
  "Mentoring Head":
    "Recruits and schedules mentors for the SSE lab. Trains them and keeps the lab humming.",
};

export default async function NominatePage() {
  const authLevel = await getAuthLevel();
  const activeElection = await getActiveElectionWithAutoKickoff();

  // Pull active officers (incumbents) for any of the primary-officer
  // titles, plus all PRIMARY_OFFICER positions that aren't defunct —
  // used both for the office picker and the role manifest.
  const positions = await prisma.officerPosition.findMany({
    where: {
      category: "PRIMARY_OFFICER",
      is_defunct: false,
      title: { in: [...PRIMARY_OFFICER_TITLES] },
    },
    select: {
      id: true,
      title: true,
      officers: {
        where: { is_active: true },
        select: {
          user: {
            select: {
              id: true,
              name: true,
              profileImageKey: true,
              googleImageURL: true,
            },
          },
        },
        take: 1,
      },
    },
  });

  const ticketDerived = new Set<string>(TICKET_DERIVED_OFFICE_TITLES);

  const incumbents = Object.fromEntries(
    positions.map((p) => {
      const o = p.officers[0];
      return [
        p.title,
        o
          ? {
              id: o.user.id,
              name: o.user.name,
              image: resolveUserImage(
                o.user.profileImageKey,
                o.user.googleImageURL
              ),
            }
          : null,
      ];
    })
  );

  const roleManifest = PRIMARY_OFFICER_TITLES.map((title) => ({
    title,
    description: ROLE_DESCRIPTIONS[title] ?? "",
    incumbent: incumbents[title] ?? null,
    onBallot: !ticketDerived.has(title),
  }));

  // If the system has an active election, fetch its offices so we can
  // populate the position picker. Filter out SE_OFFICE positions and
  // ticket-derived (Vice President) — Vice President is selected as a
  // running mate, not nominated directly.
  let openElection: NominateData["openElection"] = null;
  let viewerCanNominate = false;

  if (activeElection && activeElection.status === ElectionStatus.NOMINATIONS_OPEN) {
    const fullElection = await prisma.election.findUnique({
      where: { id: activeElection.id },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        nominationsOpenAt: true,
        nominationsCloseAt: true,
        votingOpenAt: true,
        votingCloseAt: true,
        offices: {
          select: {
            id: true,
            officerPosition: {
              select: {
                id: true,
                title: true,
                category: true,
                is_defunct: true,
              },
            },
          },
        },
      },
    });

    if (fullElection) {
      const offices = fullElection.offices
        .filter(
          (o) =>
            o.officerPosition.category === "PRIMARY_OFFICER" &&
            !o.officerPosition.is_defunct &&
            !ticketDerived.has(o.officerPosition.title)
        )
        .map((o) => ({
          id: o.id,
          title: o.officerPosition.title,
          description: ROLE_DESCRIPTIONS[o.officerPosition.title] ?? "",
          incumbent: incumbents[o.officerPosition.title] ?? null,
        }));

      openElection = {
        id: fullElection.id,
        title: fullElection.title,
        slug: fullElection.slug,
        nominationsOpenAt: fullElection.nominationsOpenAt.toISOString(),
        nominationsCloseAt: fullElection.nominationsCloseAt.toISOString(),
        votingOpenAt: fullElection.votingOpenAt.toISOString(),
        votingCloseAt: fullElection.votingCloseAt.toISOString(),
        offices,
      };

      if (authLevel.userId) {
        viewerCanNominate = await isActiveMemberForElection(authLevel.userId);
      }
    }
  }

  // The waiting state surfaces the next academic term so the headline
  // reads "RESUMES SPRING 2026" rather than a generic "TBD".
  const nextSemester = getNextSemester();
  const nextSemesterLabel = formatAcademicTerm(
    nextSemester.term,
    nextSemester.year
  );

  let viewer: NominateData["viewer"] = null;
  if (authLevel.userId) {
    const u = await prisma.user.findUnique({
      where: { id: authLevel.userId },
      select: {
        id: true,
        name: true,
        email: true,
        major: true,
        profileImageKey: true,
        googleImageURL: true,
      },
    });
    if (u) {
      viewer = {
        id: u.id,
        name: u.name,
        email: u.email,
        major: u.major,
        image: resolveUserImage(u.profileImageKey, u.googleImageURL),
      };
    }
  }

  const data: NominateData = {
    openElection,
    viewer,
    viewerCanNominate,
    isMember: authLevel.isMember,
    isOfficer: authLevel.isOfficer,
    nextSemesterLabel,
    roleManifest,
  };

  return <NominateClient data={data} />;
}
