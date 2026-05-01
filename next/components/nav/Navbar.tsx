"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronDown,
  Menu,
  User,
  LogOut,
  LayoutDashboard,
  Vote,
  Mail,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import SSELogoFull from "../common/SSELogoFull";
import AuthButton from "./AuthButton";
import NavAvatar from "./NavAvatar";
import { useProfileImage } from "@/contexts/ProfileImageContext";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { ActiveElectionSummary } from "@/lib/elections";

/**
 * Audience-grouped dropdowns rendered between the top-level shortcuts
 * (About, Photos) and the avatar. Each entry's items are rendered in a
 * single column when there are two or fewer of them — a 2-col grid on
 * a 2-item dropdown looks empty.
 *
 * Alumni and Companies link into the one-page `/sponsors` via section
 * anchors (`#sponsor`, `#recruit`, `#vise`) instead of duplicating
 * routes; that page adds matching `id` + `scroll-mt-24` so headings
 * clear the navbar after the jump.
 *
 * SE Office grows a conditional "Elections" entry when an election is
 * live (formerly a top-level callout) — wired up inside the component
 * since it depends on the `serverActiveElection` prop.
 */

interface NavItem {
  title: string;
  href: string;
  description: string;
}

type NavGroup = {
  value: string;
  label: string;
  items: NavItem[];
  align?: "start" | "end";
};

const studentsItems: NavItem[] = [
  {
    title: "Get Involved",
    href: "/about/get-involved",
    description: "Discover ways to participate and contribute to SSE.",
  },
  {
    title: "Events",
    href: "/events/calendar",
    description: "Upcoming SSE meetings, workshops, and socials.",
  },
  {
    title: "Mentor Schedule",
    href: "/mentoring/schedule",
    description: "See when mentors are available in the lab.",
  },
  {
    title: "Become a Mentor",
    href: "/mentoring/apply",
    description: "Apply to help fellow students in the SSE lab.",
  },
  {
    title: "Leaderboard",
    href: "/memberships",
    description: "See who's on track to earn membership this term.",
  },
  {
    title: "Projects",
    href: "/projects",
    description: "Browse student projects built by the SSE community.",
  },
  {
    title: "Go Links",
    href: "/go",
    description: "Quick redirects (go/…) maintained by SSE officers.",
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

interface NavbarProps {
  /** Resolved on the server so the first paint already includes Dashboard / profile link. */
  serverUserId?: number | null;
  serverShowDashboard?: boolean;
  serverProfileComplete?: boolean;
  /** When set, the navbar shows a top-level "Elections" link pointing at the
   * live election. Rendered on the server so the first paint is correct. */
  serverActiveElection?: ActiveElectionSummary | null;
  serverCommitteeHeadNominationsOpen?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({
  serverUserId = null,
  serverShowDashboard = false,
  serverProfileComplete = true,
  serverActiveElection = null,
  serverCommitteeHeadNominationsOpen = false,
}) => {
  const [open, setOpen] = React.useState(false);
  const { data: session } = useSession();
  const { profileImage } = useProfileImage();

  // Initialize from server props — no flash on first paint
  const [showDashboard, setShowDashboard] = React.useState(serverShowDashboard);
  const [userId, setUserId] = React.useState<number | null>(serverUserId);
  const [profileComplete, setProfileComplete] = React.useState(
    serverProfileComplete
  );

  // Background refresh so dynamic changes (e.g. profile completion) still
  // propagate. The navbar no longer renders a dashboard dropdown, so we only
  // need the top-level "is this user an officer/mentor?" gate plus the
  // profile fields — the dashboard page itself owns the per-section
  // visibility now.
  React.useEffect(() => {
    if (!session) {
      setShowDashboard(false);
      setUserId(null);
      return;
    }

    (async () => {
      try {
        const response = await fetch("/api/authLevel");
        const data = await response.json();
        setShowDashboard(data.isOfficer || data.isMentor);
        setUserId(data.userId ?? null);
        setProfileComplete(data.profileComplete ?? true);
      } catch (error) {
        console.error("Error checking auth level:", error);
      }
    })();
  }, [session]);

  // Controlled state for navigation menu - click to activate, then hover works
  const [menuValue, setMenuValue] = React.useState<string>("");
  const [isMenuActive, setIsMenuActive] = React.useState(false);

  // Handle menu value changes - only allow if menu is active (clicked)
  const handleValueChange = (value: string) => {
    if (isMenuActive || value === "") {
      setMenuValue(value);
      // If closing the menu, deactivate hover mode
      if (value === "") {
        setIsMenuActive(false);
      }
    }
  };

  // Handle click on a menu trigger - toggle menu, activate hover mode if opening
  const handleTriggerClick = (value: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (menuValue === value) {
      // Clicking the same trigger closes the menu
      setMenuValue("");
      setIsMenuActive(false);
    } else {
      // Opening a menu activates hover mode
      setIsMenuActive(true);
      setMenuValue(value);
    }
  };

  // SE Office gets the live election as a conditional last entry. The
  // groups array is otherwise stable; we rebuild on prop change so the
  // first-paint server prop and any subsequent client-side election
  // updates both flow through. Committee Head nominations are a separate
  // post-election appointment workflow and surface under Students.
  const navGroups = React.useMemo(() => {
    const seOfficeWithElection: NavItem[] = serverActiveElection
      ? [
          ...seOfficeItems,
          {
            title: "Elections",
            href: `/elections/${serverActiveElection.slug}`,
            description: "Cast your ballot in the active SSE election.",
          },
        ]
      : seOfficeItems;
    const studentsWithNominations: NavItem[] =
      serverCommitteeHeadNominationsOpen
        ? [
            ...studentsItems,
            {
              title: "Committee Head Nominations",
              href: "/nominate",
              description:
                "Apply for or nominate someone for a Committee Head role.",
            },
          ]
        : studentsItems;
    return [
      { value: "students", label: "Students", items: studentsWithNominations },
      { value: "alumni", label: "Alumni", items: alumniItems },
      { value: "companies", label: "Companies", items: companiesItems },
      {
        value: "se-office",
        label: "SE Office",
        items: seOfficeWithElection,
        align: "end",
      },
    ] satisfies NavGroup[];
  }, [serverActiveElection, serverCommitteeHeadNominationsOpen]);

  return (
    <nav
      id="navbar"
      className="flex w-full items-center justify-center border-b-[2px] border-black"
    >
      <div
        id="nav-content"
        className="flex flex-row flex-nowrap justify-between text-center items-center 
                           w-full h-auto px-4 md:px-8 lg:px-12 xl:px-16 py-1"
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex flex-row items-center justify-center group focus:outline-offset-8 rounded-md"
        >
          <SSELogoFull />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex">
          <NavigationMenu
            value={menuValue}
            onValueChange={handleValueChange}
            delayDuration={isMenuActive ? 100 : 1000000}
            viewport={false}
          >
            <NavigationMenuList>
              {/* Top-level shortcut: About is its own page, no
                  dropdown needed now that Credits / Get Involved live
                  elsewhere. */}
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={navigationMenuTriggerStyle()}
                >
                  <Link href="/about">About</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* Top-level shortcut: Photos is the most-visited page
                  outside of Events, so it earns its own slot rather
                  than living inside the Students dropdown. */}
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={navigationMenuTriggerStyle()}
                >
                  <Link href="/photos">Photos</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {navGroups.map((group) => {
                // Two-or-fewer-item groups render single-column so the
                // dropdown panel doesn't show a half-empty 2-col grid.
                const single = group.items.length <= 2;
                return (
                  <NavigationMenuItem key={group.value} value={group.value}>
                    <NavigationMenuTrigger
                      onClick={handleTriggerClick(group.value)}
                    >
                      {group.label}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent
                      className={cn(
                        group.align === "end" && "lg:left-auto lg:right-0"
                      )}
                    >
                      <ul
                        className={cn(
                          "grid gap-3 p-4",
                          single
                            ? "w-[280px]"
                            : "md:w-[400px] lg:w-[500px] lg:grid-cols-2"
                        )}
                      >
                        {group.items.map((item) => (
                          <ListItem
                            key={item.title}
                            title={item.title}
                            href={item.href}
                          >
                            {item.description}
                          </ListItem>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                );
              })}

              <NavigationMenuItem className="flex items-center ml-1">
                <AuthButton
                  userId={userId}
                  profileComplete={profileComplete}
                  showOfficerDashboard={showDashboard}
                />
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="p-2 hover:bg-accent rounded-md"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-6">
                {/* Top-level shortcuts mirror desktop: About + Photos
                    sit above the audience collapsibles so they're a
                    single tap on mobile. */}
                <MobileNavLink href="/about" onClick={() => setOpen(false)}>
                  About
                </MobileNavLink>

                <MobileNavLink href="/photos" onClick={() => setOpen(false)}>
                  Photos
                </MobileNavLink>

                {navGroups.map((group) => (
                  <MobileNavCollapsible key={group.value} title={group.label}>
                    {group.items.map((item) => (
                      <MobileNavLink
                        key={item.title}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="pl-4"
                      >
                        {item.title}
                      </MobileNavLink>
                    ))}
                  </MobileNavCollapsible>
                ))}

                <div className="pt-4 border-t border-border mt-2">
                  {session ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3 px-3 py-2 mb-1">
                        <div className="relative">
                          <NavAvatar
                            src={profileImage ?? session.user?.image ?? null}
                            name={session.user?.name ?? "User"}
                            className="h-9 w-9"
                          />
                          {!profileComplete && (
                            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-destructive border-2 border-background" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {session.user?.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {session.user?.email}
                          </span>
                        </div>
                      </div>
                      {showDashboard && (
                        <MobileNavLink
                          href="/dashboard"
                          onClick={() => setOpen(false)}
                        >
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          Officer Dashboard
                        </MobileNavLink>
                      )}
                      {userId && (
                        <MobileNavLink
                          href={`/profile/${userId}`}
                          onClick={() => setOpen(false)}
                        >
                          <User className="h-4 w-4 mr-2" />
                          My Profile
                          {!profileComplete && (
                            <span className="ml-auto h-2 w-2 rounded-full bg-destructive" />
                          )}
                        </MobileNavLink>
                      )}
                      {userId && (
                        <MobileNavLink
                          href="/elections/me"
                          onClick={() => setOpen(false)}
                        >
                          <Vote className="h-4 w-4 mr-2" />
                          My Nominations
                        </MobileNavLink>
                      )}
                      {userId && (
                        <MobileNavLink
                          href="/accept-invitation"
                          onClick={() => setOpen(false)}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          My Invitations
                        </MobileNavLink>
                      )}
                      <button
                        onClick={() => {
                          signOut();
                          setOpen(false);
                        }}
                        className="flex items-center py-2 px-3 text-base font-medium rounded-md hover:bg-accent transition-colors text-destructive"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <AuthButton
                      userId={userId}
                      profileComplete={profileComplete}
                    />
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

function MobileNavLink({
  href,
  children,
  onClick,
  className,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center py-2 px-3 text-base font-medium rounded-md hover:bg-accent transition-colors",
        className
      )}
    >
      {children}
    </Link>
  );
}

function MobileNavCollapsible({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 text-base font-medium rounded-md hover:bg-accent transition-colors">
        {title}
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-1 mt-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

function ListItem({
  title,
  children,
  href,
  className,
  ...props
}: Omit<React.ComponentPropsWithoutRef<"li">, "title"> & {
  href: string;
  title: React.ReactNode;
}) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className={cn(
            "block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none",
            "bg-surface-2 border border-border/30",
            "hover:bg-surface-1 hover:border-border/50 hover:shadow-md",
            "focus:bg-surface-2 focus:border-border/50",
            "transition-colors",
            className
          )}
        >
          <div className="text-sm font-bold font-heading leading-none text-foreground">
            {title}
          </div>
          <p className="line-clamp-2 min-h-[2lh] text-sm leading-snug text-muted-foreground mt-1">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

export default Navbar;
