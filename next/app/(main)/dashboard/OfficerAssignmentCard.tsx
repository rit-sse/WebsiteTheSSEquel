"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/userDisplay";
import UserInviteSlot from "@/components/common/UserInviteSlot";

/**
 * Officer-specific wrapper around the shared `<UserInviteSlot>`. Accepts
 * the officer + pending-invitation data shapes this admin page already
 * uses and maps them into the generic slot's filled / pending display.
 */

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
  readOnly?: boolean;
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
  readOnly = false,
}: OfficerAssignmentCardProps) {
  const filled = officer
    ? {
        primary: officer.name,
        secondary: `${formatDate(officer.start_date)} — ${formatDate(
          officer.end_date
        )}`,
        avatar: (
          <Avatar className="h-8 w-8">
            {officer.image ? (
              <AvatarImage src={officer.image} alt={officer.name} />
            ) : null}
            <AvatarFallback className="text-xs">
              {getInitials(officer.name)}
            </AvatarFallback>
          </Avatar>
        ),
      }
    : null;

  const pending = pendingInvitation
    ? {
        primary: pendingInvitation.invitedEmail,
        secondary: `Invited ${formatTimeAgo(pendingInvitation.createdAt)}`,
      }
    : null;

  return (
    <UserInviteSlot
      user={filled}
      pendingInvitation={pending}
      emptyLabel="No officer assigned"
      inviteLabel="Invite"
      removeTitle="Remove officer"
      cancelTitle="Cancel invitation"
      onInvite={onInvite}
      onRemove={onRemove}
      onCancelInvitation={onCancelInvitation}
      disabled={disabled}
      readOnly={readOnly}
    />
  );
}
