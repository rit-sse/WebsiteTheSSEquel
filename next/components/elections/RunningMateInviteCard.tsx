"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ElectionAvatar } from "@/components/elections/ElectionAvatar";
import UserInviteSlot from "@/components/common/UserInviteSlot";
import UserSearchInviteModal, {
  type UserSearchResult,
} from "@/components/common/UserSearchInviteModal";

/**
 * Amendment 12: presidential nominees pick their own VP running mate after
 * their nomination is accepted + approved. This card is shown on the
 * presidential nominee's election detail page (ElectionPublicClient).
 *
 * UI matches the officers/positions admin pattern — a three-state slot
 * (empty / pending / filled) with an "Invite" button that opens the
 * shared `<UserSearchInviteModal>` for picking an active member.
 */

type InviteStatus =
  | "INVITED"
  | "ACCEPTED"
  | "DECLINED"
  | "EXPIRED"
  | "WITHDRAWN";

export interface RunningMateInvitation {
  id: number;
  status: InviteStatus;
  expiresAt: string;
  invitee: {
    id: number;
    name: string;
    email: string;
    image?: string | null;
  };
}

interface Props {
  electionId: number;
  nominationId: number;
  invitation: RunningMateInvitation | null;
  /** Called after a successful server mutation so the parent can refresh. */
  onChange?: () => void;
}

function formatExpiry(iso: string): string {
  const target = new Date(iso).getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) return "expired";
  const hours = Math.floor(diff / (60 * 60 * 1000));
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d remaining`;
  }
  return `${hours}h remaining`;
}

export default function RunningMateInviteCard({
  electionId,
  nominationId,
  invitation,
  onChange,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const active =
    invitation &&
    (invitation.status === "INVITED" || invitation.status === "ACCEPTED");

  const invite = useCallback(
    async (inviteeUserId: number) => {
      setSubmitting(true);
      try {
        const response = await fetch(
          `/api/elections/${electionId}/nominations/${nominationId}/running-mate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ inviteeUserId }),
          }
        );
        if (!response.ok) {
          const msg =
            (await response.text()) || "Failed to send running-mate invite";
          toast.error(msg);
          throw new Error(msg);
        }
        toast.success("Running-mate invite sent");
        onChange?.();
      } finally {
        setSubmitting(false);
      }
    },
    [electionId, nominationId, onChange]
  );

  const revoke = useCallback(async () => {
    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/elections/${electionId}/nominations/${nominationId}/running-mate`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        toast.error(
          (await response.text()) || "Failed to revoke running-mate invite"
        );
        return;
      }
      toast.success("Running-mate invite revoked");
      onChange?.();
    } catch {
      toast.error("Failed to revoke running-mate invite");
    } finally {
      setSubmitting(false);
    }
  }, [electionId, nominationId, onChange]);

  // Map the invitation into UserInviteSlot's three states.
  const filled =
    active && invitation && invitation.status === "ACCEPTED"
      ? {
          primary: invitation.invitee.name,
          secondary: "Accepted — you are running as a ticket",
          avatar: (
            <ElectionAvatar
              user={invitation.invitee}
              className="h-8 w-8 border-2 border-black"
              fallbackClassName="text-xs"
            />
          ),
        }
      : null;

  const pending =
    active && invitation && invitation.status === "INVITED"
      ? {
          primary: invitation.invitee.name,
          secondary: `Pending · ${formatExpiry(invitation.expiresAt)}`,
          // Show the real person with an amber ring so the yellow
          // state reads visually while still identifying them.
          avatar: (
            <ElectionAvatar
              user={invitation.invitee}
              className="h-8 w-8 border-2 border-amber-500 ring-2 ring-amber-200 dark:ring-amber-700/40"
              fallbackClassName="text-xs"
            />
          ),
          badgeLabel: "Invited",
        }
      : null;

  return (
    <Card depth={2} className="overflow-hidden">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          <CardTitle>Step 2 &middot; Running mate</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Invite any active member to run as your Vice President. They&rsquo;ll
          get an email to accept &mdash; President and VP appear together on
          the ballot as a ticket.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <UserInviteSlot
          user={filled}
          pendingInvitation={pending}
          emptyLabel="No running mate invited"
          inviteLabel="Invite running mate"
          removeTitle="Withdraw running mate"
          cancelTitle="Revoke invitation"
          onInvite={() => setModalOpen(true)}
          onRemove={revoke}
          onCancelInvitation={revoke}
          disabled={submitting}
        />

        {invitation && !active && (
          <p className="rounded-lg bg-surface-2 p-3 text-xs text-muted-foreground">
            Previous invite to{" "}
            <strong className="text-foreground">
              {invitation.invitee.name}
            </strong>{" "}
            was <em>{invitation.status.toLowerCase()}</em>. You can invite
            someone else.
          </p>
        )}

        {filled && (
          <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-3 w-3" />
            You&rsquo;ll appear together on the ballot as a ticket.
          </p>
        )}
      </CardContent>

      <UserSearchInviteModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Invite a running mate"
        description="Pick an active member to run as Vice President on your ticket. They'll receive an email and must accept for the ticket to appear on the ballot."
        confirmLabel="Send invite"
        onInvite={invite}
        renderAvatar={(user: UserSearchResult) => (
          <ElectionAvatar
            user={user}
            className="h-9 w-9 border-2 border-black shrink-0"
            fallbackClassName="text-xs"
          />
        )}
        searchPlaceholder="Search active members by name or email…"
      />
    </Card>
  );
}
