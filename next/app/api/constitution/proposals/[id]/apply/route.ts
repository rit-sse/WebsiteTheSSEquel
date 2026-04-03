import { NextRequest, NextResponse } from "next/server";
import { ConstitutionProposalStatus } from "@prisma/client";
import { ApiError } from "@/lib/apiError";
import prisma from "@/lib/prisma";
import {
  getConstitutionActorFromRequest,
  getViewerPrimaryOfficerSlots,
} from "@/lib/constitution/auth";
import { getCurrentConstitutionDocument } from "@/lib/constitution/document";
import { commitConstitutionMarkdownToGitHub } from "@/lib/constitution/github";
import {
  buildConstitutionProposalView,
  constitutionProposalDetailInclude,
} from "@/lib/constitution/proposals";
import { getConstitutionProposalComputedStatus } from "@/lib/constitution/status";

export const dynamic = "force-dynamic";

function parseProposalId(raw: string) {
  const proposalId = Number(raw);
  if (!proposalId || Number.isNaN(proposalId)) {
    throw ApiError.badRequest("Invalid proposal id");
  }
  return proposalId;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { authLevel } = await getConstitutionActorFromRequest(request);
    if (!authLevel.isPresident) {
      return ApiError.forbidden();
    }

    const { id } = await context.params;
    const proposalId = parseProposalId(id);
    const [proposal, document, activePrimaryCount, viewerPrimaryOfficerSlots] =
      await Promise.all([
      prisma.constitutionProposal.findUnique({
        where: { id: proposalId },
        include: constitutionProposalDetailInclude,
      }),
      getCurrentConstitutionDocument(),
      prisma.officer.count({
        where: {
          is_active: true,
          position: { is_primary: true },
        },
      }),
      getViewerPrimaryOfficerSlots(authLevel.userId),
    ]);

    if (!proposal) {
      return ApiError.notFound("Constitution proposal");
    }

    const status = getConstitutionProposalComputedStatus(proposal, {
      currentDocumentSha: document.sha,
    });

    if (status === "APPLIED") {
      return ApiError.conflict("This proposal has already been applied");
    }
    if (status !== "PASSED") {
      return ApiError.conflict("Only passed proposals can be applied");
    }
    if (proposal.baseDocumentSha !== document.sha) {
      await prisma.constitutionProposal.update({
        where: { id: proposalId },
        data: { status: ConstitutionProposalStatus.STALE },
      });
      return ApiError.conflict("This proposal is stale and must be rebased");
    }

    const commit = await commitConstitutionMarkdownToGitHub({
      nextMarkdown: proposal.fullProposedMarkdown,
      expectedSha: document.sha,
      commitMessage: `Apply constitution amendment #${proposal.id}: ${proposal.title}`,
    });

    const updated = await prisma.constitutionProposal.update({
      where: { id: proposalId },
      data: {
        status: ConstitutionProposalStatus.APPLIED,
        appliedAt: new Date(),
        appliedCommitSha: commit.commitSha,
      },
      include: constitutionProposalDetailInclude,
    });

    return NextResponse.json(
      buildConstitutionProposalView(updated, authLevel, {
        currentDocumentSha: commit.contentSha || document.sha,
        activePrimaryCount,
        viewerPrimaryOfficerSlots,
      })
    );
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error("Error applying constitution proposal:", error);
    return ApiError.internal();
  }
}
