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
  align?: "start" | "end";
};

const PUBLIC_ELECTION_STATUSES = new Set(["NOMINATIONS_OPEN", "VOTING_OPEN"]);

const studentsItems: NavItem[] = [
  {
    title: "Become a Committee Head",
    href: "/nominate",
    description: "Apply for or nominate someone for a Committee Head role.",
  },
  {
    title: "Become a Tech Committee Member",
    href: "/tech-committee/apply",
    description: "Apply to contribute to SSE's internal technology work.",
  },
  {
    title: "Become a Mentor",
    href: "/mentoring/apply",
    description: "Apply to help fellow students in the SSE lab.",
  },
  {
    title: "Get Involved",
    href: "/about/get-involved",
    description: "Discover ways to participate and contribute to SSE.",
  },
  {
    title: "Constitution",
    href: "/about/constitution",
    description: "Read SSE's governing document and bylaws.",
  },
  {
    title: "Primary Officer's Policy",
    href: "/about/primary-officers-policy",
    description: "Read the policy governing SSE primary officers.",
  },
  {
    title: "Projects",
    href: "/projects",
    description: "Browse student projects built by the SSE community.",
  },
  {
    title: "Events",
    href: "/events/calendar",
    description: "Upcoming SSE meetings, workshops, and socials.",
  },
  {
    title: "Membership Leaderboard",
    href: "/memberships",
    description: "See who's on track to earn membership this term.",
  },
  {
    title: "Mentor Schedule",
    href: "/mentoring/schedule",
    description: "See when mentors are available in the lab.",
  },
  {
    title: "Library",
    href: "/library",
    description: "Browse books and resources available through SSE.",
  },
];

const alumniItems: NavItem[] = [
  {
    title: "Alumni Directory",
    href: "/about/alumni",
    description: "Stay connected with SSE graduates and their stories.",
  },
  {
    title: "Speak at SSE",
    href: "/sponsors#vise",
    description: "Pitch a ViSE talk and share your career or research.",
  },
];

const companiesItems: NavItem[] = [
  {
    title: "Sponsor SSE",
    href: "/sponsors#sponsor",
    description: "Back the lab and gain visibility with our members.",
  },
  {
    title: "Recruit Students",
    href: "/sponsors#recruit",
    description: "Schedule a recruiting talk and meet our engineers.",
  },
];

const seOfficeItems: NavItem[] = [
  {
    title: "Leadership",
    href: "/about/leadership",
    description: "Current officers, SE Office staff, and committee heads.",
  },
  {
    title: "Committees",
    href: "/about/committees",
    description: "Specialized committees and the work they do.",
  },
  {
    title: "Constitution",
    href: "/about/constitution",
    description: "Our governing document and bylaws.",
  },
  {
    title: "Primary Officer's Policy",
    href: "/about/primary-officers-policy",
    description: "Officer guidelines and policies.",
  },
];

function getPublicElectionItem(
  activeElection?: Pick<ActiveElectionSummary, "slug" | "status"> | null
): NavItem | null {
  if (!activeElection || !PUBLIC_ELECTION_STATUSES.has(activeElection.status)) {
    return null;
  }
  return {
    title: "Elections",
    href: `/elections/${activeElection.slug}`,
    description: "Participate in the active SSE election.",
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
    { value: "companies", label: "Companies", items: companiesItems },
  ];

  if (isSeAdmin) {
    groups.push({
      value: "se-office",
      label: "SE Office",
      items: seOfficeItems,
      align: "end",
    });
  }

  return groups;
}
