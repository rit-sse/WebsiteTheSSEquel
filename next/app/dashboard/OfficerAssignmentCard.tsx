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
      <div className="flex items-center gap-3 p-2 rounded-lg bg-surface-2 border border-border/30">
        <Avatar className="h-8 w-8">
          <AvatarImage src={officer.image} alt={officer.name} />
          <AvatarFallback className="text-xs">
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
      <div className="flex items-center gap-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30">
        <div className="h-8 w-8 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center">
          <Mail className="h-4 w-4 text-amber-700 dark:text-amber-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate text-amber-900 dark:text-amber-100">
            {pendingInvitation.invitedEmail}
          </div>
          <div className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
            <Clock className="h-3 w-3" />
            <span>Invited {formatTimeAgo(pendingInvitation.createdAt)}</span>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200">
          Pending
        </span>
        <Button
          size="xs"
          variant="ghost"
          onClick={onCancelInvitation}
          disabled={disabled}
          title="Cancel invitation"
          className="text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  // State 3: No officer assigned
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg border border-dashed border-border/50 bg-surface-1/50">
      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
        <UserPlus className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <span className="text-sm text-muted-foreground italic">No officer assigned</span>
      </div>
      <Button
        size="xs"
        variant="outline"
        onClick={onInvite}
        disabled={disabled}
      >
        <UserPlus className="h-3 w-3 mr-1" />
        Invite
      </Button>
    </div>
  );
}
