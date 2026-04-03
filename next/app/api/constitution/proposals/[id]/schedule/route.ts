import { NextRequest, NextResponse } from "next/server";
import { ConstitutionProposalStatus } from "@prisma/client";
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
import { getRequiredPrimaryQuorum } from "@/lib/constitution/status";

export const dynamic = "force-dynamic";

type SchedulePayload = {
  electionStartsAt?: string;
  electionEndsAt?: string;
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
    const { authLevel } = await getConstitutionActorFromRequest(request);
    if (!authLevel.isPrimary) {
      return ApiError.forbidden();
    }

    let body: SchedulePayload;
    try {
      body = await request.json();
    } catch {
      return ApiError.badRequest("Invalid JSON body");
    }

    const electionStartsAt = body.electionStartsAt
      ? new Date(body.electionStartsAt)
      : null;
    const electionEndsAt = body.electionEndsAt ? new Date(body.electionEndsAt) : null;
    if (
      !electionStartsAt ||
      !electionEndsAt ||
      Number.isNaN(electionStartsAt.getTime()) ||
      Number.isNaN(electionEndsAt.getTime())
    ) {
      return ApiError.badRequest("Election start and end times are required");
    }
    if (electionEndsAt <= electionStartsAt) {
      return ApiError.badRequest("Election end time must be after the start time");
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
    if (
      proposal.status !== ConstitutionProposalStatus.PRIMARY_REVIEW &&
      proposal.status !== ConstitutionProposalStatus.SCHEDULED
    ) {
      return ApiError.conflict(
        "Only proposals in primary review or already scheduled can edit the election window"
      );
    }
    if (proposal.baseDocumentSha !== document.sha) {
      await prisma.constitutionProposal.update({
        where: { id: proposalId },
        data: { status: ConstitutionProposalStatus.STALE },
      });
      return ApiError.conflict("This proposal is stale and must be rebased");
    }

    const requiredQuorum = getRequiredPrimaryQuorum(activePrimaryCount);
    if (
      proposal.status === ConstitutionProposalStatus.PRIMARY_REVIEW &&
      proposal.primaryApprovals.length < requiredQuorum
    ) {
      return ApiError.conflict(
        `Primary quorum has not been reached (${proposal.primaryApprovals.length}/${requiredQuorum})`
      );
    }
    const now = new Date();
    if (
      proposal.status === ConstitutionProposalStatus.PRIMARY_REVIEW &&
      electionStartsAt <= now
    ) {
      return ApiError.badRequest("Election start time must be in the future");
    }
    if (
      proposal.status === ConstitutionProposalStatus.SCHEDULED &&
      electionEndsAt <= now
    ) {
      return ApiError.badRequest(
        "Election end time must remain in the future when updating a live election"
      );
    }

    const updated = await prisma.constitutionProposal.update({
      where: { id: proposalId },
      data: {
        status: ConstitutionProposalStatus.SCHEDULED,
        electionStartsAt,
        electionEndsAt,
      },
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
    console.error("Error scheduling constitution proposal:", error);
    return ApiError.internal();
  }
}
