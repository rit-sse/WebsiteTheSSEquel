import Link from "next/link";
import { NeoCard } from "@/components/ui/neo-card";
import { getAuthLevel } from "@/lib/services/authLevelService";
import prisma from "@/lib/prisma";
import { computeVoteSummary } from "@/lib/services/amendmentService";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AmendmentCard from "@/components/amendments/AmendmentCard";
import AmendmentEmptyState from "@/components/amendments/AmendmentEmptyState";
import WithdrawnAmendments from "@/components/amendments/WithdrawnAmendments";

export default async function AmendmentsListPage() {
  const authLevel = await getAuthLevel();

  const amendments = await prisma.amendment.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      author: {
        select: {
          id: true,
          name: true,
        },
      },
      votes: {
        select: { approve: true, userId: true, phase: true },
      },
    },
  });

  const rows = amendments.map((amendment) => {
    const memberVotes = amendment.votes.filter((v) => v.phase === "VOTING");
    return {
      id: amendment.id,
      title: amendment.title,
      description: amendment.description,
      status: amendment.status,
      originalContent: amendment.originalContent,
      proposedContent: amendment.proposedContent,
      author: amendment.author,
      ...computeVoteSummary(memberVotes),
    };
  });

  // Build a map of the current user's member votes
  const userVotes: Record<number, boolean> = {};
  if (authLevel.userId) {
    for (const amendment of amendments) {
      const vote = amendment.votes.find(
        (v) => v.userId === authLevel.userId && v.phase === "VOTING",
      );
      if (vote) {
        userVotes[amendment.id] = vote.approve;
      }
    }
  }

  const emptyRole = authLevel.isSeAdmin
    ? ("seAdmin" as const)
    : authLevel.isPrimary
      ? ("primary" as const)
      : authLevel.isOfficer
        ? ("officer" as const)
        : authLevel.isMember
          ? ("member" as const)
          : authLevel.isUser
            ? ("signedIn" as const)
            : ("anonymous" as const);

  const activeRows = rows.filter(
    (r) => r.status !== "WITHDRAWN" && r.status !== "REJECTED",
  );
  const withdrawnRows = rows.filter(
    (r) => r.status === "WITHDRAWN" || r.status === "REJECTED",
  );

  return (
    <section className="w-full max-w-6xl px-3 sm:px-4">
      {/* Page header */}
      <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight sm:text-3xl">
            Constitutional Amendments
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Propose, discuss, and vote on changes to the SSE governing documents
          </p>
        </div>
        {authLevel.isMember && (
          <Button asChild className="w-full sm:w-auto">
            <Link
              href="/about/constitution/amendments/new"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Propose Amendment
            </Link>
          </Button>
        )}
      </div>

      {/* Amendment cards */}
      <NeoCard depth={1} className="p-4 md:p-6 space-y-4">
        {activeRows.length === 0 && withdrawnRows.length === 0 ? (
          <AmendmentEmptyState role={emptyRole} />
        ) : (
          <>
            {activeRows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No active amendments right now.
              </p>
            ) : (
              <div className="space-y-3">
                {activeRows.map((amendment) => (
                  <AmendmentCard
                    key={amendment.id}
                    amendment={amendment}
                    userVote={userVotes[amendment.id] ?? null}
                    isAuthor={amendment.author?.id === authLevel.userId}
                  />
                ))}
              </div>
            )}

            {withdrawnRows.length > 0 && (
              <WithdrawnAmendments
                amendments={withdrawnRows}
                userVotes={userVotes}
                userId={authLevel.userId}
              />
            )}
          </>
        )}
      </NeoCard>
    </section>
  );
}
