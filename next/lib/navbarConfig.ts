import type { ActiveElectionSummary } from "@/lib/elections";

export interface NavItem {
  title: string;
  href: string;
  description: string;
}

export type NavGroup = {
  value: string;
  label: string;
  items: NavItem[];
};

const PUBLIC_ELECTION_STATUSES = new Set(["NOMINATIONS_OPEN", "VOTING_OPEN"]);

const studentsItems: NavItem[] = [
  {
    title: "Committee Head",
    href: "/nominate",
    description: "Apply or nominate.",
  },
  {
    title: "Tech Committee",
    href: "/tech-committee/apply",
    description: "Apply to join.",
  },
  {
    title: "Mentor",
    href: "/mentoring/apply",
    description: "Apply to mentor.",
  },
  {
    title: "Get Involved",
    href: "/about/get-involved",
    description: "Ways to participate.",
  },
  {
    title: "Constitution",
    href: "/about/constitution",
    description: "Governing document.",
  },
  {
    title: "Primary Policy",
    href: "/about/primary-officers-policy",
    description: "Officer rules.",
  },
  {
    title: "Projects",
    href: "/projects",
    description: "Student projects.",
  },
  {
    title: "Events",
    href: "/events/calendar",
    description: "Meetings and socials.",
  },
  {
    title: "Membership Leaderboard",
    href: "/memberships",
    description: "Track membership.",
  },
  {
    title: "Mentor Schedule",
    href: "/mentoring/schedule",
    description: "Mentor availability.",
  },
  {
    title: "Library",
    href: "/library",
    description: "Books and resources.",
  },
];

const alumniItems: NavItem[] = [
  {
    title: "Alumni Directory",
    href: "/about/alumni",
    description: "Graduate stories.",
  },
  {
    title: "Speak at SSE",
    href: "/sponsors#vise",
    description: "Pitch a ViSE talk.",
  },
];

const companiesItems: NavItem[] = [
  {
    title: "Sponsor SSE",
    href: "/sponsors#sponsor",
    description: "Sponsorship info.",
  },
  {
    title: "Recruit Students",
    href: "/sponsors#recruit",
    description: "Recruiting talks.",
  },
];

const seOfficeItems: NavItem[] = [
  {
    title: "Leadership",
    href: "/about/leadership",
    description: "Officers and heads.",
  },
  {
    title: "Committees",
    href: "/about/committees",
    description: "Committee details.",
  },
  {
    title: "Constitution",
    href: "/about/constitution",
    description: "Governing document.",
  },
  {
    title: "Primary Policy",
    href: "/about/primary-officers-policy",
    description: "Officer rules.",
  },
];

function getPublicElectionItem(
  activeElection?: Pick<ActiveElectionSummary, "slug" | "status"> | null,
): NavItem | null {
  if (!activeElection || !PUBLIC_ELECTION_STATUSES.has(activeElection.status)) {
    return null;
  }
  return {
    title: "Elections",
    href: `/elections/${activeElection.slug}`,
    description: "Vote or nominate.",
  };
}

export function buildNavGroups({
  isSeAdmin,
  activeElection,
}: {
  isSeAdmin: boolean;
  activeElection?: Pick<ActiveElectionSummary, "slug" | "status"> | null;
}): NavGroup[] {
  const electionItem = getPublicElectionItem(activeElection);
  const groups: NavGroup[] = [
    {
      value: "students",
      label: "Students",
      items: electionItem ? [electionItem, ...studentsItems] : studentsItems,
    },
    { value: "alumni", label: "Alumni", items: alumniItems },
    {
      value: "companies",
      label: "Companies",
      items: companiesItems,
    },
  ];

  if (isSeAdmin) {
    groups.push({
      value: "se-office",
      label: "SE Office",
      items: seOfficeItems,
    });
  }

  return groups;
}
