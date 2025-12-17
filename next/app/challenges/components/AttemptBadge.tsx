"use client";

import { cn } from "@/lib/utils";

interface AttemptBadgeProps {
    className?: string;
    attempts: number;
    solved?: boolean;
}

export function AttemptBadge({ className, attempts, solved }: AttemptBadgeProps) {
    const text = attempts <= 0
        ? "Not attempted yet"
        : solved
            ? attempts === 1
                ? "Solved first try"
                : `Solved in ${attempts} attempts`
            : `${attempts} attempt${attempts === 1 ? "" : "s"} made`;

    const isFirstTrySolved = solved && attempts === 1;
    const isSolvedLater = solved && attempts > 1;

    return (
        <div className={cn(
            className,
            "flex flex-row items-center justify-center p-2.5 rounded-xl shadow-md ring-2 ring-inset",
            isFirstTrySolved && [
                "bg-[linear-gradient(-45deg,#F6E27A_0%,#FFECA3_35%,#F2D45C_70%,#E6B84E_100%)]",
                "dark:bg-[linear-gradient(-45deg,#B8941E_0%,#D4AF37_35%,#F4D03F_50%,#D4AF37_65%,#B8941E_100%)]",
                "ring-yellow-300/70 dark:ring-yellow-900/60",
            ],
            isSolvedLater && [
                "bg-[linear-gradient(-45deg,#9FE3B0_0%,#BFF0CB_35%,#86D39B_70%,#6BC089_100%)]",
                "dark:bg-[linear-gradient(-45deg,#2D9660_0%,#34A86C_35%,#3DB878_70%,#36A96C_100%)]",
                "ring-emerald-300/70 dark:ring-emerald-900/60",
            ],
            !isFirstTrySolved && !isSolvedLater && [
                "bg-[linear-gradient(-45deg,#E8E8E8_0%,#FBFBFB_29%,#EBEBEB_54%,#FFFFFF_77%,#EDEDED_100%)]",
                "dark:bg-[linear-gradient(-45deg,#1E1E1E_0%,#262626_29%,#2D2D2D_54%,#333333_77%,#383838_100%)]",
                "ring-white dark:ring-neutral-800",
            ]
        )}>
            <span className={cn(
                "font-medium text-base leading-none",
                isFirstTrySolved && "text-black/[0.65] dark:text-black/70",
                isSolvedLater && "text-black/[0.65] dark:text-black/60",
                !isFirstTrySolved && !isSolvedLater && "text-black/[0.65] dark:text-white/40"
            )}>{text}</span>
        </div>
    );
}