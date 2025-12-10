"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { Searchbar } from "./components/Searchbar";
import { MonthGroup } from "./components/MonthGroup";

export default function Sidebar() {
    const [query, setQuery] = useState("");

    return (
        <aside className="w-80 flex-shrink-0 hidden md:flex flex-col rounded-t-2xl bg-white/[0.65] dark:bg-black/[0.65]">
            <div className="text-xl lg:text-2xl p-6 pb-3 text-center font-bold text-primary">
                Weekly Coding Challenges
            </div>

            <div className="flex flex-col">
                {/* current challenge */}
                <div className="flex flex-col px-6">
                    <div className="flex flex-col py-3">
                        <span className={cn(
                            "flex flex-row justify-between border-b-[1.5px] border-base-content",
                            "text-base-content font-medium"
                        )}>
                            Current Challenge
                        </span>
                    </div>

                    {/* current challenge goes here */}
                </div>

                {/* historical challenges */}
                <div className="flex flex-col px-6">
                    {/* header */}
                    <div className="flex flex-col py-3">
                        <span className={cn(
                            "flex flex-row justify-between border-b-[1.5px] border-base-content",
                            "text-base-content font-medium"
                        )}>
                            Historical Challenges
                            <span>(3/254)</span>
                        </span>
                    </div>

                    <div className="flex flex-col gap-3">
                        {/* searchbar */}
                        <Searchbar value={query} onChange={setQuery} />

                        {/* list */}
                        <div className="flex flex-col gap-24">
                            <MonthGroup month="January" year={2024}>
                                {/* challenges go here */}
                                <span>challenge 1</span>
                                <span>challenge 2</span>
                                <span>challenge 3</span>
                            </MonthGroup>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    )
}