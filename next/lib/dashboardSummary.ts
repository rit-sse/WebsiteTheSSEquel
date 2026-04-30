import prisma from "@/lib/prisma";
import { getPhotoImageUrl } from "@/lib/photos";
import type { DashboardSectionId } from "@/lib/dashboardSections";

/**
 * Per-section summary payloads rendered inside the Officer Dashboard cards.
 *
 * Each shape is intentionally tiny — the previews only need a couple of
 * counts and 2–3 sample rows so the visit cost stays cheap on first paint.
 * All queries run in parallel inside `getDashboardSummary()`.
 */
export type PurchasingSummary = {
  pendingCount: number;
  totalCount: number;
  recent: { id: number; description: string; status: string }[];
};

export type AttendanceSummary = {
  recent: { id: string; title: string; attendeeCount: number }[];
};

export type MentoringSummary = {
  activeMentorCount: number;
  scheduleBlockCount: number;
};

export type TechCommitteeSummary = {
  pendingCount: number;
  totalCount: number;
};

export type PositionsSummary = {
  activeOfficerCount: number;
  fillablePositionCount: number;
  vacantPositionCount: number;
};

export type UsersSummary = {
  totalUsers: number;
  activeMembers: number;
};

export type SponsorsSummary = {
  activeCount: number;
  recent: { id: number; name: string; logoUrl: string }[];
};

export type AlumniSummary = {
  pendingRequests: number;
  pendingCandidates: number;
};

export type ElectionsSummary = {
  liveCount: number;
  mostRecent: { id: number; title: string; status: string } | null;
};

export type AnnouncementsSummary = {
  activeCount: number;
  mostRecent: { id: number; message: string } | null;
};

export type PhotosSummary = {
  totalCount: number;
  recent: { id: number; url: string; alt: string }[];
};

export type DashboardSummary = {
  purchasing: PurchasingSummary;
  attendance: AttendanceSummary;
  mentoring: MentoringSummary;
  "tech-committee": TechCommitteeSummary;
  positions: PositionsSummary;
  users: UsersSummary;
  sponsors: SponsorsSummary;
  alumni: AlumniSummary;
  elections: ElectionsSummary;
  announcements: AnnouncementsSummary;
  photos: PhotosSummary;
};

export type DashboardSectionSummary<Id extends DashboardSectionId> =
  DashboardSummary[Id];

/**
 * Resolve every per-section summary block in a single fan-out. Designed to be
 * called from the dashboard page's server component — every query is a `count`
 * or a `take: 3 / take: 1` lookup, so the total round-trip stays small even
 * when 10+ queries fire at once.
 *
 * Failures in any individual section degrade gracefully: that slice falls back
 * to its empty/zero default and the rest of the dashboard still renders.
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const settle = async <T,>(promise: Promise<T>, fallback: T): Promise<T> => {
    try {
      return await promise;
    } catch (error) {
      console.error("[dashboardSummary] section query failed:", error);
      return fallback;
    }
  };

  const [
    purchasing,
    attendance,
    mentoring,
    techCommittee,
    positions,
    users,
    sponsors,
    alumni,
    elections,
    announcements,
    photos,
  ] = await Promise.all([
    settle(getPurchasingSummary(), {
      pendingCount: 0,
      totalCount: 0,
      recent: [],
    } as PurchasingSummary),
    settle(getAttendanceSummary(), { recent: [] } as AttendanceSummary),
    settle(getMentoringSummary(), {
      activeMentorCount: 0,
      scheduleBlockCount: 0,
    } as MentoringSummary),
    settle(getTechCommitteeSummary(), {
      pendingCount: 0,
      totalCount: 0,
    } as TechCommitteeSummary),
    settle(getPositionsSummary(), {
      activeOfficerCount: 0,
      fillablePositionCount: 0,
      vacantPositionCount: 0,
    } as PositionsSummary),
    settle(getUsersSummary(), {
      totalUsers: 0,
      activeMembers: 0,
    } as UsersSummary),
    settle(getSponsorsSummary(), {
      activeCount: 0,
      recent: [],
    } as SponsorsSummary),
    settle(getAlumniSummary(), {
      pendingRequests: 0,
      pendingCandidates: 0,
    } as AlumniSummary),
    settle(getElectionsSummary(), {
      liveCount: 0,
      mostRecent: null,
    } as ElectionsSummary),
    settle(getAnnouncementsSummary(), {
      activeCount: 0,
      mostRecent: null,
    } as AnnouncementsSummary),
    settle(getPhotosSummary(), {
      totalCount: 0,
      recent: [],
    } as PhotosSummary),
  ]);

  return {
    purchasing,
    attendance,
    mentoring,
    "tech-committee": techCommittee,
    positions,
    users,
    sponsors,
    alumni,
    elections,
    announcements,
    photos,
  };
}

async function getPurchasingSummary(): Promise<PurchasingSummary> {
  const [pendingCount, totalCount, recent] = await Promise.all([
    prisma.purchaseRequest.count({ where: { status: "pending" } }),
    prisma.purchaseRequest.count(),
    prisma.purchaseRequest.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
      select: { id: true, description: true, status: true },
    }),
  ]);
  return { pendingCount, totalCount, recent };
}

async function getAttendanceSummary(): Promise<AttendanceSummary> {
  const events = await prisma.event.findMany({
    take: 3,
    where: { attendanceEnabled: true },
    orderBy: { date: "desc" },
    select: {
      id: true,
      title: true,
      _count: { select: { attendees: true } },
    },
  });
  return {
    recent: events.map((e) => ({
      id: e.id,
      title: e.title,
      attendeeCount: e._count.attendees,
    })),
  };
}

async function getMentoringSummary(): Promise<MentoringSummary> {
  const [activeMentorCount, scheduleBlockCount] = await Promise.all([
    prisma.mentor.count({ where: { isActive: true } }),
    prisma.scheduleBlock.count(),
  ]);
  return { activeMentorCount, scheduleBlockCount };
}

async function getTechCommitteeSummary(): Promise<TechCommitteeSummary> {
  const [pendingCount, totalCount] = await Promise.all([
    prisma.techCommitteeApplication.count({ where: { status: "PENDING" } }),
    prisma.techCommitteeApplication.count(),
  ]);
  return { pendingCount, totalCount };
}

async function getPositionsSummary(): Promise<PositionsSummary> {
  const [activeOfficerCount, fillablePositionCount, filledPositions] =
    await Promise.all([
      prisma.officer.count({ where: { is_active: true } }),
      prisma.officerPosition.count({ where: { is_defunct: false } }),
      prisma.officer.findMany({
        where: { is_active: true },
        select: { position_id: true },
        distinct: ["position_id"],
      }),
    ]);
  const filledPositionCount = filledPositions.length;
  return {
    activeOfficerCount,
    fillablePositionCount,
    vacantPositionCount: Math.max(
      0,
      fillablePositionCount - filledPositionCount
    ),
  };
}

async function getUsersSummary(): Promise<UsersSummary> {
  const [totalUsers, activeMemberRows] = await Promise.all([
    prisma.user.count(),
    // "Active members" = users with at least one membership row. Cheap to
    // count via groupBy on userId rather than scanning every memberships row.
    prisma.memberships.findMany({
      select: { userId: true },
      distinct: ["userId"],
    }),
  ]);
  return {
    totalUsers,
    activeMembers: activeMemberRows.length,
  };
}

async function getSponsorsSummary(): Promise<SponsorsSummary> {
  const [activeCount, recent] = await Promise.all([
    prisma.sponsor.count({ where: { isActive: true } }),
    prisma.sponsor.findMany({
      take: 3,
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, logoUrl: true },
    }),
  ]);
  return { activeCount, recent };
}

async function getAlumniSummary(): Promise<AlumniSummary> {
  const [pendingRequests, pendingCandidates] = await Promise.all([
    prisma.alumniRequest.count({ where: { status: "pending" } }),
    prisma.alumniCandidate.count({ where: { status: "pending" } }),
  ]);
  return { pendingRequests, pendingCandidates };
}

async function getElectionsSummary(): Promise<ElectionsSummary> {
  const [liveCount, mostRecent] = await Promise.all([
    // "Live" elections are anything past DRAFT and not yet certified or
    // cancelled — i.e. an election cycle a primary officer should be
    // shepherding right now.
    prisma.election.count({
      where: {
        status: {
          in: [
            "NOMINATIONS_OPEN",
            "NOMINATIONS_CLOSED",
            "VOTING_OPEN",
            "VOTING_CLOSED",
            "TIE_RUNOFF_REQUIRED",
          ],
        },
      },
    }),
    prisma.election.findFirst({
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, status: true },
    }),
  ]);
  return {
    liveCount,
    mostRecent: mostRecent
      ? {
          id: mostRecent.id,
          title: mostRecent.title,
          status: String(mostRecent.status),
        }
      : null,
  };
}

async function getAnnouncementsSummary(): Promise<AnnouncementsSummary> {
  const [activeCount, mostRecent] = await Promise.all([
    prisma.announcement.count({ where: { active: true } }),
    prisma.announcement.findFirst({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, message: true },
    }),
  ]);
  return { activeCount, mostRecent };
}

async function getPhotosSummary(): Promise<PhotosSummary> {
  const [totalCount, recent] = await Promise.all([
    prisma.photo.count({ where: { status: "published" } }),
    prisma.photo.findMany({
      take: 3,
      where: { status: "published" },
      orderBy: [{ sortDate: "desc" }, { id: "desc" }],
      select: { id: true, galleryKey: true, altText: true, caption: true },
    }),
  ]);
  return {
    totalCount,
    recent: recent.map((p) => ({
      id: p.id,
      url: getPhotoImageUrl(p.galleryKey),
      alt: p.altText ?? p.caption ?? "Recent photo",
    })),
  };
}
