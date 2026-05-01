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
import { buildNavGroups } from "@/lib/navbarConfig";

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
 * SE Office is gated to SE Office users. Elections surface under Students
 * only while an election is open for nominations or voting.
 */

interface NavbarProps {
  /** Resolved on the server so the first paint already includes Dashboard / profile link. */
  serverUserId?: number | null;
  serverShowDashboard?: boolean;
  serverProfileComplete?: boolean;
  serverIsSeAdmin?: boolean;
  /** Rendered on the server so the first paint includes an open election link
   * under Students when nominations or voting are live. */
  serverActiveElection?: ActiveElectionSummary | null;
}

const Navbar: React.FC<NavbarProps> = ({
  serverUserId = null,
  serverShowDashboard = false,
  serverProfileComplete = true,
  serverIsSeAdmin = false,
  serverActiveElection = null,
}) => {
  const [open, setOpen] = React.useState(false);
  const { data: session } = useSession();
  const { profileImage } = useProfileImage();

  // Initialize from server props — no flash on first paint
  const [showDashboard, setShowDashboard] = React.useState(serverShowDashboard);
  const [userId, setUserId] = React.useState<number | null>(serverUserId);
  const [profileComplete, setProfileComplete] = React.useState(
    serverProfileComplete,
  );
  const [isSeAdmin, setIsSeAdmin] = React.useState(serverIsSeAdmin);

  // Background refresh so dynamic changes (e.g. profile completion) still
  // propagate. The navbar no longer renders a dashboard dropdown, so we only
  // need the top-level "is this user an officer/mentor?" gate plus the
  // profile fields — the dashboard page itself owns the per-section
  // visibility now.
  React.useEffect(() => {
    if (!session) {
      setShowDashboard(false);
      setIsSeAdmin(false);
      setUserId(null);
      return;
    }

    (async () => {
      try {
        const response = await fetch("/api/authLevel");
        const data = await response.json();
        setShowDashboard(data.isOfficer || data.isMentor || data.isSeAdmin);
        setIsSeAdmin(Boolean(data.isSeAdmin));
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

  const navGroups = React.useMemo(() => {
    return buildNavGroups({
      isSeAdmin,
      activeElection: serverActiveElection,
    });
  }, [isSeAdmin, serverActiveElection]);

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
                const dropdownGridStyle: React.CSSProperties = {
                  width: single
                    ? "min(20rem, calc(100vw - 2rem))"
                    : "min(38rem, calc(100vw - 2rem))",
                  gridTemplateColumns: single
                    ? "minmax(0, 1fr)"
                    : "repeat(auto-fit, minmax(min(17rem, 100%), 1fr))",
                };

                return (
                  <NavigationMenuItem key={group.value} value={group.value}>
                    <NavigationMenuTrigger
                      onClick={handleTriggerClick(group.value)}
                    >
                      {group.label}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent
                      className={cn(
                        group.align === "end" && "lg:left-auto lg:right-0",
                      )}
                    >
                      <ul
                        className="grid auto-rows-fr items-stretch gap-3 p-4"
                        style={dropdownGridStyle}
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

              {showDashboard && (
                <NavigationMenuItem>
                  <NavigationMenuLink
                    asChild
                    className={navigationMenuTriggerStyle()}
                  >
                    <Link href="/dashboard">Officer Dashboard</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )}

              <NavigationMenuItem className="flex items-center ml-1">
                <AuthButton userId={userId} profileComplete={profileComplete} />
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

                {showDashboard && (
                  <MobileNavLink
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Officer Dashboard
                  </MobileNavLink>
                )}

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
        className,
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
            isOpen && "rotate-180",
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
    <li {...props} className="min-w-0">
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className={cn(
            "flex h-full min-h-[6.75rem] min-w-0 select-none flex-col justify-center rounded-lg p-3 leading-none no-underline outline-none",
            "bg-surface-2 border border-border/30",
            "hover:bg-surface-1 hover:border-border/50 hover:shadow-md",
            "focus:bg-surface-2 focus:border-border/50",
            "transition-colors",
            className,
          )}
        >
          <div className="flex min-h-[2.25rem] min-w-0 items-end justify-center text-sm font-bold font-heading leading-tight text-foreground">
            {title}
          </div>
          <p className="mt-1 line-clamp-2 min-h-[2lh] text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

export default Navbar;
