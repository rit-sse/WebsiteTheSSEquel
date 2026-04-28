import prisma from "@/lib/prisma";
import { AmendmentStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import { getActorFromRequest } from "@/lib/services/amendmentService";
import {
  buildAmendmentBranchName,
  createAmendmentPR,
} from "@/lib/services/githubAmendmentService";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const amendmentId = Number(id);
  if (Number.isNaN(amendmentId)) {
    return new Response("Invalid amendment id", { status: 422 });
  }

  const actor = await getActorFromRequest(request);
  if (!actor) {
    return new Response("Authentication required", { status: 401 });
  }

  const amendment = await prisma.amendment.findUnique({
    where: { id: amendmentId },
    select: {
      id: true,
      title: true,
      description: true,
      proposedContent: true,
      authorId: true,
      githubPrNumber: true,
      status: true,
    },
  });
  if (!amendment) {
    return new Response("Amendment not found", { status: 404 });
  }

  if (!actor.isPrimary && !actor.isSeAdmin && amendment.authorId !== actor.id) {
    return new Response(
      "Only the author, a primary officer, or an SE admin can re-submit a PR",
      { status: 403 },
    );
  }

  if (amendment.githubPrNumber) {
    return new Response("This amendment already has a linked pull request", {
      status: 409,
    });
  }

  if (
    amendment.status !== AmendmentStatus.VOTING &&
    amendment.status !== AmendmentStatus.APPROVED
  ) {
    return new Response(
      "A PR can only be created after quorum has passed and member voting is open.",
      { status: 409 },
    );
  }

  const branchName = buildAmendmentBranchName(amendment.title, amendment.id);
  const proposedBy = `Member #${amendment.authorId}`;
  const prBody =
    amendment.description ||
    `${amendment.title}\n\nAmendment proposal by ${proposedBy}.`;

  try {
    const { prNumber, originalContent } = await createAmendmentPR({
      title: amendment.title,
      description: prBody,
      proposedContent: amendment.proposedContent,
      proposedBy,
      branchName,
    });

    const updated = await prisma.amendment.update({
      where: { id: amendment.id },
      data: {
        githubBranch: branchName,
        githubPrNumber: prNumber,
        originalContent,
      },
      select: {
        id: true,
        githubBranch: true,
        githubPrNumber: true,
        originalContent: true,
      },
    });

    return Response.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to re-submit PR";
    return new Response(message, { status: 500 });
  }
}
