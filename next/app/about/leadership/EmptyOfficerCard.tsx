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
      <div className="mb-3 w-24 h-24 rounded-full bg-surface-2 flex items-center justify-center">
        <UserPlus className="w-10 h-10 text-muted-foreground" />
      </div>

      {/* Position Title */}
      <h4 className="font-bold text-lg text-muted-foreground">Position Open</h4>
      <p className="text-sm font-semibold text-primary mb-2">{position.title}</p>
      
      {/* Description placeholder */}
      <p className="text-sm text-muted-foreground flex-grow italic">
        This position is currently unfilled
      </p>
      
      {/* Contact placeholder */}
      <div className="flex gap-3 mt-4 pt-3 border-t border-border w-full justify-center">
        <span className="text-xs text-muted-foreground">
          Contact: {position.email}
        </span>
      </div>

      {/* Action buttons slot (for officers to assign someone) */}
      {children && (
        <div className="mt-3 pt-3 border-t border-border w-full">
          {children}
        </div>
      )}
    </Card>
  );
}
