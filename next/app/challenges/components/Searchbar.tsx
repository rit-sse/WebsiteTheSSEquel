"use client";

import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface SearchbarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function Searchbar({
    value,
    onChange,
    placeholder = "Search...",
    className = "",
}: SearchbarProps) {
    return (
        <div className={`relative w-full ${className}`}>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                aria-label={placeholder}
                className={cn(
                    "w-full px-3 py-2.5",
                    "bg-white/30 dark:bg-neutral-800/40",
                    "ring-2 ring-inset ring-white dark:ring-neutral-800",
                    "rounded-xl",
                    "text-base-content text-xs leading-none",
                    "placeholder:text-neutral-400 dark:placeholder:text-neutral-500",
                    "border-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-neutral-300 dark:focus:ring-neutral-700"
                )}
            />
        </div>
    );
}
