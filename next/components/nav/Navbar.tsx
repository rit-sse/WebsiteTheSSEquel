"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, Menu, User, LogOut } from "lucide-react";
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

const aboutItems = [
    {
        title: "About Us",
        href: "/about",
        description: "Learn about the Society of Software Engineers and our mission.",
    },
    {
        title: "Get Involved",
        href: "/about/get-involved",
        description: "Discover ways to participate and contribute to SSE.",
    },
    {
        title: "Become a Mentor",
        href: "/mentoring/apply",
        description: "Apply to help fellow students in the SSE lab.",
    },
    {
        title: "Leadership",
        href: "/about/leadership",
        description: "Meet the team leading SSE this year.",
    },
    {
        title: "Alumni",
        href: "/about/alumni",
        description: "Connect with SSE graduates and their stories.",
    },
    {
        title: "Committees",
        href: "/about/committees",
        description: "Explore our specialized committees and their work.",
    },
    {
        title: "Constitution",
        href: "/about/constitution",
        description: "Read our governing document and bylaws.",
    },
    {
        title: "Primary Officer's Policy",
        href: "/about/primary-officers-policy",
        description: "View our officer guidelines and policies.",
    },
];

const dashboardItems = [
    {
        title: "Purchasing",
        href: "/purchasing",
        description: "Request PCard checkout and submit receipts.",
    },
    {
        title: "Attendance",
        href: "/attendance",
        description: "View event attendance lists and QR flyers.",
    },
    {
        title: "Mentoring",
        href: "/dashboard/mentoring",
        description: "Manage mentor schedules and roster.",
    },
    {
        title: "Positions & Officers",
        href: "/dashboard/positions",
        description: "Manage officer positions and assignments.",
    },
    {
        title: "Users",
        href: "/dashboard/users",
        description: "Manage user accounts.",
    },
    {
        title: "Sponsors",
        href: "/dashboard/sponsors",
        description: "Manage sponsor information.",
    },
    {
        title: "Alumni Review",
        href: "/dashboard/alumni",
        description: "Review alumni requests and auto-generated candidates.",
    },
];

interface NavbarProps {
    /** Resolved on the server so the first paint already includes Dashboard / profile link. */
    serverUserId?: number | null;
    serverShowDashboard?: boolean;
    serverProfileComplete?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({
    serverUserId = null,
    serverShowDashboard = false,
    serverProfileComplete = true,
}) => {
    const [open, setOpen] = React.useState(false);
    const { data: session } = useSession();
    const { profileImage } = useProfileImage();
    
    // Initialize from server props — no flash on first paint
    const [showDashboard, setShowDashboard] = React.useState(serverShowDashboard);
    const [userId, setUserId] = React.useState<number | null>(serverUserId);
    const [profileComplete, setProfileComplete] = React.useState(serverProfileComplete);
    const [hasMentorAvailabilityUpdates, setHasMentorAvailabilityUpdates] = React.useState(false);

    // Background refresh so dynamic changes (e.g. profile completion) still propagate
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
                if (data.isMentoringHead) {
                    const updatesResponse = await fetch("/api/mentor-availability/updates");
                    if (updatesResponse.ok) {
                        const updatesData = await updatesResponse.json();
                        const latestUpdatedAt = updatesData?.latestUpdatedAt ? Date.parse(updatesData.latestUpdatedAt) : 0;
                        const seenAt = Number(localStorage.getItem("mentor-availability-last-seen") || "0");
                        setHasMentorAvailabilityUpdates(latestUpdatedAt > seenAt);
                    } else {
                        setHasMentorAvailabilityUpdates(false);
                    }
                } else {
                    setHasMentorAvailabilityUpdates(false);
                }
            } catch (error) {
                console.error("Error checking auth level:", error);
            }
        })();
    }, [session]);

    React.useEffect(() => {
        const handleMentorAvailabilitySeen = () => {
            setHasMentorAvailabilityUpdates(false);
        };
        window.addEventListener("mentor-availability-seen", handleMentorAvailabilitySeen);
        return () => {
            window.removeEventListener("mentor-availability-seen", handleMentorAvailabilitySeen);
        };
    }, []);

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

    return (
        <nav
            id="navbar"
            className="fixed inset-x-0 top-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b-[2px] border-black"
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
                    >
                        <NavigationMenuList>
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                    <Link href="/library">Library</Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>

                            <NavigationMenuItem>
                                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                    <Link href="/events/calendar">Events</Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>

                            <NavigationMenuItem>
                                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                    <Link href="/mentoring/schedule">Mentor Schedule</Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>

                            <NavigationMenuItem>
                                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                    <Link href="/memberships">Leaderboard</Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>

                            <NavigationMenuItem>
                                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                    <Link href="/projects">Projects</Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>

                            <NavigationMenuItem>
                                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                    <Link href="/go">Go Links</Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>

                            <NavigationMenuItem value="about">
                                <NavigationMenuTrigger onClick={handleTriggerClick("about")}>
                                    About
                                </NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-2">
                                        {aboutItems.map((item) => (
                                            <ListItem key={item.title} title={item.title} href={item.href}>
                                                {item.description}
                                            </ListItem>
                                        ))}
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                            {showDashboard && (
                                <NavigationMenuItem value="dashboard">
                                    <NavigationMenuTrigger onClick={handleTriggerClick("dashboard")}>
                                        <span className="inline-flex items-center gap-2">
                                            Dashboard
                                            {hasMentorAvailabilityUpdates && (
                                                <span className="h-2 w-2 rounded-full bg-destructive" />
                                            )}
                                        </span>
                                    </NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-2">
                                            {dashboardItems.map((item) => (
                                                <ListItem
                                                    key={item.title}
                                                    title={
                                                        item.href === "/dashboard/mentoring" && hasMentorAvailabilityUpdates ? (
                                                            <span className="inline-flex items-center gap-2">
                                                                {item.title}
                                                                <span className="h-2 w-2 rounded-full bg-destructive" />
                                                            </span>
                                                        ) : (
                                                            item.title
                                                        )
                                                    }
                                                    href={item.href}
                                                >
                                                    {item.description}
                                                </ListItem>
                                            ))}
                                        </ul>
                                    </NavigationMenuContent>
                                </NavigationMenuItem>
                            )}

                            <NavigationMenuItem className="flex items-center ml-1">
                                <AuthButton
                                    userId={userId}
                                    profileComplete={profileComplete}
                                />
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>

                {/* Mobile Navigation */}
                <div className="lg:hidden">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <button className="p-2 hover:bg-accent rounded-md" aria-label="Open menu">
                                <Menu className="h-6 w-6" />
                            </button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] overflow-y-auto">
                            <SheetHeader>
                                <SheetTitle className="text-left">Menu</SheetTitle>
                            </SheetHeader>
                            <nav className="flex flex-col gap-2 mt-6">
                                <MobileNavLink href="/events/calendar" onClick={() => setOpen(false)}>
                                    Events
                                </MobileNavLink>

                                <MobileNavLink href="/mentoring/schedule" onClick={() => setOpen(false)}>
                                    Mentor Schedule
                                </MobileNavLink>

                                <MobileNavLink href="/memberships" onClick={() => setOpen(false)}>
                                    Leaderboard
                                </MobileNavLink>

                                <MobileNavLink href="/projects" onClick={() => setOpen(false)}>
                                    Projects
                                </MobileNavLink>

                                <MobileNavLink href="/go" onClick={() => setOpen(false)}>
                                    Go Links
                                </MobileNavLink>

                                <MobileNavCollapsible title="About">
                                    {aboutItems.map((item) => (
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

                                {showDashboard && (
                                    <MobileNavCollapsible
                                        title={
                                            <span className="inline-flex items-center gap-2">
                                                Dashboard
                                                {hasMentorAvailabilityUpdates && (
                                                    <span className="h-2 w-2 rounded-full bg-destructive" />
                                                )}
                                            </span>
                                        }
                                    >
                                        {dashboardItems.map((item) => (
                                            <MobileNavLink
                                                key={item.title}
                                                href={item.href}
                                                onClick={() => setOpen(false)}
                                                className="pl-4"
                                            >
                                                {item.title}
                                                {item.href === "/dashboard/mentoring" && hasMentorAvailabilityUpdates && (
                                                    <span className="ml-auto h-2 w-2 rounded-full bg-destructive" />
                                                )}
                                            </MobileNavLink>
                                        ))}
                                    </MobileNavCollapsible>
                                )}

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
                                                    <span className="text-sm font-medium">{session.user?.name}</span>
                                                    <span className="text-xs text-muted-foreground">{session.user?.email}</span>
                                                </div>
                                            </div>
                                            {userId && (
                                                <MobileNavLink href={`/profile/${userId}`} onClick={() => setOpen(false)}>
                                                    <User className="h-4 w-4 mr-2" />
                                                    My Profile
                                                    {!profileComplete && (
                                                        <span className="ml-auto h-2 w-2 rounded-full bg-destructive" />
                                                    )}
                                                </MobileNavLink>
                                            )}
                            <button
                                                onClick={() => { signOut(); setOpen(false); }}
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
}: Omit<React.ComponentPropsWithoutRef<"li">, "title"> & { href: string; title: React.ReactNode }) {
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
                    <div className="text-sm font-bold font-heading leading-none text-foreground">{title}</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground mt-1">
                        {children}
                    </p>
                </Link>
            </NavigationMenuLink>
        </li>
    );
}

export default Navbar;
