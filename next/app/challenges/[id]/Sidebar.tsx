"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { Searchbar } from "../components/Searchbar";
import { MonthGroup } from "../components/MonthGroup";
import { HistoricalButton } from "../components/HistoricalChallenge";

export default function Sidebar() {
    const [query, setQuery] = useState("");

    return (
        <aside className={cn(
            "w-80 flex-shrink-0 hidden md:flex flex-col rounded-t-2xl bg-white/[0.65] dark:bg-base-300/20",
            "ring-inset dark:ring-base-300/10 dark:ring-4"
        )}>
            <div className="text-2xl p-6 pb-3 text-center font-bold text-base-content">
                Weekly Coding
                <br />
                Challenges @SSE
            </div>

            <div className="flex flex-col">
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

                <div className="flex flex-col px-6">
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
                        <Searchbar value={query} onChange={setQuery} />

                        <div className="flex flex-col gap-24">
                            <MonthGroup month="January" year={2024}>
                                {/* challenges go here */}
                                <HistoricalButton challengeName="Linked List Cycles Problem Text Overflow" problemState="attempted"></HistoricalButton>
                                <HistoricalButton challengeName="Problem #2" problemState="solved"></HistoricalButton>
                                <HistoricalButton challengeName="Problem #3" problemState="unattempted"></HistoricalButton>
                                <HistoricalButton challengeName="Problem #4" problemState="revealed"></HistoricalButton>
                            </MonthGroup>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    )
}