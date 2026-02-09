"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { User, Settings, LogOut } from "lucide-react";
import HoverBoldButton from "../common/HoverBoldButton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AuthButtonProps {
    userId?: number | null;
}

function getInitials(name: string | null | undefined): string {
    if (!name) return "?";
    return name
        .split(" ")
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

export default function AuthButton({ userId }: AuthButtonProps = {}) {
    const { data: session } = useSession();

    if (session) {
        const userName = session.user?.name ?? "User";
        const userEmail = session.user?.email ?? "";
        const userImage = session.user?.image;

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={userImage ?? undefined} alt={userName} />
                            <AvatarFallback>{getInitials(userName)}</AvatarFallback>
                        </Avatar>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{userName}</p>
                            <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {userId && (
                        <DropdownMenuItem asChild>
                            <Link href={`/profile/${userId}`} className="cursor-pointer">
                                <User className="mr-2 h-4 w-4" />
                                My Profile
                            </Link>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                        <Link href="/settings" className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                        </Link>
                    </DropdownMenuItem>
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
        <HoverBoldButton
            className="text-left"
            text="Login"
            dataLabel="Logout"
            onClick={() => signIn("google")}
        />
    );
}
