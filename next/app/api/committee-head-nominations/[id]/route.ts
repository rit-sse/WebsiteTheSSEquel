import { NextRequest, NextResponse } from "next/server";
import {
  CommitteeHeadApplicationStatus,
  CommitteeHeadThirdPartyNominationStatus,
} from "@prisma/client";
import prisma from "@/lib/prisma";
import { getGatewayAuthLevel } from "@/lib/authGateway";
import {
  normalizeRankedPositionIds,
  validateCommitteeHeadPositionIds,
  validateRequiredText,
} from "@/lib/committeeHeadNominations";

export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function parseId(params: Promise<{ id: string }>) {
  const { id } = await params;
  const parsed = Number(id);
  if (!Number.isInteger(parsed)) throw new Error("Invalid application ID");
  return parsed;
}

function parseApplicationFields(body: any) {
  const textResult = validateRequiredText({
    yearLevel: body.yearLevel,
    major: body.major,
    experienceText: body.experienceText,
    whyInterested: body.whyInterested,
    weeklyCommitment: body.weeklyCommitment,
  });
  if (!textResult.ok) return textResult;
  return {
    ok: true as const,
    data: {
      yearLevel: textResult.data.yearLevel,
      major: textResult.data.major,
      experienceText: textResult.data.experienceText,
      whyInterested: textResult.data.whyInterested,
      weeklyCommitment: textResult.data.weeklyCommitment,
      comments:
        typeof body.comments === "string" ? body.comments.trim() || null : null,
    },
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getGatewayAuthLevel(request);
  if (!auth.userId) return jsonError("Sign in required", 401);

  const id = await parseId(params);
  const application = await prisma.committeeHeadApplication.findUnique({
    where: { id },
    include: {
      cycle: { select: { id: true, name: true, status: true } },
      applicant: { select: { id: true, name: true, email: true, major: true } },
      preferences: {
        include: { officerPosition: { select: { id: true, title: true } } },
        orderBy: { rank: "asc" },
      },
      nominations: {
        include: {
          nominator: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!application) return jsonError("Application not found", 404);
  if (application.applicantUserId !== auth.userId && !auth.isPrimary) {
    return jsonError("Access denied", 403);
  }

  return NextResponse.json(application);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getGatewayAuthLevel(request);
  if (!auth.userId) return jsonError("Sign in required", 401);

  const id = await parseId(params);
  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const application = await prisma.committeeHeadApplication.findUnique({
    where: { id },
    include: { cycle: true },
  });
  if (!application) return jsonError("Application not found", 404);
  if (application.applicantUserId !== auth.userId) {
    return jsonError("Access denied", 403);
  }

  const action = body.action;
  const cycleOpen = application.cycle.status === "OPEN";

  if (action === "decline") {
    if (application.status !== "PENDING_ACCEPTANCE") {
      return jsonError("Only pending nominations can be declined", 409);
    }
    await prisma.$transaction([
      prisma.committeeHeadApplication.update({
        where: { id },
        data: {
          status: CommitteeHeadApplicationStatus.DECLINED,
          declinedAt: new Date(),
        },
      }),
      prisma.committeeHeadThirdPartyNomination.updateMany({
        where: { applicationId: id },
        data: { status: CommitteeHeadThirdPartyNominationStatus.DECLINED },
      }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (action === "withdraw") {
    if (!cycleOpen || application.status !== "SUBMITTED") {
      return jsonError("Only submitted applications in an open cycle can be withdrawn", 409);
    }
    await prisma.committeeHeadApplication.update({
      where: { id },
      data: {
        status: CommitteeHeadApplicationStatus.WITHDRAWN,
        withdrawnAt: new Date(),
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action !== "accept" && action !== "update") {
    return jsonError('action must be "accept", "update", "decline", or "withdraw"');
  }
  if (!cycleOpen) return jsonError("Committee Head nominations are closed", 409);
  if (
    action === "accept" &&
    application.status !== CommitteeHeadApplicationStatus.PENDING_ACCEPTANCE
  ) {
    return jsonError("Only pending nominations can be accepted", 409);
  }
  if (
    action === "update" &&
    application.status !== CommitteeHeadApplicationStatus.SUBMITTED
  ) {
    return jsonError("Only submitted applications can be updated", 409);
  }

  const positionIds = normalizeRankedPositionIds(body.preferences);
  const positionResult = await validateCommitteeHeadPositionIds(positionIds);
  if (!positionResult.ok) return jsonError(positionResult.message);

  const fields = parseApplicationFields(body);
  if (!fields.ok) return jsonError(fields.message);

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.committeeHeadApplication.update({
      where: { id },
      data: {
        ...fields.data,
        status: CommitteeHeadApplicationStatus.SUBMITTED,
        submittedAt: now,
        acceptedAt: action === "accept" ? now : application.acceptedAt,
        declinedAt: null,
        withdrawnAt: null,
      },
    });
    await tx.committeeHeadApplicationPreference.deleteMany({
      where: { applicationId: id },
    });
    await tx.committeeHeadApplicationPreference.createMany({
      data: positionIds.map((positionId, index) => ({
        applicationId: id,
        officerPositionId: positionId,
        rank: index + 1,
      })),
    });
    if (action === "accept") {
      await tx.committeeHeadThirdPartyNomination.updateMany({
        where: { applicationId: id },
        data: { status: CommitteeHeadThirdPartyNominationStatus.ACCEPTED },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
