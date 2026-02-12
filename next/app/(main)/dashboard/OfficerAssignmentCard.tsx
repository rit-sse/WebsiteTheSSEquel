"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlus, X, Mail, Clock } from "lucide-react";

interface Officer {
  id: number;
  userId: number;
  name: string;
  email: string;
  image?: string;
  start_date: string;
  end_date: string;
}

interface PendingInvitation {
  id: number;
  invitedEmail: string;
  createdAt: string;
  expiresAt: string;
  inviter: {
    name: string;
    email: string;
  };
}

interface OfficerAssignmentCardProps {
  officer: Officer | null;
  pendingInvitation: PendingInvitation | null;
  onInvite: () => void;
  onRemove: () => void;
  onCancelInvitation: () => void;
  disabled?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  } catch {
    return dateStr;
  }
}

export default function OfficerAssignmentCard({
  officer,
  pendingInvitation,
  onInvite,
  onRemove,
  onCancelInvitation,
  disabled = false,
}: OfficerAssignmentCardProps) {
  // State 1: Officer is assigned
  if (officer) {
    return (
      <div className="flex items-center gap-3 p-2 rounded-lg bg-surface-4 border-2 border-black/20">
        <Avatar className="h-8 w-8">
          <AvatarImage src={officer.image} alt={officer.name} />
          <AvatarFallback className="text-xs bg-chart-5 text-white">
            {getInitials(officer.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{officer.name}</div>
          <div className="text-xs text-muted-foreground truncate">
            {formatDate(officer.start_date)} — {formatDate(officer.end_date)}
          </div>
        </div>
        <Button
          size="xs"
          variant="destructiveGhost"
          onClick={onRemove}
          disabled={disabled}
          title="Remove officer"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  // State 2: Pending invitation
  if (pendingInvitation) {
    return (
      <div className="flex items-center gap-3 p-2 rounded-lg bg-accentScale-5 border border-accentScale-5">
        <div className="h-8 w-8 rounded-full bg-black/10 flex items-center justify-center">
          <Mail className="h-4 w-4 text-white/80" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate text-white">
            {pendingInvitation.invitedEmail}
          </div>
          <div className="flex items-center gap-1 text-xs text-white/70">
            <Clock className="h-3 w-3" />
            <span>Invited {formatTimeAgo(pendingInvitation.createdAt)}</span>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-white/20 text-white border border-white/30">
          Pending
        </span>
        <Button
          size="xs"
          variant="ghost"
          onClick={onCancelInvitation}
          disabled={disabled}
          title="Cancel invitation"
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  // State 3: No officer assigned
  return (
    <div
      className="flex items-center gap-3 p-2 rounded-lg bg-surface-4 border-2 border-black/20 cursor-pointer transition-all duration-150 hover:bg-surface-4 hover:border-black/35"
      onClick={!disabled ? onInvite : undefined}
      role="button"
      tabIndex={0}
    >
      <div className="h-8 w-8 rounded-full bg-chart-5/20 flex items-center justify-center">
        <UserPlus className="h-4 w-4 text-chart-5" />
      </div>
      <div className="flex-1">
        <span className="text-sm text-foreground/70 italic">No officer assigned</span>
      </div>
      <Button
        size="xs"
        variant="default"
        onClick={(e) => { e.stopPropagation(); onInvite(); }}
        disabled={disabled}
        className="bg-accentScale-3 hover:bg-accentScale-3/90 text-black border-black/25"
      >
        <UserPlus className="h-3 w-3 mr-1" />
        Invite
      </Button>
    </div>
  );
}
