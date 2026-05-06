import type { ActiveElectionSummary } from "@/lib/elections";

export interface NavItem {
  title: string;
  href: string;
  description: string;
}

export type CmsNavSection =
  | "TOP_LEVEL"
  | "STUDENTS"
  | "ALUMNI"
  | "COMPANIES"
  | "SE_OFFICE"
  | "HIDDEN";

export interface CmsNavPage {
  slug: string;
  title: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  showInNav: boolean;
  navSection: CmsNavSection;
  navLabel: string | null;
  navOrder: number;
}

export type NavGroup = {
  value: string;
  label: string;
  items: NavItem[];
};

type NavItemWithOrder = NavItem & {
  order: number;
  slug?: string;
};

const PUBLIC_ELECTION_STATUSES = new Set(["NOMINATIONS_OPEN", "VOTING_OPEN"]);

const topLevelItems: NavItemWithOrder[] = [
  {
    title: "About",
    href: "/about",
    description: "Learn about SSE.",
    order: 100,
    slug: "about",
  },
  {
    title: "Photos",
    href: "/photos",
    description: "Browse community photos.",
    order: 200,
    slug: "photos",
  },
];

const studentsItems: NavItemWithOrder[] = [
  {
    title: "Committee Head",
    href: "/nominate",
    description: "Run for or nominate a committee head.",
    order: 100,
    slug: "nominate",
  },
  {
    title: "Tech Committee",
    href: "/tech-committee/apply",
    description: "Apply to build SSE's tech.",
    order: 200,
    slug: "tech-committee/apply",
  },
  {
    title: "Mentor",
    href: "/mentoring/apply",
    description: "Sign up to mentor other students.",
    order: 300,
    slug: "mentoring/apply",
  },
  {
    title: "Get Involved",
    href: "/about/get-involved",
    description: "Discover ways to join SSE.",
    order: 400,
    slug: "about/get-involved",
  },
  {
    title: "Constitution",
    href: "/about/constitution",
    description: "Read SSE's governing document.",
    order: 500,
    slug: "about/constitution",
  },
  {
    title: "Primary Policy",
    href: "/about/primary-officers-policy",
    description: "Rules for primary officers.",
    order: 600,
    slug: "about/primary-officers-policy",
  },
  {
    title: "Projects",
    href: "/projects",
    description: "Browse ongoing student projects.",
    order: 700,
    slug: "projects",
  },
  {
    title: "Events",
    href: "/events/calendar",
    description: "See upcoming meetings and socials.",
    order: 800,
    slug: "events/calendar",
  },
  {
    title: "Membership Leaderboard",
    href: "/memberships",
    description: "Track active member standings.",
    order: 900,
    slug: "memberships",
  },
  {
    title: "Mentor Schedule",
    href: "/mentoring/schedule",
    description: "Find a mentor's office hours.",
    order: 1000,
    slug: "mentoring/schedule",
  },
  {
    title: "Library",
    href: "/library",
    description: "Borrow books and learning resources.",
    order: 1100,
    slug: "library",
  },
];

const alumniItems: NavItemWithOrder[] = [
  {
    title: "Alumni Directory",
    href: "/about/alumni",
    description: "Connect with SSE graduates.",
    order: 100,
    slug: "about/alumni",
  },
  {
    title: "Speak at SSE",
    href: "/sponsors#vise",
    description: "Give a ViSE industry talk.",
    order: 200,
  },
];

const companiesItems: NavItemWithOrder[] = [
  {
    title: "Sponsor SSE",
    href: "/sponsors#sponsor",
    description: "Become an SSE sponsor.",
    order: 100,
  },
  {
    title: "Recruit Students",
    href: "/sponsors#recruit",
    description: "Hire from our student body.",
    order: 200,
  },
];

const seOfficeItems: NavItemWithOrder[] = [
  {
    title: "Leadership",
    href: "/about/leadership",
    description: "Meet the officers and heads.",
    order: 100,
    slug: "about/leadership",
  },
  {
    title: "Committees",
    href: "/about/committees",
    description: "Learn about each committee.",
    order: 200,
    slug: "about/committees",
  },
  {
    title: "Constitution",
    href: "/about/constitution",
    description: "Read SSE's governing document.",
    order: 300,
    slug: "about/constitution",
  },
  {
    title: "Primary Policy",
    href: "/about/primary-officers-policy",
    description: "Rules for primary officers.",
    order: 400,
    slug: "about/primary-officers-policy",
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

function plainItem(item: NavItemWithOrder): NavItem {
  return {
    title: item.title,
    href: item.href,
    description: item.description,
  };
}

function sortNavItems(items: NavItemWithOrder[]) {
  return [...items].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

function defaultDescriptionFor(page: CmsNavPage, defaultsBySlug: Map<string, NavItemWithOrder>) {
  return defaultsBySlug.get(page.slug)?.description ?? `Open ${page.navLabel ?? page.title}.`;
}

function cmsHref(page: CmsNavPage) {
  return `/${page.slug}`;
}

function defaultSlugSet(defaults: NavItemWithOrder[]) {
  return new Set(defaults.map((item) => item.slug).filter(Boolean) as string[]);
}

function cmsPageCanRender(page: CmsNavPage, defaultsBySlug: Map<string, NavItemWithOrder>) {
  // New CMS-only pages must be published before appearing publicly.
  // Existing static paths may stay visible while their CMS draft is being
  // prepared because the static route remains the fallback until publish.
  return page.status === "PUBLISHED" || defaultsBySlug.has(page.slug);
}

function buildDefaultsBySlug() {
  return new Map(
    [...topLevelItems, ...studentsItems, ...alumniItems, ...companiesItems, ...seOfficeItems]
      .filter((item): item is NavItemWithOrder & { slug: string } => Boolean(item.slug))
      .map((item) => [item.slug, item])
  );
}

function buildDefaultSlugCounts() {
  const counts = new Map<string, number>();
  for (const item of [
    ...topLevelItems,
    ...studentsItems,
    ...alumniItems,
    ...companiesItems,
    ...seOfficeItems,
  ]) {
    if (!item.slug) continue;
    counts.set(item.slug, (counts.get(item.slug) ?? 0) + 1);
  }
  return counts;
}

function resolveSectionItems({
  section,
  defaults,
  cmsPages,
  defaultsBySlug,
  defaultSlugCounts,
}: {
  section: CmsNavSection;
  defaults: NavItemWithOrder[];
  cmsPages: CmsNavPage[];
  defaultsBySlug: Map<string, NavItemWithOrder>;
  defaultSlugCounts: Map<string, number>;
}) {
  const cmsBySlug = new Map(cmsPages.map((page) => [page.slug, page]));
  const sectionDefaultSlugs = defaultSlugSet(defaults);
  const items: NavItemWithOrder[] = [];

  for (const item of defaults) {
    const override = item.slug ? cmsBySlug.get(item.slug) : undefined;
    if (!override) {
      items.push(item);
      continue;
    }
    if (!override.showInNav || override.navSection === "HIDDEN") continue;
    if (override.navSection !== section) {
      if (item.slug && (defaultSlugCounts.get(item.slug) ?? 0) > 1) {
        items.push(item);
      }
      continue;
    }
    if (!cmsPageCanRender(override, defaultsBySlug)) continue;
    items.push({
      title: override.navLabel ?? override.title,
      href: cmsHref(override),
      description: item.description,
      order: override.navOrder,
      slug: override.slug,
    });
  }

  for (const page of cmsPages) {
    if (!page.showInNav || page.navSection !== section) continue;
    if (!cmsPageCanRender(page, defaultsBySlug)) continue;
    if (sectionDefaultSlugs.has(page.slug)) continue;
    items.push({
      title: page.navLabel ?? page.title,
      href: cmsHref(page),
      description: defaultDescriptionFor(page, defaultsBySlug),
      order: page.navOrder,
      slug: page.slug,
    });
  }

  return sortNavItems(items).map(plainItem);
}

export function buildTopLevelNavItems({
  cmsPages = [],
}: {
  cmsPages?: CmsNavPage[];
} = {}): NavItem[] {
  const defaultsBySlug = buildDefaultsBySlug();
  const defaultSlugCounts = buildDefaultSlugCounts();
  return resolveSectionItems({
    section: "TOP_LEVEL",
    defaults: topLevelItems,
    cmsPages,
    defaultsBySlug,
    defaultSlugCounts,
  });
}

export function buildNavGroups({
  isSeAdmin,
  activeElection,
  cmsPages = [],
}: {
  isSeAdmin: boolean;
  activeElection?: Pick<ActiveElectionSummary, "slug" | "status"> | null;
  cmsPages?: CmsNavPage[];
}): NavGroup[] {
  const electionItem = getPublicElectionItem(activeElection);
  const defaultsBySlug = buildDefaultsBySlug();
  const defaultSlugCounts = buildDefaultSlugCounts();
  const students = resolveSectionItems({
    section: "STUDENTS",
    defaults: studentsItems,
    cmsPages,
    defaultsBySlug,
    defaultSlugCounts,
  });
  const groups: NavGroup[] = [
    {
      value: "students",
      label: "Students",
      items: electionItem ? [electionItem, ...students] : students,
    },
    {
      value: "alumni",
      label: "Alumni",
      items: resolveSectionItems({
        section: "ALUMNI",
        defaults: alumniItems,
        cmsPages,
        defaultsBySlug,
        defaultSlugCounts,
      }),
    },
    {
      value: "companies",
      label: "Companies",
      items: resolveSectionItems({
        section: "COMPANIES",
        defaults: companiesItems,
        cmsPages,
        defaultsBySlug,
        defaultSlugCounts,
      }),
    },
  ];

  if (isSeAdmin) {
    groups.push({
      value: "se-office",
      label: "SE Office",
      items: resolveSectionItems({
        section: "SE_OFFICE",
        defaults: seOfficeItems,
        cmsPages,
        defaultsBySlug,
        defaultSlugCounts,
      }),
    });
  }

  return groups;
}
