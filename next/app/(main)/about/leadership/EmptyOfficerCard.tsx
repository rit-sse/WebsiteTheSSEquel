"use client"

import { Card } from "@/components/ui/card";
import { OfficerPosition } from "./team";
import { UserPlus } from "lucide-react";

interface EmptyOfficerCardProps {
  position: OfficerPosition;
  children?: React.ReactNode;
}

export default function EmptyOfficerCard({ position, children }: EmptyOfficerCardProps) {
  return (
    <Card depth={2} className="w-full max-w-[280px] p-5 flex flex-col items-center text-center h-full">
      {/* Placeholder Avatar */}
      <div className="mb-3 w-24 h-24 rounded-full bg-surface-4 flex items-center justify-center">
        <UserPlus className="w-10 h-10 text-muted-foreground" />
      </div>

      {/* Position Title */}
      <h4 className="font-bold text-lg text-muted-foreground">Position Open</h4>
      <div className="accent-rule accent-rule-green mt-1 mb-2" aria-hidden="true" />
      <p className="text-sm font-semibold text-chart-2 dark:text-chart-8 mb-2">{position.title}</p>
      <div className="h-0.5 w-[94%] bg-chart-4/35 rounded-full mb-3" aria-hidden="true" />
      
      {/* Description placeholder */}
      <p className="text-sm text-muted-foreground flex-grow italic">
        This position is currently unfilled
      </p>
      
      {/* Contact placeholder */}
      <div className="flex gap-3 mt-4 pt-3 border-t border-chart-4/40 w-full justify-center">
        <span className="text-xs text-muted-foreground">
          Interested? Contact a current officer!
        </span>
      </div>

      {/* Action buttons slot (for officers to assign someone) */}
      {children && (
        <div className="mt-3 pt-3 border-t border-chart-4/40 w-full">
          {children}
        </div>
      )}
    </Card>
  );
}
