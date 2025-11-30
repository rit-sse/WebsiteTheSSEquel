"use client";

import { Calendar } from "lucide-react";
import { HTMLAttributes } from "react";

interface MonthGroupProps extends HTMLAttributes<HTMLDivElement> {
    month: string;
    year: number;
}

export function MonthGroup({
    month,
    year,
    children
}: MonthGroupProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex flex-row gap-1 justify-start items-center">
                <Calendar className="h-3.5 w-3.5 text-muted-light dark:text-muted-dark -translate-y-[1px]" aria-hidden="true" />
                <span className="text-muted-light dark:text-muted-dark text-xs font-normal">{month} {year}</span>
            </div>
            <div className="flex flex-col gap-2">
                { children }
            </div>
        </div>
    );
}