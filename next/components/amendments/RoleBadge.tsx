import {
  RadixTooltip as Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Shield, Crown } from "lucide-react";

type RoleBadgeProps = {
  role: "President" | "Vice President" | "SE Admin" | string;
  className?: string;
};

export default function RoleBadge({ role, className = "" }: RoleBadgeProps) {
  const isSeAdmin = role === "SE Admin";
  const Icon = isSeAdmin ? Shield : Crown;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold tracking-wide cursor-help ${
              isSeAdmin
                ? "bg-violet-500/10 text-violet-700 dark:text-violet-300"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
            } ${className}`}
          >
            <Icon className="h-3 w-3" />
            {role}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isSeAdmin
              ? "SE Admin can manage all amendment lifecycle stages"
              : `${role} can manage amendment status, voting, and merging`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
