import prisma from "@/lib/prisma";
import { AmendmentStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import {
  computeVoteSummary,
  getActorFromRequest,
} from "@/lib/services/amendmentService";
import {
  fetchConstitutionSnapshot,
} from "@/lib/services/githubAmendmentService";

export const dynamic = "force-dynamic";

function sanitizeText(input: unknown): string {
  if (typeof input !== "string") return "";
  const trimmed = input.trim();
  return trimmed;
}

// Preserve whitespace on constitution content so the stored copy matches
// what the wizard diffed against. Trimming caused the detail-page diff to
// disagree with the wizard diff near the start/end of the file.
function readContent(input: unknown): string {
  if (typeof input !== "string") return "";
  return input;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  const validStatus =
    status && Object.values(AmendmentStatus).includes(status as AmendmentStatus)
      ? (status as AmendmentStatus)
      : null;

  const where = validStatus ? { status: validStatus } : {};
  const amendments = await prisma.amendment.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          profileImageKey: true,
          googleImageURL: true,
        },
      },
      votes: {
        select: { approve: true },
      },
    },
  });

  const rows = amendments.map((item) => {
    const voteSummary = computeVoteSummary(item.votes);
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      status: item.status,
      githubPrNumber: item.githubPrNumber,
      isSemanticChange: item.isSemanticChange,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      publishedAt: item.publishedAt,
      votingOpenedAt: item.votingOpenedAt,
      votingClosedAt: item.votingClosedAt,
      totalVotes: voteSummary.totalVotes,
      approveVotes: voteSummary.approveVotes,
      rejectVotes: voteSummary.rejectVotes,
      author: {
        id: item.author.id,
        name: item.author.name,
      },
    };
  });

  return Response.json(rows);
}

export async function POST(request: NextRequest) {
  const actor = await getActorFromRequest(request);
  if (!actor?.isMember) {
    return new Response("Authentication required", { status: 401 });
  }

  let body: {
    title?: unknown;
    description?: unknown;
    originalContent?: unknown;
    proposedContent?: unknown;
    isSemanticChange?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  const title = sanitizeText(body.title);
  const description = sanitizeText(body.description);
  const clientOriginalContent = readContent(body.originalContent);
  const proposedContent = readContent(body.proposedContent);
  const isSemanticChange =
    typeof body.isSemanticChange === "boolean" ? body.isSemanticChange : true;

  if (!title || proposedContent.trim().length === 0) {
    return new Response('"title", "proposedContent" are required', {
      status: 422,
    });
  }

  // Fetch current constitution for diff — graceful if GitHub is unavailable
  let originalContent = clientOriginalContent;
  try {
    const currentSnapshot = await fetchConstitutionSnapshot();
    originalContent = currentSnapshot.content;
  } catch {
    // GitHub unavailable — continue without original content
  }

  const amendment = await prisma.amendment.create({
    data: {
      title,
      description,
      authorId: actor.id,
      status: "PRIMARY_REVIEW",
      originalContent,
      proposedContent,
      isSemanticChange,
      publishedAt: new Date(),
      primaryReviewOpenedAt: new Date(),
    },
    select: {
      id: true,
      title: true,
      status: true,
      githubPrNumber: true,
      githubBranch: true,
    },
  });

  return Response.json(
    { message: "Amendment proposal created", amendment },
    { status: 201 },
  );
}
