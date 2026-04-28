import prisma from "@/lib/prisma";
import type { ActiveElectionSummary } from "@/lib/elections";
import type { ElectionStatus } from "@prisma/client";

export type SiteBanner = {
  id: string;
  kind: "announcement" | "election";
  message: string;
  category?: string | null;
  href?: string;
  priority: number;
  dismissible: boolean;
  electionStatus?: ElectionStatus;
};

const ELECTION_BANNER_COPY: Partial<Record<ElectionStatus, string>> = {
  NOMINATIONS_OPEN: "Nominations are open",
  NOMINATIONS_CLOSED: "Nominations closed - voting begins soon",
  VOTING_OPEN: "Voting is open",
  VOTING_CLOSED: "Voting has closed - results pending",
};

export async function getSiteBanners(
  activeElection: ActiveElectionSummary | null
): Promise<SiteBanner[]> {
  const manualAnnouncements = await prisma.announcement
    .findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        message: true,
        category: true,
      },
    })
    .catch((error) => {
      console.error("Failed to load announcements:", error);
      return [];
    });

  const electionMessage = activeElection
    ? ELECTION_BANNER_COPY[activeElection.status]
    : null;

  const banners: SiteBanner[] = [
    ...(electionMessage && activeElection
      ? [
          {
            id: `election-${activeElection.id}-${activeElection.status}`,
            kind: "election" as const,
            message: `${electionMessage} - ${activeElection.title}`,
            category: "Election",
            href: `/elections/${activeElection.slug}`,
            priority: 0,
            dismissible: true,
            electionStatus: activeElection.status,
          },
        ]
      : []),
    ...manualAnnouncements.map((announcement) => ({
      id: `announcement-${announcement.id}`,
      kind: "announcement" as const,
      message: announcement.message,
      category: announcement.category,
      priority: 10,
      dismissible: true,
    })),
  ];

  return banners.sort((a, b) => a.priority - b.priority);
}
