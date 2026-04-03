import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "@/lib/apiError";
import prisma from "@/lib/prisma";
import {
  getConstitutionActorFromRequest,
  getViewerPrimaryOfficerSlots,
} from "@/lib/constitution/auth";
import { getCurrentConstitutionDocument } from "@/lib/constitution/document";
import {
  buildConstitutionProposalView,
  constitutionProposalDetailInclude,
} from "@/lib/constitution/proposals";
import { getConstitutionProposalComputedStatus } from "@/lib/constitution/status";

export const dynamic = "force-dynamic";

type VotePayload = {
  choice?: string;
};

function parseProposalId(raw: string) {
  const proposalId = Number(raw);
  if (!proposalId || Number.isNaN(proposalId)) {
    throw ApiError.badRequest("Invalid proposal id");
  }
  return proposalId;
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { authLevel, user } = await getConstitutionActorFromRequest(request);
    if (!user) {
      return ApiError.unauthorized();
    }
    if (!authLevel.isMember) {
      return ApiError.forbidden();
    }

    let body: VotePayload;
    try {
      body = await request.json();
    } catch {
      return ApiError.badRequest("Invalid JSON body");
    }

    const normalizedChoice = body.choice?.toUpperCase();
    if (normalizedChoice !== "YES" && normalizedChoice !== "NO") {
      return ApiError.badRequest('Vote choice must be "YES" or "NO"');
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
    if (status !== "OPEN") {
      return ApiError.conflict("Voting is not open for this proposal");
    }

    await prisma.constitutionProposalVote.upsert({
      where: {
        proposalId_voterId: {
          proposalId,
          voterId: user.id,
        },
      },
      update: {
        choice: normalizedChoice,
      },
      create: {
        proposalId,
        voterId: user.id,
        choice: normalizedChoice,
      },
    });

    const updated = await prisma.constitutionProposal.findUniqueOrThrow({
      where: { id: proposalId },
      include: constitutionProposalDetailInclude,
    });

    return NextResponse.json(
      buildConstitutionProposalView(updated, authLevel, {
        currentDocumentSha: document.sha,
        activePrimaryCount,
        viewerPrimaryOfficerSlots,
      })
    );
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error("Error voting on constitution proposal:", error);
    return ApiError.internal();
  }
}
