import prisma from "@/lib/prisma";
import { AmendmentStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import { getActorFromRequest } from "@/lib/services/amendmentService";
import { mergePR } from "@/lib/services/githubAmendmentService";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const amendmentId = Number(params.id);
  if (Number.isNaN(amendmentId)) {
    return new Response("Invalid amendment id", { status: 422 });
  }

  const actor = await getActorFromRequest(request);
  if (!actor?.isPrimary) {
    return new Response("Only primary officers can merge amendments", { status: 403 });
  }

  const amendment = await prisma.amendment.findUnique({
    where: { id: amendmentId },
    select: { id: true, status: true, githubPrNumber: true },
  });
  if (!amendment) {
    return new Response("Amendment not found", { status: 404 });
  }

  if (!amendment.githubPrNumber) {
    return new Response("This amendment has no linked pull request", { status: 400 });
  }

  if (amendment.status !== AmendmentStatus.APPROVED) {
    return new Response("Only approved amendments can be merged", { status: 409 });
  }

  try {
    await mergePR(amendment.githubPrNumber);
  } catch (error) {
    return new Response(`Failed to merge PR: ${error}`, { status: 500 });
  }

  const updated = await prisma.amendment.update({
    where: { id: amendmentId },
    data: {
      status: AmendmentStatus.MERGED,
      votingClosedAt: new Date(),
    },
  });

  return Response.json(updated);
}
