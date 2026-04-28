"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, X, Mail, Clock } from "lucide-react";

/**
 * Three-state invite slot used across the app wherever a user is being
 * assigned or invited into a role:
 *
 *   - empty     → dashed border, UserPlus icon, "Invite" button
 *   - pending   → amber background, avatar (or Mail icon fallback) +
 *                 primary + Clock-secondary + "Pending" badge + cancel X
 *   - filled    → bg-surface-2 with the assigned user's full card + remove X
 *
 * Originally extracted from the officers/positions admin page
 * (`OfficerAssignmentCard`) so the same visual language can be reused
 * for election nominations and running-mate invitations.
 */

export interface UserInviteSlotFilled {
  /** Primary line — typically the assigned user's name. */
  primary: string;
  /** Secondary line — date range for officers, "Accepted — you are
   * running as a ticket" for running mates, etc. */
  secondary: string;
  /** Rendered avatar element — caller supplies `<Avatar>` for officers,
   * `<ElectionAvatar>` for elections, etc. */
  avatar: ReactNode;
}

export interface UserInviteSlotPending {
  /** Primary line — typically the invited email OR the invitee's name. */
  primary: string;
  /** Secondary line — typically "Invited X days ago" or
   * "Pending · 22h remaining". Wrapped with a Clock icon. */
  secondary: string;
  /** Optional custom avatar node. Defaults to the Mail-in-amber-circle
   * that the officer flow uses when it only has an email. */
  avatar?: ReactNode;
  /** Override the default "Pending" badge label. */
  badgeLabel?: string;
}

interface UserInviteSlotProps {
  /** When non-null, the slot renders the filled (accepted) state. */
  user: UserInviteSlotFilled | null;
  /** When non-null and `user` is null, the slot renders the pending
   * (yellow) state. */
  pendingInvitation: UserInviteSlotPending | null;
  /** Empty-state body text. Default: "No officer assigned". */
  emptyLabel?: string;
  /** Empty-state invite button label. Default: "Invite". */
  inviteLabel?: string;
  /** Tooltip for the filled-state remove button. Default: "Remove". */
  removeTitle?: string;
  /** Tooltip for the pending-state cancel button.
   * Default: "Cancel invitation". */
  cancelTitle?: string;
  onInvite: () => void;
  /** Called when the filled-state X button is clicked. Omit to hide
   * the button entirely (e.g. the nomination flow has no "un-nominate"
   * endpoint). */
  onRemove?: () => void;
  /** Called when the pending-state X button is clicked. Omit to hide
   * the button. */
  onCancelInvitation?: () => void;
  /** Disables all buttons while true (e.g. while a mutation is in
   * flight). */
  disabled?: boolean;
  /** Suppresses every action button — display-only. */
  readOnly?: boolean;
}

export default function UserInviteSlot({
  user,
  pendingInvitation,
  emptyLabel = "No officer assigned",
  inviteLabel = "Invite",
  removeTitle = "Remove",
  cancelTitle = "Cancel invitation",
  onInvite,
  onRemove,
  onCancelInvitation,
  disabled = false,
  readOnly = false,
}: UserInviteSlotProps) {
  // State 1: Filled — user has been assigned / accepted.
  if (user) {
    return (
      <div className="flex items-center gap-3 p-2 rounded-lg bg-surface-2 border border-border/30">
        <div className="shrink-0">{user.avatar}</div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{user.primary}</div>
          <div className="text-xs text-muted-foreground truncate">
            {user.secondary}
          </div>
        </div>
        {!readOnly && onRemove && (
          <Button
            size="xs"
            variant="destructiveGhost"
            onClick={onRemove}
            disabled={disabled}
            title={removeTitle}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  // State 2: Pending — invitation is out, awaiting response.
  if (pendingInvitation) {
    return (
      <div className="flex items-center gap-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30">
        <div className="shrink-0">
          {pendingInvitation.avatar ?? (
            <div className="h-8 w-8 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center">
              <Mail className="h-4 w-4 text-amber-700 dark:text-amber-300" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate text-amber-900 dark:text-amber-100">
            {pendingInvitation.primary}
          </div>
          <div className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
            <Clock className="h-3 w-3 shrink-0" />
            <span className="truncate">{pendingInvitation.secondary}</span>
          </div>
        </div>
        <span className="shrink-0 px-2 py-0.5 rounded text-xs font-medium bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200">
          {pendingInvitation.badgeLabel ?? "Pending"}
        </span>
        {!readOnly && onCancelInvitation && (
          <Button
            size="xs"
            variant="ghost"
            onClick={onCancelInvitation}
            disabled={disabled}
            title={cancelTitle}
            className="text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  // State 3: Empty — nothing assigned, nothing pending.
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg border border-dashed border-border/50 bg-surface-1/50">
      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
        <UserPlus className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-muted-foreground italic">
          {emptyLabel}
        </span>
      </div>
      {!readOnly && (
        <Button
          size="xs"
          variant="outline"
          onClick={onInvite}
          disabled={disabled}
        >
          <UserPlus className="h-3 w-3 mr-1" />
          {inviteLabel}
        </Button>
      )}
    </div>
  );
}
