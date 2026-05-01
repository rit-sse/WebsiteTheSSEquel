import { NextRequest, NextResponse } from "next/server";
import {
  CommitteeHeadApplicationSource,
  CommitteeHeadApplicationStatus,
  CommitteeHeadThirdPartyNominationStatus,
} from "@prisma/client";
import prisma from "@/lib/prisma";
import { getGatewayAuthLevel } from "@/lib/authGateway";
import { getPublicBaseUrl } from "@/lib/baseUrl";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import {
  getOpenCommitteeHeadNominationCycle,
  isActivePrimaryOfficer,
  listCommitteeHeadPositions,
  normalizeRankedPositionIds,
  validateCommitteeHeadPositionIds,
  validateRequiredText,
} from "@/lib/committeeHeadNominations";

export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function requireSignedIn(request: NextRequest) {
  const auth = await getGatewayAuthLevel(request);
  if (!auth.userId) {
    return { response: jsonError("Sign in required", 401) };
  }
  return { auth };
}

async function getCycleOrError(cycleId: unknown) {
  const id = Number(cycleId);
  if (!Number.isInteger(id)) {
    return { response: jsonError("cycleId is required") };
  }
  const cycle = await prisma.committeeHeadNominationCycle.findUnique({
    where: { id },
  });
  if (!cycle || cycle.status !== "OPEN") {
    return { response: jsonError("Committee Head nominations are closed", 409) };
  }
  return { cycle };
}

async function upsertPreferences(applicationId: number, positionIds: number[]) {
  await prisma.committeeHeadApplicationPreference.deleteMany({
    where: { applicationId },
  });
  await prisma.committeeHeadApplicationPreference.createMany({
    data: positionIds.map((positionId, index) => ({
      applicationId,
      officerPositionId: positionId,
      rank: index + 1,
    })),
  });
}

export async function GET(request: NextRequest) {
  const statusOnly = request.nextUrl.searchParams.get("status") === "true";
  const my = request.nextUrl.searchParams.get("my") === "true";

  if (statusOnly) {
    const [cycle, positions] = await Promise.all([
      getOpenCommitteeHeadNominationCycle(),
      listCommitteeHeadPositions(),
    ]);
    return NextResponse.json({
      isOpen: !!cycle,
      cycle: cycle
        ? { id: cycle.id, name: cycle.name, term: cycle.term, year: cycle.year }
        : null,
      positions,
    });
  }

  if (!my) {
    return jsonError('Only "status=true" and "my=true" are supported');
  }

  const signedIn = await requireSignedIn(request);
  if ("response" in signedIn) return signedIn.response;
  const userId = signedIn.auth.userId!;

  const applications = await prisma.committeeHeadApplication.findMany({
    where: { applicantUserId: userId },
    include: {
      cycle: { select: { id: true, name: true, status: true } },
      preferences: {
        include: { officerPosition: { select: { id: true, title: true } } },
        orderBy: { rank: "asc" },
      },
      selectedPosition: { select: { id: true, title: true } },
      nominations: {
        include: {
          nominator: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(applications);
}

export async function POST(request: NextRequest) {
  const signedIn = await requireSignedIn(request);
  if ("response" in signedIn) return signedIn.response;
  const userId = signedIn.auth.userId!;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const cycleResult = await getCycleOrError(body.cycleId);
  if ("response" in cycleResult) return cycleResult.response;
  const cycle = cycleResult.cycle;

  if (body.mode === "self") {
    if (await isActivePrimaryOfficer(userId)) {
      return jsonError("Active Primary Officers cannot apply for Committee Head roles", 403);
    }

    const positionIds = normalizeRankedPositionIds(body.preferences);
    const positionResult = await validateCommitteeHeadPositionIds(positionIds);
    if (!positionResult.ok) return jsonError(positionResult.message);

    const textResult = validateRequiredText({
      yearLevel: body.yearLevel,
      major: body.major,
      experienceText: body.experienceText,
      whyInterested: body.whyInterested,
      weeklyCommitment: body.weeklyCommitment,
    });
    if (!textResult.ok) return jsonError(textResult.message);

    const existingApplication = await prisma.committeeHeadApplication.findUnique({
      where: {
        cycleId_applicantUserId: {
          cycleId: cycle.id,
          applicantUserId: userId,
        },
      },
      select: { status: true },
    });
    if (
      existingApplication &&
      existingApplication.status !== CommitteeHeadApplicationStatus.SUBMITTED &&
      existingApplication.status !==
        CommitteeHeadApplicationStatus.PENDING_ACCEPTANCE
    ) {
      return jsonError(
        "You cannot resubmit this Committee Head application in its current status",
        409
      );
    }

    const application = await prisma.committeeHeadApplication.upsert({
      where: {
        cycleId_applicantUserId: {
          cycleId: cycle.id,
          applicantUserId: userId,
        },
      },
      update: {
        source: CommitteeHeadApplicationSource.SELF,
        status: CommitteeHeadApplicationStatus.SUBMITTED,
        yearLevel: textResult.data.yearLevel,
        major: textResult.data.major,
        experienceText: textResult.data.experienceText,
        whyInterested: textResult.data.whyInterested,
        weeklyCommitment: textResult.data.weeklyCommitment,
        comments: typeof body.comments === "string" ? body.comments.trim() || null : null,
        submittedAt: new Date(),
        withdrawnAt: null,
        declinedAt: null,
      },
      create: {
        cycleId: cycle.id,
        applicantUserId: userId,
        source: CommitteeHeadApplicationSource.SELF,
        status: CommitteeHeadApplicationStatus.SUBMITTED,
        yearLevel: textResult.data.yearLevel,
        major: textResult.data.major,
        experienceText: textResult.data.experienceText,
        whyInterested: textResult.data.whyInterested,
        weeklyCommitment: textResult.data.weeklyCommitment,
        comments: typeof body.comments === "string" ? body.comments.trim() || null : null,
        submittedAt: new Date(),
      },
    });

    await upsertPreferences(application.id, positionIds);
    if (
      existingApplication?.status ===
      CommitteeHeadApplicationStatus.PENDING_ACCEPTANCE
    ) {
      await prisma.committeeHeadThirdPartyNomination.updateMany({
        where: { applicationId: application.id },
        data: { status: CommitteeHeadThirdPartyNominationStatus.ACCEPTED },
      });
    }
    return NextResponse.json({ applicationId: application.id }, { status: 201 });
  }

  if (body.mode === "nominate") {
    const nomineeUserId = Number(body.nomineeUserId);
    if (!Number.isInteger(nomineeUserId)) {
      return jsonError("nomineeUserId is required");
    }
    if (nomineeUserId === userId) {
      return jsonError("Use the self-application form to nominate yourself");
    }
    if (await isActivePrimaryOfficer(nomineeUserId)) {
      return jsonError("Active Primary Officers cannot be nominated for Committee Head roles", 403);
    }

    const positionIds = normalizeRankedPositionIds(body.suggestedPositionIds);
    const positionResult = await validateCommitteeHeadPositionIds(positionIds);
    if (!positionResult.ok) return jsonError(positionResult.message);

    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (!reason) return jsonError("reason is required");

    const nominee = await prisma.user.findUnique({
      where: { id: nomineeUserId },
      select: { id: true, name: true, email: true },
    });
    if (!nominee) return jsonError("Nominee not found", 404);

    const existingApplication = await prisma.committeeHeadApplication.findUnique({
      where: {
        cycleId_applicantUserId: {
          cycleId: cycle.id,
          applicantUserId: nomineeUserId,
        },
      },
      select: { id: true, status: true },
    });
    if (
      existingApplication &&
      existingApplication.status !==
        CommitteeHeadApplicationStatus.PENDING_ACCEPTANCE &&
      existingApplication.status !== CommitteeHeadApplicationStatus.SUBMITTED
    ) {
      return jsonError(
        "This nominee cannot be nominated in their current application status",
        409
      );
    }

    const application =
      existingApplication ??
      (await prisma.committeeHeadApplication.create({
        data: {
          cycleId: cycle.id,
          applicantUserId: nomineeUserId,
          source: CommitteeHeadApplicationSource.NOMINATED,
          status: CommitteeHeadApplicationStatus.PENDING_ACCEPTANCE,
        },
      }));

    try {
      await prisma.committeeHeadThirdPartyNomination.create({
        data: {
          applicationId: application.id,
          cycleId: cycle.id,
          nomineeUserId,
          nominatorUserId: userId,
          reason,
          suggestedPositionIdsJson: JSON.stringify(positionIds),
          status: CommitteeHeadThirdPartyNominationStatus.PENDING,
        },
      });
    } catch {
      return jsonError("You have already nominated this person this cycle", 409);
    }

    let emailSent = false;
    if (isEmailConfigured()) {
      const nominator = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      const baseUrl = getPublicBaseUrl(request);
      const acceptUrl = `${baseUrl}/nominate/accept/${application.id}`;
      const positions = positionResult.positions.map((p) => p.title).join(", ");
      try {
        await sendEmail({
          to: nominee.email,
          subject: "You've been nominated for a Committee Head role",
          html: `<p>Hi ${nominee.name},</p>
<p>${nominator?.name ?? "An SSE member"} nominated you for Committee Head consideration for <strong>${cycle.name}</strong>.</p>
<p>Suggested role${positionResult.positions.length === 1 ? "" : "s"}: <strong>${positions}</strong>.</p>
<p>To be considered by the incoming Primary Officers, accept the nomination and complete the application form.</p>
<p><a href="${acceptUrl}">Accept or decline the nomination</a></p>
<p>- The Society of Software Engineers</p>`,
          text: `${nominator?.name ?? "An SSE member"} nominated you for Committee Head consideration for ${cycle.name}. Suggested roles: ${positions}. Accept or decline: ${acceptUrl}`,
        });
        emailSent = true;
      } catch (error) {
        console.error("Failed to send committee-head nomination email:", error);
      }
    }

    return NextResponse.json(
      { applicationId: application.id, emailSent },
      { status: 201 }
    );
  }

  return jsonError('mode must be "self" or "nominate"');
}
