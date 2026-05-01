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
    description: "Run for or nominate a committee head.",
  },
  {
    title: "Tech Committee",
    href: "/tech-committee/apply",
    description: "Apply to build SSE's tech.",
  },
  {
    title: "Mentor",
    href: "/mentoring/apply",
    description: "Sign up to mentor other students.",
  },
  {
    title: "Get Involved",
    href: "/about/get-involved",
    description: "Discover ways to join SSE.",
  },
  {
    title: "Constitution",
    href: "/about/constitution",
    description: "Read SSE's governing document.",
  },
  {
    title: "Primary Policy",
    href: "/about/primary-officers-policy",
    description: "Rules for primary officers.",
  },
  {
    title: "Projects",
    href: "/projects",
    description: "Browse ongoing student projects.",
  },
  {
    title: "Events",
    href: "/events/calendar",
    description: "See upcoming meetings and socials.",
  },
  {
    title: "Membership Leaderboard",
    href: "/memberships",
    description: "Track active member standings.",
  },
  {
    title: "Mentor Schedule",
    href: "/mentoring/schedule",
    description: "Find a mentor's office hours.",
  },
  {
    title: "Library",
    href: "/library",
    description: "Borrow books and learning resources.",
  },
];

const alumniItems: NavItem[] = [
  {
    title: "Alumni Directory",
    href: "/about/alumni",
    description: "Connect with SSE graduates.",
  },
  {
    title: "Speak at SSE",
    href: "/sponsors#vise",
    description: "Give a ViSE industry talk.",
  },
];

const companiesItems: NavItem[] = [
  {
    title: "Sponsor SSE",
    href: "/sponsors#sponsor",
    description: "Become an SSE sponsor.",
  },
  {
    title: "Recruit Students",
    href: "/sponsors#recruit",
    description: "Hire from our student body.",
  },
];

const seOfficeItems: NavItem[] = [
  {
    title: "Leadership",
    href: "/about/leadership",
    description: "Meet the officers and heads.",
  },
  {
    title: "Committees",
    href: "/about/committees",
    description: "Learn about each committee.",
  },
  {
    title: "Constitution",
    href: "/about/constitution",
    description: "Read SSE's governing document.",
  },
  {
    title: "Primary Policy",
    href: "/about/primary-officers-policy",
    description: "Rules for primary officers.",
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
    description: "Cast your vote or nominate a peer.",
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
