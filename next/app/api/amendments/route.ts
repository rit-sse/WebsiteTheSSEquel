import prisma from "@/lib/prisma";
import { AmendmentStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import { computeVoteSummary, getActorFromRequest } from "@/lib/services/amendmentService";
import {
  createAmendmentPR,
  fetchConstitutionSnapshot,
} from "@/lib/services/githubAmendmentService";

export const dynamic = "force-dynamic";

function buildBranchName(title: string, amendmentId: number): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  const safeTitle = slug.length > 0 ? slug : "amendment";
  return `amendment-${amendmentId}-${safeTitle}-${Date.now().toString(36)}`;
}

function sanitizeText(input: unknown): string {
  if (typeof input !== "string") return "";
  const trimmed = input.trim();
  return trimmed;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  const validStatus =
    status && Object.values(AmendmentStatus).includes(status as AmendmentStatus) ? (status as AmendmentStatus) : null;

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
  const proposedContent = sanitizeText(body.proposedContent);
  const isSemanticChange =
    typeof body.isSemanticChange === "boolean" ? body.isSemanticChange : true;

  if (!title || !proposedContent) {
    return new Response('"title", "proposedContent" are required', { status: 422 });
  }

  const currentSnapshot = await fetchConstitutionSnapshot();
  const dbDraft = await prisma.amendment.create({
    data: {
      title,
      description,
      authorId: actor.id,
      status: "OPEN",
      originalContent: currentSnapshot.content,
      proposedContent,
      isSemanticChange,
      publishedAt: new Date(),
    },
  });

  const branchName = buildBranchName(title, dbDraft.id);
  const amendmentAuthor = `Member #${actor.id}`;
  const prBody = description || `${title}\n\nAmendment proposal by ${amendmentAuthor}.`;
  try {
    const { prNumber, originalContent } = await createAmendmentPR({
      title,
      description: prBody,
      proposedContent,
      proposedBy: amendmentAuthor,
      branchName,
    });

    const amendment = await prisma.amendment.update({
      where: { id: dbDraft.id },
      data: {
        githubBranch: branchName,
        githubPrNumber: prNumber,
        originalContent,
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
      { message: "Amendment proposal created and pull request opened", amendment },
      { status: 201 },
    );
  } catch (error) {
    await prisma.amendment.update({
      where: { id: dbDraft.id },
      data: {
        status: "WITHDRAWN",
      },
    });
    return new Response(`Failed to create amendment PR: ${error}`, { status: 500 });
  }
}
