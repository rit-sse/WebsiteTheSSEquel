import { NextRequest, NextResponse } from "next/server";
import { ConstitutionProposalStatus } from "@prisma/client";
import { ApiError } from "@/lib/apiError";
import prisma from "@/lib/prisma";
import {
  getConstitutionActorFromRequest,
  getViewerPrimaryOfficerSlots,
} from "@/lib/constitution/auth";
import { getCurrentConstitutionDocument } from "@/lib/constitution/document";
import { getGoverningDocsConfig } from "@/lib/constitution/config";
import {
  buildConstitutionProposalView,
  constitutionProposalDetailInclude,
} from "@/lib/constitution/proposals";
import { prepareConstitutionProposalContent } from "@/lib/constitution/validation";

export const dynamic = "force-dynamic";

type ProposalCreatePayload = {
  title?: string;
  summary?: string;
  rationale?: string;
  sectionHeadingPath?: string;
  proposedSectionMarkdown?: string;
  action?: "save" | "submit";
};

function isComputedStatusMatch(
  statusFilter: string | null,
  computedStatus: string
) {
  if (!statusFilter) {
    return true;
  }

  return computedStatus.toUpperCase() === statusFilter.toUpperCase();
}

export async function GET(request: NextRequest) {
  try {
    const { authLevel, user } = await getConstitutionActorFromRequest(request);
    const mine = request.nextUrl.searchParams.get("mine") === "true";
    const activeOnly = request.nextUrl.searchParams.get("active") === "true";
    const statusFilter = request.nextUrl.searchParams.get("status");

    if (mine && !user) {
      return ApiError.unauthorized();
    }

    const where = mine
      ? { authorId: user!.id }
      : {
          status: {
            not: ConstitutionProposalStatus.DRAFT,
          },
        };

    const [proposals, document, activePrimaryCount, viewerPrimaryOfficerSlots] =
      await Promise.all([
      prisma.constitutionProposal.findMany({
        where,
        include: constitutionProposalDetailInclude,
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      }),
      getCurrentConstitutionDocument(),
      prisma.officer.count({
        where: {
          is_active: true,
          position: {
            is_primary: true,
          },
        },
      }),
      getViewerPrimaryOfficerSlots(authLevel.userId),
    ]);

    const mapped = proposals
      .map((proposal) =>
        buildConstitutionProposalView(proposal, authLevel, {
          currentDocumentSha: document.sha,
          activePrimaryCount,
          viewerPrimaryOfficerSlots,
        })
      )
      .filter((proposal) => isComputedStatusMatch(statusFilter, proposal.computedStatus))
      .filter((proposal) =>
        activeOnly
          ? ["PRIMARY_REVIEW", "SCHEDULED", "OPEN"].includes(
              proposal.computedStatus
            )
          : true
      );

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Error fetching constitution proposals:", error);
    return ApiError.internal();
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authLevel, user } = await getConstitutionActorFromRequest(request);
    if (!user) {
      return ApiError.unauthorized();
    }

    if (!authLevel.isMember && !authLevel.isOfficer) {
      return ApiError.forbidden();
    }

    let body: ProposalCreatePayload;
    try {
      body = await request.json();
    } catch {
      return ApiError.badRequest("Invalid JSON body");
    }

    const document = await getCurrentConstitutionDocument();
    const content = prepareConstitutionProposalContent({
      ...body,
      baseMarkdown: document.markdown,
    });
    const config = getGoverningDocsConfig();
    const nextStatus =
      body.action === "submit"
        ? ConstitutionProposalStatus.PRIMARY_REVIEW
        : ConstitutionProposalStatus.DRAFT;

    const created = await prisma.constitutionProposal.create({
      data: {
        title: content.title,
        summary: content.summary,
        rationale: content.rationale,
        status: nextStatus,
        authorId: user.id,
        baseRepoOwner: config.owner,
        baseRepoName: config.repo,
        baseBranch: config.branch,
        basePath: config.constitutionPath,
        baseDocumentSha: document.sha,
        baseMarkdown: document.markdown,
        sectionHeadingPath: content.sectionHeadingPath,
        proposedSectionMarkdown: content.proposedSectionMarkdown,
        fullProposedMarkdown: content.fullProposedMarkdown,
        unifiedDiff: content.unifiedDiff,
        submittedAt: nextStatus === "PRIMARY_REVIEW" ? new Date() : null,
      },
      include: constitutionProposalDetailInclude,
    });

    const [activePrimaryCount, viewerPrimaryOfficerSlots] = await Promise.all([
      prisma.officer.count({
        where: {
          is_active: true,
          position: { is_primary: true },
        },
      }),
      getViewerPrimaryOfficerSlots(authLevel.userId),
    ]);

    return NextResponse.json(
      buildConstitutionProposalView(created, authLevel, {
        currentDocumentSha: document.sha,
        activePrimaryCount,
        viewerPrimaryOfficerSlots,
      }),
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error("Error creating constitution proposal:", error);
    return ApiError.internal();
  }
}
