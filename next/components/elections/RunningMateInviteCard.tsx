"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { CheckCircle, Clock, Mail, Search, Send, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import NeoBrutalistButton from "@/components/neo-brutalist-button";
import { electionAvatarStyle } from "@/components/elections/electionAvatarColor";

/**
 * Amendment 12: presidential nominees pick their own VP running mate after
 * their nomination is accepted + approved. This card is shown on the
 * presidential nominee's election detail page (ElectionPublicClient).
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

interface UserSearchResult {
  id: number;
  name: string;
  email: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
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
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const active =
    invitation &&
    (invitation.status === "INVITED" || invitation.status === "ACCEPTED");

  const doSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const response = await fetch(
        `/api/user/search?q=${encodeURIComponent(query.trim())}`
      );
      if (!response.ok) {
        toast.error((await response.text()) || "Failed to search members");
        return;
      }
      const data = await response.json();
      setResults(data.items ?? []);
    } catch {
      toast.error("Failed to search members");
    } finally {
      setSearching(false);
    }
  }, [query]);

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
          toast.error(
            (await response.text()) || "Failed to send running-mate invite"
          );
          return;
        }
        toast.success("Running-mate invite sent");
        setQuery("");
        setResults([]);
        onChange?.();
      } catch {
        toast.error("Failed to send running-mate invite");
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
      <CardContent className="space-y-4">
        {invitation && active ? (
          <div className="flex items-center gap-3 rounded-lg bg-surface-2 p-3">
            <Avatar
              className="h-10 w-10 border-2 border-black"
              style={electionAvatarStyle(invitation.invitee.id)}
            >
              <AvatarFallback
                className="text-xs font-bold font-display"
                style={electionAvatarStyle(invitation.invitee.id)}
              >
                {getInitials(invitation.invitee.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {invitation.invitee.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {invitation.status === "ACCEPTED" ? (
                  <>
                    <CheckCircle className="mr-1 inline h-3 w-3 text-emerald-500" />
                    Accepted &mdash; you are running as a ticket
                  </>
                ) : (
                  <>
                    <Clock className="mr-1 inline h-3 w-3 text-amber-500" />
                    Invitation pending &middot; {formatExpiry(invitation.expiresAt)}
                  </>
                )}
              </p>
            </div>
            {invitation.status === "ACCEPTED" ? (
              <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">
                Accepted
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-500 text-amber-600">
                Pending
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={revoke}
              disabled={submitting}
              aria-label="Revoke running-mate invitation"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            {invitation && (
              <div className="rounded-lg bg-surface-2 p-3 text-sm text-muted-foreground">
                Previous invite to{" "}
                <strong className="text-foreground">
                  {invitation.invitee.name}
                </strong>{" "}
                was <em>{invitation.status.toLowerCase()}</em>. You can invite
                someone else.
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="running-mate-search">Search active members</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="running-mate-search"
                    className="pl-9"
                    placeholder="Search by name or email..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        doSearch();
                      }
                    }}
                  />
                </div>
                <NeoBrutalistButton
                  text="Search"
                  variant="pink"
                  size="sm"
                  icon={<Mail className="h-4 w-4" />}
                  onClick={doSearch}
                  disabled={searching || !query.trim()}
                />
              </div>
            </div>
            {results.length > 0 && (
              <div className="space-y-1 rounded-lg border border-border/40 p-1">
                {results.map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => invite(r.id)}
                    disabled={submitting}
                    className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-muted/50 disabled:opacity-50"
                  >
                    <Avatar
                      className="h-8 w-8 border-2 border-black"
                      style={electionAvatarStyle(r.id)}
                    >
                      <AvatarFallback
                        className="text-xs font-bold font-display"
                        style={electionAvatarStyle(r.id)}
                      >
                        {getInitials(r.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.email}
                      </p>
                    </div>
                    <Send className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
