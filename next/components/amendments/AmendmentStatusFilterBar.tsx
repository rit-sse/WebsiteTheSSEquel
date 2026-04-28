"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  RadixTooltip as Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const FILTERS = [
  { value: null, label: "All", tooltip: "Show all amendments regardless of status" },
  { value: "OPEN", label: "Open Forum", tooltip: "Open for community discussion. Voting has not started." },
  { value: "PRIMARY_REVIEW", label: "Primary Review", tooltip: "Under review by primary officers before member voting" },
  { value: "VOTING", label: "Voting", tooltip: "Active members may cast their votes" },
  { value: "APPROVED", label: "Approved", tooltip: "Passed the vote. Awaiting merge into governing documents." },
  { value: "REJECTED", label: "Rejected", tooltip: "Did not meet required approval thresholds" },
  { value: "MERGED", label: "Merged", tooltip: "Successfully integrated into the constitution" },
] as const;

export default function AmendmentStatusFilterBar() {
  const searchParams = useSearchParams();
  const currentFilter = searchParams.get("status")?.toUpperCase() ?? null;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
        {FILTERS.map((filter) => {
          const isActive = filter.value === currentFilter;
          const href = filter.value
            ? `/about/constitution/amendments?status=${filter.value}`
            : "/about/constitution/amendments";

          return (
            <Tooltip key={filter.label}>
              <TooltipTrigger asChild>
                <Link href={href}>
                  <Button
                    size="sm"
                    variant={isActive ? "default" : "neutral"}
                    className="whitespace-nowrap shrink-0"
                  >
                    {filter.label}
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>{filter.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
