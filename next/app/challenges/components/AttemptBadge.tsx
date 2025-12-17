"use client";

import { cn } from "@/lib/utils";

interface AttemptBadgeProps {
    className?: string;
    attempts: number;
    solved?: boolean;
}

function AttemptText({ attempts, solved }: { attempts: number; solved?: boolean }) {
    const long = attempts <= 0
        ? "Not attempted yet"
        : solved
            ?  `Solved in ${attempts} attempt${attempts === 1 ? "" : "s"}`
            : `${attempts} attempt${attempts === 1 ? "" : "s"} made`;

    const short = attempts <= 0
        ? "Unattempted"
        : solved
            ? "Solved"
            : `${attempts} attempt${attempts === 1 ? "" : "s"}`;

    return (
        <>
            <span className="md:hidden lg:inline-block">{ long }</span>
            <span className="hidden md:inline-block lg:hidden">{ short }</span>
        </>
    )
}

export function AttemptBadge({ className, attempts, solved }: AttemptBadgeProps) {
    return (
        <div className={cn(
            className,
            "flex flex-row items-center justify-center p-2.5 rounded-xl shadow-md ring-2 ring-inset",
            solved && [
                "bg-[linear-gradient(-45deg,#9FE3B0_0%,#BFF0CB_35%,#86D39B_70%,#6BC089_100%)]",
                "dark:bg-[linear-gradient(-45deg,#2D9660_0%,#34A86C_35%,#3DB878_70%,#36A96C_100%)]",
                "ring-emerald-300/70 dark:ring-emerald-900/60",
            ],
            !solved && [
                "bg-[linear-gradient(-45deg,#E8E8E8_0%,#FBFBFB_29%,#EBEBEB_54%,#FFFFFF_77%,#EDEDED_100%)]",
                "dark:bg-[linear-gradient(-45deg,#1E1E1E_0%,#262626_29%,#2D2D2D_54%,#333333_77%,#383838_100%)]",
                "ring-white dark:ring-neutral-800",
            ]
        )}>
            <span className={cn(
                "font-medium text-base leading-none whitespace-nowrap",
                solved && "text-black/[0.65] dark:text-black/60",
                !solved && "text-black/[0.65] dark:text-white/40"
            )}><AttemptText attempts={attempts} solved /></span>
        </div>
    );
}