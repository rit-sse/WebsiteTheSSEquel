/**
 * Officer Dashboard sections.
 *
 * Source of truth for the cards rendered on `/dashboard`. The shape mirrors
 * the dropdown items the Navbar used to render (title / href / description),
 * with two additions:
 *   - `accentClass`: a Tailwind class that the per-section preview can read
 *     for its highlight color.
 *   - `visibleFor(auth)`: optional predicate that gates the card behind one
 *     or more auth flags. The dashboard layout already redirects non-officers
 *     away, so this is only used to scope the more sensitive sections
 *     (Tech Committee Apps, Elections, Announcements, Photos).
 */
export type DashboardSectionId =
  | "purchasing"
  | "attendance"
  | "mentoring"
  | "tech-committee"
  | "positions"
  | "users"
  | "sponsors"
  | "alumni"
  | "elections"
  | "announcements"
  | "photos";

export type DashboardAuthFlags = {
  isOfficer: boolean;
  isMentor: boolean;
  isPrimary: boolean;
  isMentoringHead: boolean;
  isSeAdmin: boolean;
  isTechCommitteeHead: boolean;
  isTechCommitteeDivisionManager: boolean;
};

export interface DashboardSection {
  id: DashboardSectionId;
  title: string;
  href: string;
  description: string;
  /** Tailwind text-color class consumed by the section's preview accent. */
  accentClass: string;
  visibleFor?: (auth: DashboardAuthFlags) => boolean;
}

export const DASHBOARD_SECTIONS: readonly DashboardSection[] = [
  {
    id: "purchasing",
    title: "Purchasing",
    href: "/purchasing",
    description: "Request PCard checkout and submit receipts.",
    accentClass: "text-emerald-500",
  },
  {
    id: "attendance",
    title: "Attendance",
    href: "/attendance",
    description: "View event attendance lists and QR flyers.",
    accentClass: "text-sky-500",
  },
  {
    id: "mentoring",
    title: "Mentoring",
    href: "/dashboard/mentoring",
    description: "Manage mentor schedules and roster.",
    accentClass: "text-primary",
  },
  {
    id: "tech-committee",
    title: "Tech Committee Apps",
    href: "/dashboard/tech-committee",
    description:
      "Review Tech Committee applications and manage availability.",
    accentClass: "text-violet-500",
    visibleFor: (a) =>
      a.isTechCommitteeHead || a.isPrimary || a.isTechCommitteeDivisionManager,
  },
  {
    id: "positions",
    title: "Positions & Officers",
    href: "/dashboard/positions",
    description: "Manage officer positions and assignments.",
    accentClass: "text-amber-500",
  },
  {
    id: "users",
    title: "Users",
    href: "/dashboard/users",
    description: "Manage user accounts.",
    accentClass: "text-cyan-500",
  },
  {
    id: "sponsors",
    title: "Sponsors",
    href: "/dashboard/sponsors",
    description: "Manage sponsor information.",
    accentClass: "text-orange-500",
  },
  {
    id: "alumni",
    title: "Alumni Review",
    href: "/dashboard/alumni",
    description:
      "Review alumni requests and auto-generated candidates.",
    accentClass: "text-teal-500",
  },
  {
    id: "elections",
    title: "Elections",
    href: "/dashboard/elections",
    description: "Create and manage primary-officer election cycles.",
    accentClass: "text-rose-500",
    visibleFor: (a) => a.isPrimary,
  },
  {
    id: "announcements",
    title: "Announcements",
    href: "/dashboard/announcements",
    description: "Manage site-wide announcement banners.",
    accentClass: "text-yellow-500",
    visibleFor: (a) => a.isPrimary,
  },
  {
    id: "photos",
    title: "Photos",
    href: "/dashboard/photos",
    description: "Upload and manage SSE photo library images.",
    accentClass: "text-fuchsia-500",
    visibleFor: (a) => a.isOfficer || a.isSeAdmin,
  },
];

/**
 * Returns the subset of sections visible to a user with the given auth flags.
 * Sections without a `visibleFor` predicate are always returned.
 */
export function filterVisibleSections(
  auth: DashboardAuthFlags
): DashboardSection[] {
  return DASHBOARD_SECTIONS.filter(
    (section) => !section.visibleFor || section.visibleFor(auth)
  );
}
