"use client";

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
                className="
                    w-full
                    px-3 py-2
                    bg-white/30 dark:bg-white/10
                    border-2 border-inset border-white dark:border-neutral-800
                    rounded-xl
                    text-base-content text-xs
                    placeholder:text-muted-light dark:placeholder:text-muted-dark
                    focus:outline-none focus:ring-2 focus:ring-primary/50
                "
            />
        </div>
    );
}
