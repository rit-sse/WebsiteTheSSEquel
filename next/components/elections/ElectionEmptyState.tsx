import { cn } from "@/lib/utils";
import { Vote } from "lucide-react";

interface ElectionEmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function ElectionEmptyState({
  title = "No elections yet",
  description = "Elections will appear here when they are created. Check back during election season!",
  icon,
  action,
  className,
}: ElectionEmptyStateProps) {
  return (
    <div className={cn("text-center py-16 space-y-4", className)}>
      <div className="mx-auto w-fit">
        {icon ?? (
          <Vote className="h-16 w-16 text-muted-foreground/30" />
        )}
      </div>
      <h3 className="text-xl font-display font-bold">{title}</h3>
      <p className="text-muted-foreground max-w-md mx-auto text-sm">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
