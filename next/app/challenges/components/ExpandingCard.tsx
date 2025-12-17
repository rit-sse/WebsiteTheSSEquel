"use client";

import { cn } from "@/lib/utils";
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { HTMLAttributes, ReactNode, useState } from "react";

interface ExpandingCardProps extends HTMLAttributes<HTMLDivElement> {
    title: string;
    barChildren: ReactNode;
    children: ReactNode;
    defaultExpanded?: boolean;
}

export function ExpandingCard({ title, barChildren, children, defaultExpanded = true, className, ...props }: ExpandingCardProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);

    return (
        <div
            className={cn(
                "flex flex-col flex-shrink-0 border-4 border-white dark:border-base-100 rounded-3xl overflow-hidden",
                "bg-gradient-to-b from-white/0 to-white/[0.65] dark:to-white/0",
                className
            )}
            {...props}
        >
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex flex-row justify-between items-center bg-white dark:bg-base-100 px-6 py-4 w-full text-left cursor-pointer focus:outline-none"
                aria-expanded={expanded}
                type="button"
            >
                <span className="text-2xl font-semibold text-base-content">{title}</span>
                <div className="flex flex-row gap-2 items-center">
                    {barChildren}
                    {expanded ? (
                        <ChevronsDownUp className="w-6 h-6 text-base-content flex-shrink-0 transition-transform" />
                    ) : (
                        <ChevronsUpDown className="w-6 h-6 text-base-content flex-shrink-0 transition-transform" />
                    )}
                </div>
            </button>
            <div
                className={cn(
                    "overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out",
                    expanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                )}
            >
                {children}
            </div>
        </div>
    );
}