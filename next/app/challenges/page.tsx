import { cn } from "@/lib/utils";
import { HistoricalButton } from "./components/HistoricalChallenge";
import Sidebar from "./Sidebar";

// <HistoricalButton challengeName="Linked List Cycles" problemState="attempted"></HistoricalButton>

export default function ChallengesPage() {
    return (
        <div className={cn(
            "relative self-stretch flex flex-row h-0 grow gap-6 px-6",
            "-mx-2 md:-mx-4 lg:-mx-6 xl:-mx-8",
            "-mb-2 md:-mb-4 lg:-mb-6 xl:-mb-8",
        )}>
            {/* fixed-width sidebar when in md+ screens */}
            <Sidebar />

            {/* main scrolling content */}
            <div className="flex grow flex-col sse-scrollbar overflow-y-auto">
                <span>challenge</span>
                <span>your attempts</span>
                <span>solutions</span>
            </div>

            {/* position under the footer - forced in root layout */}
            <div className="hidden md:block absolute bottom-0 left-6 w-80 origin-bottom h-14 scale-y-[-1] -translate-y-[0.1px] bg-white/[0.65] dark:bg-black/[0.65]" />
        </div>
    );
}