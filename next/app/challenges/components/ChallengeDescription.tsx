"use client";

import DarkModeToggle from "@/components/common/DarkModeToggle";
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { HTMLAttributes, useState } from "react";

interface ChallengeDescriptionProps extends HTMLAttributes<HTMLDivElement> {
    id: string;
    title: string;
}

export function ChallengeDescription({ id, title, children }: ChallengeDescriptionProps) {
    const [expanded, setExpanded] = useState(true);

    return (
        <div className="flex flex-col flex-shrink-0 border-4 border-white dark:border-black rounded-3xl overflow-hidden bg-gradient-to-b from-white/0 to-white/[0.65] dark:from-black/[0.15] dark:to-black/[0.65]">
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex flex-row justify-between items-center bg-white dark:bg-black px-6 py-4 w-full text-left cursor-pointer"
                aria-expanded={expanded}
            >
                <span className="text-2xl font-bold text-base-content">{`${id}. ${title}`}</span>
                <div className="flex flex-row gap-2">
                    <DarkModeToggle className="hover:scale-100" iconClassName="!w-6 !h-6" />
                    {expanded ? (
                        <ChevronsDownUp className="w-6 h-6 text-base-content flex-shrink-0 transition-transform" />
                    ) : (
                        <ChevronsUpDown className="w-6 h-6 text-base-content flex-shrink-0 transition-transform" />
                    )}
                </div>
            </button>
            <div
                className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${expanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                    }`}
            >
                <div className="p-6 text-base">
                    {children}
                </div>
            </div>
        </div>
    );
}