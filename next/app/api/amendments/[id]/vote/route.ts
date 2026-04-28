import prisma from "@/lib/prisma";
import { AmendmentStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import {
  computeVoteSummary,
  getActiveMemberCount,
  getActorFromRequest,
} from "@/lib/services/amendmentService";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const amendmentId = Number(id);
  if (Number.isNaN(amendmentId)) {
    return new Response("Invalid amendment id", { status: 422 });
  }

  const actor = await getActorFromRequest(request);
  if (!actor?.isMember) {
    return new Response("Authentication required", { status: 401 });
  }

  let body: { approve?: boolean; officerPositionId?: number };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  if (typeof body.approve !== "boolean") {
    return new Response('"approve" must be true or false', { status: 422 });
  }

  try {
    const amendment = await prisma.amendment.findUnique({
      where: { id: amendmentId },
      select: {
        id: true,
        status: true,
        isSemanticChange: true,
        votingEndsAt: true,
      },
    });
    if (!amendment) {
      return new Response("Amendment not found", { status: 404 });
    }

    let phase: string;
    if (amendment.status === AmendmentStatus.PRIMARY_REVIEW) {
      phase = "PRIMARY_REVIEW";
    } else if (amendment.status === AmendmentStatus.VOTING) {
      phase = "VOTING";
    } else {
      return new Response("Voting is not open for this amendment", { status: 409 });
    }

    if (phase === "VOTING" && amendment.votingEndsAt && new Date(amendment.votingEndsAt) < new Date()) {
      return new Response("The voting window has ended", { status: 409 });
    }

    if (phase === "PRIMARY_REVIEW") {
      if (!actor.isPrimary) {
        return new Response("Only primary officers can vote during primary review", { status: 403 });
      }

      const positionId = body.officerPositionId;
      if (!positionId || typeof positionId !== "number") {
        return new Response("officerPositionId is required for primary review votes", { status: 422 });
      }

      const officerRecord = await prisma.officer.findFirst({
        where: {
          user_id: actor.id,
          is_active: true,
          position_id: positionId,
          position: { is_primary: true },
        },
        select: { id: true },
      });
      if (!officerRecord) {
        return new Response("You do not hold this primary officer position", { status: 403 });
      }

      const existing = await prisma.amendmentVote.findFirst({
        where: { amendmentId, officerPositionId: positionId, phase: "PRIMARY_REVIEW" },
        select: { id: true },
      });

      if (existing) {
        await prisma.amendmentVote.update({
          where: { id: existing.id },
          data: { approve: body.approve, createdAt: new Date() },
        });
      } else {
        await prisma.amendmentVote.create({
          data: {
            amendmentId,
            userId: actor.id,
            approve: body.approve,
            phase: "PRIMARY_REVIEW",
            officerPositionId: positionId,
          },
        });
      }

      const allPrimaryVotes = await prisma.amendmentVote.findMany({
        where: { amendmentId, phase: "PRIMARY_REVIEW" },
        select: {
          approve: true,
          officerPositionId: true,
          user: { select: { id: true, name: true } },
        },
      });

      const allPrimaryPositions = await prisma.officerPosition.findMany({
        where: { is_primary: true },
        select: {
          id: true,
          title: true,
          officers: {
            where: { is_active: true },
            select: { user: { select: { id: true, name: true } } },
          },
        },
        orderBy: { title: "asc" },
      });

      const positionSlots = allPrimaryPositions.map((pos) => {
        const vote = allPrimaryVotes.find((v) => v.officerPositionId === pos.id);
        const holder = pos.officers[0]?.user ?? null;
        return {
          positionId: pos.id,
          title: pos.title,
          holder: holder ? { id: holder.id, name: holder.name } : null,
          voted: !!vote,
          approve: vote?.approve ?? null,
        };
      });

      const totalPositions = positionSlots.length;
      const votedCount = positionSlots.filter((s) => s.voted).length;
      const approveCount = positionSlots.filter((s) => s.approve === true).length;
      const rejectCount = positionSlots.filter((s) => s.approve === false).length;
      const quorumRequired = totalPositions === 0 ? 0 : Math.floor(totalPositions / 2) + 1;
      const quorumMet = votedCount >= quorumRequired;

      return Response.json({
        status: amendment.status,
        phase: "PRIMARY_REVIEW",
        primaryReview: {
          positionSlots,
          totalPositions,
          votedCount,
          approveCount,
          rejectCount,
          quorumRequired,
          quorumMet,
          majorityApproves: quorumMet && approveCount > rejectCount,
          majorityRejects: quorumMet && rejectCount >= approveCount,
        },
      });
    }

    if (phase === "VOTING" && !amendment.isSemanticChange && !actor.isPrimary) {
      return new Response("Only primary officers can vote on non-semantic amendments", { status: 403 });
    }

    const existingMemberVote = await prisma.amendmentVote.findFirst({
      where: { amendmentId, userId: actor.id, phase: "VOTING" },
      select: { id: true },
    });

    if (existingMemberVote) {
      await prisma.amendmentVote.update({
        where: { id: existingMemberVote.id },
        data: { approve: body.approve, createdAt: new Date() },
      });
    } else {
      await prisma.amendmentVote.create({
        data: {
          amendmentId,
          userId: actor.id,
          approve: body.approve,
          phase: "VOTING",
        },
      });
    }

    const updatedVotes = await prisma.amendmentVote.findMany({
      where: { amendmentId, phase: "VOTING" },
      select: { approve: true, userId: true },
    });

    const voteSummary = computeVoteSummary(updatedVotes);
    const totalActiveMembers = await getActiveMemberCount();
    const quorum = Math.ceil(totalActiveMembers * (2 / 3));
    const quorumMet = voteSummary.totalVotes >= quorum || quorum === 0;
    const supermajority = Math.ceil(voteSummary.totalVotes * (2 / 3));

    return Response.json({
      status: amendment.status,
      phase: "VOTING",
      voteSummary: {
        totalVotes: voteSummary.totalVotes,
        approveVotes: voteSummary.approveVotes,
        rejectVotes: voteSummary.rejectVotes,
        quorum,
        quorumMet,
        supermajority,
        isPassed: amendment.isSemanticChange
          ? voteSummary.totalVotes >= quorum && voteSummary.approveVotes >= supermajority
          : !voteSummary.totalVotes ? false : voteSummary.approveVotes > voteSummary.rejectVotes,
        hasUserVoted: true,
        userVote: body.approve,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to record vote";
    return new Response(message, { status: 500 });
  }
}
