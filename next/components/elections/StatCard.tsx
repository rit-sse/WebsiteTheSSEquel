import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  iconBg?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  subtitle,
  iconBg = "bg-primary/10 text-primary",
  className,
}: StatCardProps) {
  return (
    <Card depth={2} className={cn("p-4", className)}>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
            iconBg
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-display font-bold leading-none">
            {value}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          {subtitle && (
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
