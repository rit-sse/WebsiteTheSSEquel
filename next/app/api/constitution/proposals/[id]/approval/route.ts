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

export const dynamic = "force-dynamic";

type ApprovalPayload = {
  officerId?: number;
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
    if (!authLevel.isPrimary) {
      return ApiError.forbidden();
    }
    let body: ApprovalPayload;
    try {
      body = await request.json();
    } catch {
      return ApiError.badRequest("Invalid JSON body");
    }
    const officerId = Number(body.officerId);
    if (!officerId || Number.isNaN(officerId)) {
      return ApiError.badRequest("Primary officer slot is required");
    }
    const approvalSlot = await prisma.officer.findFirst({
      where: {
        id: officerId,
        user_id: user.id,
        is_active: true,
        position: {
          is_primary: true,
        },
      },
    });
    if (!approvalSlot) {
      return ApiError.forbidden();
    }

    const { id } = await context.params;
    const proposalId = parseProposalId(id);
    const existing = await prisma.constitutionProposal.findUnique({
      where: { id: proposalId },
      include: constitutionProposalDetailInclude,
    });
    if (!existing) {
      return ApiError.notFound("Constitution proposal");
    }
    if (existing.status !== ConstitutionProposalStatus.PRIMARY_REVIEW) {
      return ApiError.conflict("Only proposals in primary review can be approved");
    }

    await prisma.constitutionProposalPrimaryApproval.upsert({
      where: {
        proposalId_approverOfficerId: {
          proposalId,
          approverOfficerId: officerId,
        },
      },
      update: {},
      create: {
        proposalId,
        approverOfficerId: officerId,
      },
    });

    const [updated, document, activePrimaryCount, viewerPrimaryOfficerSlots] =
      await Promise.all([
      prisma.constitutionProposal.findUniqueOrThrow({
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
    console.error("Error approving constitution proposal:", error);
    return ApiError.internal();
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { authLevel, user } = await getConstitutionActorFromRequest(request);
    if (!user) {
      return ApiError.unauthorized();
    }
    if (!authLevel.isPrimary) {
      return ApiError.forbidden();
    }
    let body: ApprovalPayload;
    try {
      body = await request.json();
    } catch {
      return ApiError.badRequest("Invalid JSON body");
    }
    const officerId = Number(body.officerId);
    if (!officerId || Number.isNaN(officerId)) {
      return ApiError.badRequest("Primary officer slot is required");
    }
    const approvalSlot = await prisma.officer.findFirst({
      where: {
        id: officerId,
        user_id: user.id,
        is_active: true,
        position: {
          is_primary: true,
        },
      },
    });
    if (!approvalSlot) {
      return ApiError.forbidden();
    }

    const { id } = await context.params;
    const proposalId = parseProposalId(id);
    const existing = await prisma.constitutionProposal.findUnique({
      where: { id: proposalId },
      include: constitutionProposalDetailInclude,
    });
    if (!existing) {
      return ApiError.notFound("Constitution proposal");
    }
    if (existing.status !== ConstitutionProposalStatus.PRIMARY_REVIEW) {
      return ApiError.conflict(
        "Only proposals in primary review can change approvals"
      );
    }

    await prisma.constitutionProposalPrimaryApproval.deleteMany({
      where: {
        proposalId,
        approverOfficerId: officerId,
      },
    });

    const [updated, document, activePrimaryCount, viewerPrimaryOfficerSlots] =
      await Promise.all([
      prisma.constitutionProposal.findUniqueOrThrow({
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
    console.error("Error removing constitution proposal approval:", error);
    return ApiError.internal();
  }
}
