"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle, Loader2, Mail, Send } from "lucide-react";
import {
  NeoCard,
  NeoCardContent,
  NeoCardHeader,
  NeoCardTitle,
} from "@/components/ui/neo-card";
import { Card } from "@/components/ui/card";
import NeoBrutalistButton from "@/components/neo-brutalist-button";
import { ElectionAvatar } from "@/components/elections/ElectionAvatar";

export interface DispatchRecipient {
  positionTitle: string;
  name: string;
  email: string;
  userId: number;
  /** Resolved profile image URL so the recipient chip shows the
   * officer's actual photo when available. */
  image: string | null;
}

interface Props {
  electionId: number;
  electionTitle: string;
  electionSlug: string;
  recipients: DispatchRecipient[];
}

export default function NewSemesterClient({
  electionId,
  electionTitle,
  electionSlug,
  recipients,
}: Props) {
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState<number | null>(null);

  const send = async () => {
    setSending(true);
    try {
      const response = await fetch(
        `/api/elections/${electionId}/send-officer-invites`,
        { method: "POST" }
      );
      if (!response.ok) {
        toast.error((await response.text()) || "Failed to send invites");
        return;
      }
      const data = await response.json();
      setSentCount(data.dispatched?.length ?? recipients.length);
      toast.success(
        `Sent ${data.dispatched?.length ?? recipients.length} officer invites`
      );
    } catch {
      toast.error("Failed to send invites");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="election-scope w-full max-w-4xl space-y-6">
      <nav className="text-sm text-muted-foreground">
        <Link
          href={`/elections/${electionSlug}`}
          className="hover:text-foreground transition-colors"
        >
          ← Back to {electionTitle}
        </Link>
      </nav>

      <NeoCard depth={1}>
        <NeoCardHeader>
          <p className="eyebrow">SE Office · New Semester</p>
          <NeoCardTitle className="text-3xl">
            Send our primary invites
          </NeoCardTitle>
        </NeoCardHeader>
        <NeoCardContent className="space-y-6">
          <p className="text-sm text-muted-foreground max-w-prose">
            The previous term&rsquo;s memberships, mentors, and committee
            heads have been cleared. Pressing <strong>Send invites</strong>{" "}
            will dispatch officer invitations to each newly-elected primary.
            Each invitee receives an email with a sign-in link; on first
            sign-in they&rsquo;re installed as an officer for the new term.
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            {recipients.map((r) => (
              <Card
                key={`${r.positionTitle}-${r.email}`}
                depth={2}
                className="flex items-center gap-3 p-4"
              >
                <ElectionAvatar
                  user={{
                    id: r.userId || r.email,
                    name: r.name,
                    image: r.image,
                  }}
                  className="h-11 w-11 border-2 border-black"
                  fallbackClassName="text-xs"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {r.positionTitle}
                  </p>
                  <p className="truncate font-display text-base font-bold">
                    {r.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    <Mail className="mr-1 inline h-3 w-3" />
                    {r.email}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t border-border/40 pt-5">
            {sentCount !== null ? (
              <div className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600">
                <CheckCircle className="h-4 w-4" />
                Sent {sentCount} invite{sentCount === 1 ? "" : "s"}.
              </div>
            ) : (
              <NeoBrutalistButton
                text={sending ? "Sending…" : "Send our primary invites"}
                variant="pink"
                icon={
                  sending ? (
                    <Loader2 className="h-[18px] w-[18px] animate-spin" />
                  ) : (
                    <Send className="h-[18px] w-[18px]" />
                  )
                }
                onClick={send}
                disabled={sending || recipients.length === 0}
              />
            )}
            {sentCount !== null && (
              <Link
                href="/dashboard/elections"
                className="text-sm text-primary hover:underline"
              >
                Back to elections dashboard
              </Link>
            )}
          </div>
        </NeoCardContent>
      </NeoCard>
    </section>
  );
}
