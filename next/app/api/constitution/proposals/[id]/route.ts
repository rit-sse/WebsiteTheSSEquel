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
import { prepareConstitutionProposalContent } from "@/lib/constitution/validation";
import { getConstitutionProposalComputedStatus } from "@/lib/constitution/status";

export const dynamic = "force-dynamic";

type ProposalUpdatePayload = {
  title?: string;
  summary?: string;
  rationale?: string;
  sectionHeadingPath?: string;
  proposedSectionMarkdown?: string;
  action?: "save" | "submit" | "withdraw";
};

function parseProposalId(raw: string) {
  const proposalId = Number(raw);
  if (!proposalId || Number.isNaN(proposalId)) {
    throw ApiError.badRequest("Invalid proposal id");
  }
  return proposalId;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const proposalId = parseProposalId(id);
    const { authLevel } = await getConstitutionActorFromRequest(request);
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
      proposal.status === ConstitutionProposalStatus.DRAFT &&
      proposal.authorId !== authLevel.userId
    ) {
      return ApiError.notFound("Constitution proposal");
    }

    const computedStatus = getConstitutionProposalComputedStatus(proposal, {
      currentDocumentSha: document.sha,
    });

    if (
      (computedStatus === "SCHEDULED" || computedStatus === "OPEN") &&
      !authLevel.isUser
    ) {
      return ApiError.unauthorized();
    }

    if (
      (computedStatus === "SCHEDULED" || computedStatus === "OPEN") &&
      !authLevel.isMember
    ) {
      return ApiError.forbidden();
    }

    return NextResponse.json(
      buildConstitutionProposalView(proposal, authLevel, {
        currentDocumentSha: document.sha,
        activePrimaryCount,
        viewerPrimaryOfficerSlots,
      })
    );
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error("Error fetching constitution proposal:", error);
    return ApiError.internal();
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const proposalId = parseProposalId(id);
    const { authLevel, user } = await getConstitutionActorFromRequest(request);
    if (!user) {
      return ApiError.unauthorized();
    }

    const existing = await prisma.constitutionProposal.findUnique({
      where: { id: proposalId },
      include: constitutionProposalDetailInclude,
    });
    if (!existing) {
      return ApiError.notFound("Constitution proposal");
    }
    const isAuthor = existing.authorId === user.id;
    const canPrimaryEdit =
      authLevel.isPrimary &&
      existing.status === ConstitutionProposalStatus.PRIMARY_REVIEW;
    if (!isAuthor && !canPrimaryEdit) {
      return ApiError.forbidden();
    }
    if (
      existing.status !== ConstitutionProposalStatus.DRAFT &&
      existing.status !== ConstitutionProposalStatus.PRIMARY_REVIEW
    ) {
      return ApiError.conflict("This proposal can no longer be edited");
    }

    let body: ProposalUpdatePayload;
    try {
      body = await request.json();
    } catch {
      return ApiError.badRequest("Invalid JSON body");
    }

    if (body.action === "withdraw") {
      if (!isAuthor) {
        return ApiError.forbidden();
      }
      const withdrawn = await prisma.constitutionProposal.update({
        where: { id: proposalId },
        data: {
          status: ConstitutionProposalStatus.WITHDRAWN,
        },
        include: constitutionProposalDetailInclude,
      });

      const [document, activePrimaryCount, viewerPrimaryOfficerSlots] =
        await Promise.all([
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
        buildConstitutionProposalView(withdrawn, authLevel, {
          currentDocumentSha: document.sha,
          activePrimaryCount,
          viewerPrimaryOfficerSlots,
        })
      );
    }

    if (body.action === "submit" && !isAuthor) {
      return ApiError.forbidden();
    }
    if (
      body.action === "submit" &&
      existing.status !== ConstitutionProposalStatus.DRAFT
    ) {
      return ApiError.conflict("Only drafts can be submitted for review");
    }

    const content = prepareConstitutionProposalContent({
      ...body,
      baseMarkdown: existing.baseMarkdown,
    });

    const updated = await prisma.constitutionProposal.update({
      where: { id: proposalId },
      data: {
        title: content.title,
        summary: content.summary,
        rationale: content.rationale,
        sectionHeadingPath: content.sectionHeadingPath,
        proposedSectionMarkdown: content.proposedSectionMarkdown,
        fullProposedMarkdown: content.fullProposedMarkdown,
        unifiedDiff: content.unifiedDiff,
        status:
          body.action === "submit"
            ? ConstitutionProposalStatus.PRIMARY_REVIEW
            : existing.status,
        submittedAt:
          body.action === "submit"
            ? existing.submittedAt ?? new Date()
            : existing.submittedAt,
      },
      include: constitutionProposalDetailInclude,
    });

    const [document, activePrimaryCount, viewerPrimaryOfficerSlots] =
      await Promise.all([
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
    console.error("Error updating constitution proposal:", error);
    return ApiError.internal();
  }
}
