"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AmendmentStatusBadge from "@/components/amendments/AmendmentStatusBadge";
import { FileEdit, Vote, ThumbsUp, ThumbsDown } from "lucide-react";
import type { AmendmentStatus } from "@prisma/client";

type AmendmentRow = {
  id: number;
  title: string;
  status: AmendmentStatus;
  totalVotes: number;
  approveVotes: number;
  rejectVotes: number;
  author?: { id: number; name: string | null };
};

type AmendmentMyActivityProps = {
  amendments: AmendmentRow[];
  userId: number | null;
  userVotes: Record<number, boolean>;
};

export default function AmendmentMyActivity({
  amendments,
  userId,
  userVotes,
}: AmendmentMyActivityProps) {
  const myProposals = amendments.filter((a) => a.author?.id === userId);
  const myVotedAmendments = amendments.filter((a) => a.id in userVotes);

  return (
    <div className="space-y-6">
      {/* My Proposals */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FileEdit className="h-4 w-4 text-primary/60" />
          <h3 className="font-display font-semibold text-sm">My Proposals</h3>
          <span className="text-xs text-muted-foreground ml-auto">
            {myProposals.length} total
          </span>
        </div>
        {myProposals.length === 0 ? (
          <Card depth={3} className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              You haven&apos;t proposed any amendments yet.
            </p>
            <Button asChild size="sm">
              <Link href="/about/constitution/amendments/new">Start a Proposal</Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-2">
            {myProposals.map((amendment) => (
              <Card key={amendment.id} depth={3} className="p-3 flex items-center gap-3">
                <AmendmentStatusBadge status={amendment.status} />
                <Link
                  href={`/about/constitution/amendments/${amendment.id}`}
                  className="text-sm font-medium hover:text-primary transition-colors truncate flex-1"
                >
                  {amendment.title}
                </Link>
                <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                  {amendment.totalVotes} votes
                </span>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* My Votes */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Vote className="h-4 w-4 text-primary/60" />
          <h3 className="font-display font-semibold text-sm">My Votes</h3>
          <span className="text-xs text-muted-foreground ml-auto">
            {myVotedAmendments.length} cast
          </span>
        </div>
        {myVotedAmendments.length === 0 ? (
          <Card depth={3} className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              You haven&apos;t voted on any amendments yet.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {myVotedAmendments.map((amendment) => {
              const myVote = userVotes[amendment.id];
              return (
                <Card key={amendment.id} depth={3} className="p-3 flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                      myVote
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                    }`}
                  >
                    {myVote ? (
                      <ThumbsUp className="h-3 w-3" />
                    ) : (
                      <ThumbsDown className="h-3 w-3" />
                    )}
                    {myVote ? "Approved" : "Rejected"}
                  </span>
                  <Link
                    href={`/about/constitution/amendments/${amendment.id}`}
                    className="text-sm font-medium hover:text-primary transition-colors truncate flex-1"
                  >
                    {amendment.title}
                  </Link>
                  <AmendmentStatusBadge status={amendment.status} />
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
