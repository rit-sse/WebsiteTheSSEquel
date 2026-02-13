"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { User, LogOut } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NavAvatar from "./NavAvatar";
import { useProfileImage } from "@/contexts/ProfileImageContext";

interface AuthButtonProps {
    userId?: number | null;
    profileComplete?: boolean;
}

export default function AuthButton({ userId, profileComplete = true }: AuthButtonProps = {}) {
    const { data: session } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!session?.user?.email) return;
        if (pathname === "/accept-invitation") return;

        const cacheKey = `invitation-check:${session.user.email}`;
        if (sessionStorage.getItem(cacheKey) === "done") return;

        (async () => {
            try {
                const response = await fetch("/api/invitations/pending");
                if (!response.ok) return;
                const invitations = await response.json();
                sessionStorage.setItem(cacheKey, "done");
                if (Array.isArray(invitations) && invitations.length > 0) {
                    router.push("/accept-invitation");
                }
            } catch (error) {
                console.error("Failed to check pending invitations:", error);
            }
        })();
    }, [pathname, router, session?.user?.email]);

    // Use the context-provided image so it updates instantly after upload
    const { profileImage } = useProfileImage();

    if (session) {
        const userName = session.user?.name ?? "User";
        const userEmail = session.user?.email ?? "";
        // Prefer context image (updates immediately) over session image
        const userImage = profileImage ?? session.user?.image;

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mr-2">
                        <NavAvatar src={userImage} name={userName} className="h-8 w-8 ring-1 ring-border/50 shadow-sm" />
                        {!profileComplete && (
                            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-destructive border-2 border-background" />
                        )}
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-surface-1">
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{userName}</p>
                            <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {userId && (
                        <DropdownMenuItem asChild>
                            <Link href={`/profile/${userId}`} className="cursor-pointer flex items-center justify-between">
                                <span className="flex items-center">
                                    <User className="mr-2 h-4 w-4" />
                                    My Profile
                                </span>
                                {!profileComplete && (
                                    <span className="h-2 w-2 rounded-full bg-destructive" />
                                )}
                            </Link>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="cursor-pointer text-destructive focus:text-destructive"
                        onClick={() => signOut()}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <button
            onClick={() => signIn("google")}
            className="relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mr-2"
            aria-label="Sign in"
        >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ring-1 ring-border/50 shadow-sm">
                <User className="h-4 w-4 text-muted-foreground" />
            </div>
        </button>
    );
}
