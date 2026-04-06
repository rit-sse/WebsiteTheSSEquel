import {
  RadixTooltip as Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar } from "lucide-react";

type TimelineEvent = {
  label: string;
  date: string | null;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function AmendmentTimeline({ events }: { events: TimelineEvent[] }) {
  const activeEvents = events.filter((e) => e.date !== null);

  if (activeEvents.length === 0) return null;

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground/50 mt-0.5 hidden sm:block" />
        {activeEvents.map((event) => (
          <Tooltip key={event.label}>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 text-xs cursor-help">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/50 shrink-0" />
                <span className="text-muted-foreground">{event.label}</span>
                <span className="tabular-nums font-medium text-foreground">
                  {formatDate(event.date!)}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{formatDateTime(event.date!)}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
