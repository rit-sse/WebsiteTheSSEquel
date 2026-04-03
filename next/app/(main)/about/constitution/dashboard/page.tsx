import Link from "next/link";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthLevel } from "@/lib/services/authLevelService";
import { getCurrentConstitutionDocument } from "@/lib/constitution/document";
import { getViewerPrimaryOfficerSlots } from "@/lib/constitution/auth";
import {
  buildConstitutionProposalView,
  constitutionProposalDetailInclude,
} from "@/lib/constitution/proposals";
import { ProposalStatusBadge } from "../ProposalStatusBadge";

function formatDate(dateString: string | Date | null) {
  if (!dateString) return "Unscheduled";
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function ConstitutionDashboardPage() {
  const authLevel = await getAuthLevel();
  const [document, activePrimaryCount, publicProposals, draftProposals, viewerPrimaryOfficerSlots] =
    await Promise.all([
      getCurrentConstitutionDocument(),
      prisma.officer.count({
        where: {
          is_active: true,
          position: { is_primary: true },
        },
      }),
      prisma.constitutionProposal.findMany({
        where: {
          status: {
            not: "DRAFT",
          },
        },
        include: constitutionProposalDetailInclude,
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      }),
      authLevel.userId
        ? prisma.constitutionProposal.findMany({
            where: {
              authorId: authLevel.userId,
              status: "DRAFT",
            },
            include: constitutionProposalDetailInclude,
            orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
          })
        : Promise.resolve([]),
      getViewerPrimaryOfficerSlots(authLevel.userId),
    ]);

  const proposalViews = publicProposals.map((proposal) =>
    buildConstitutionProposalView(proposal, authLevel, {
      currentDocumentSha: document.sha,
      activePrimaryCount,
      viewerPrimaryOfficerSlots,
    })
  );
  const draftViews = draftProposals.map((proposal) =>
    buildConstitutionProposalView(proposal, authLevel, {
      currentDocumentSha: document.sha,
      activePrimaryCount,
      viewerPrimaryOfficerSlots,
    })
  );

  return (
    <section className="py-8 px-4 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Card depth={1}>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
                Constitution Workflow
              </div>
              <CardTitle className="mt-2 text-3xl">Amendment Dashboard</CardTitle>
            </div>
            <Button asChild>
              <Link href="/about/constitution">Return to Constitution</Link>
            </Button>
          </CardHeader>
        </Card>

        {draftViews.length > 0 && (
          <Card depth={1}>
            <CardHeader>
              <CardTitle>Your Draft Amendments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {draftViews.map((proposal) => (
                <div
                  key={proposal.id}
                  className="rounded-lg border border-border/70 bg-background/60 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-xs text-muted-foreground">
                        Draft #{proposal.id}
                      </div>
                      <div className="text-lg font-semibold">{proposal.title}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {proposal.summary}
                      </div>
                    </div>
                    <ProposalStatusBadge status={proposal.computedStatus} />
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground font-mono">
                    section_path: {proposal.sectionHeadingPath}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/about/constitution?draft=${proposal.id}`}>
                        Continue Editing
                      </Link>
                    </Button>
                    <Button asChild size="sm">
                      <Link href={`/about/constitution/proposals/${proposal.id}`}>
                        Open Proposal
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card depth={1}>
          <CardHeader>
            <CardTitle>Submitted Amendment Proposals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {proposalViews.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
                No amendment proposals have been submitted yet.
              </div>
            ) : (
              proposalViews.map((proposal) => (
                <div
                  key={proposal.id}
                  className="rounded-lg border border-border/70 bg-background/60 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-xs text-muted-foreground">
                        Proposal #{proposal.id}
                      </div>
                      <div className="text-lg font-semibold">{proposal.title}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {proposal.summary}
                      </div>
                    </div>
                    <ProposalStatusBadge status={proposal.computedStatus} />
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                    <div>Author: {proposal.author.name}</div>
                    <div>Election start: {formatDate(proposal.electionStartsAt)}</div>
                    <div>Election end: {formatDate(proposal.electionEndsAt)}</div>
                  </div>
                  <div className="mt-2 font-mono text-xs text-muted-foreground">
                    section_path: {proposal.sectionHeadingPath}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/about/constitution/proposals/${proposal.id}`}>
                        View Diff
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
