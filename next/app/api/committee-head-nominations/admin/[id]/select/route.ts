import { NextRequest, NextResponse } from "next/server";
import { CommitteeHeadApplicationStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getGatewayAuthLevel } from "@/lib/authGateway";
import { getPublicBaseUrl } from "@/lib/baseUrl";
import { isEmailConfigured, sendEmail } from "@/lib/email";

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getGatewayAuthLevel(request);
  if (!auth.isPrimary || !auth.userId) {
    return jsonError("Only active Primary Officers can select Committee Heads", 403);
  }

  const applicationId = await parseId(params);
  let body: { positionId?: number };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const positionId = Number(body.positionId);
  if (!Number.isInteger(positionId)) return jsonError("positionId is required");

  const application = await prisma.committeeHeadApplication.findUnique({
    where: { id: applicationId },
    include: {
      cycle: true,
      applicant: { select: { id: true, name: true, email: true } },
    },
  });
  if (!application) return jsonError("Application not found", 404);
  if (application.status !== CommitteeHeadApplicationStatus.SUBMITTED) {
    return jsonError("Only submitted applications can be selected", 409);
  }

  const position = await prisma.officerPosition.findUnique({
    where: { id: positionId },
    select: { id: true, title: true, category: true, is_defunct: true },
  });
  if (!position || position.category !== "COMMITTEE_HEAD" || position.is_defunct) {
    return jsonError("Position must be an active Committee Head position", 400);
  }

  const [existingSelection, activeOfficer, pendingPositionInvite, pendingUserInvite] =
    await Promise.all([
      prisma.committeeHeadApplication.findFirst({
        where: {
          cycleId: application.cycleId,
          applicantUserId: application.applicantUserId,
          status: CommitteeHeadApplicationStatus.SELECTED,
        },
      }),
      prisma.officer.findFirst({
        where: { position_id: positionId, is_active: true },
      }),
      prisma.invitation.findFirst({
        where: { type: "officer", positionId },
      }),
      prisma.invitation.findUnique({
        where: {
          invitedEmail_type: {
            invitedEmail: application.applicant.email,
            type: "officer",
          },
        },
      }),
    ]);

  if (existingSelection) {
    return jsonError("This applicant has already been selected this cycle", 409);
  }
  if (activeOfficer) {
    return jsonError("This position already has an active officer", 409);
  }
  if (pendingPositionInvite) {
    return jsonError("This position already has a pending officer invitation", 409);
  }
  if (pendingUserInvite) {
    return jsonError("This applicant already has a pending officer invitation", 409);
  }
  if (!application.applicant.email.endsWith("@g.rit.edu")) {
    return jsonError("Officer invitations require a @g.rit.edu email address", 400);
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  const now = new Date();

  const invitation = await prisma.$transaction(async (tx) => {
    const createdInvitation = await tx.invitation.create({
      data: {
        invitedEmail: application.applicant.email,
        type: "officer",
        positionId,
        startDate: application.cycle.officerTermStart,
        endDate: application.cycle.officerTermEnd,
        invitedBy: auth.userId!,
        expiresAt,
      },
    });

    await tx.committeeHeadApplication.update({
      where: { id: application.id },
      data: {
        status: CommitteeHeadApplicationStatus.SELECTED,
        selectedAt: now,
        selectedById: auth.userId,
        selectedPositionId: positionId,
      },
    });

    return createdInvitation;
  });

  let emailSent = false;
  if (isEmailConfigured()) {
    const baseUrl = getPublicBaseUrl(request);
    const acceptUrl = `${baseUrl}/accept-invitation?email=${encodeURIComponent(
      application.applicant.email
    )}`;
    try {
      await sendEmail({
        to: application.applicant.email,
        subject: `You've been selected as ${position.title} - SSE`,
        html: `<p>Hi ${application.applicant.name},</p>
<p>The Primary Officers selected you to serve as <strong>${position.title}</strong>.</p>
<p>Your term will run from <strong>${application.cycle.officerTermStart.toLocaleDateString()}</strong> to <strong>${application.cycle.officerTermEnd.toLocaleDateString()}</strong>.</p>
<p><a href="${acceptUrl}">Sign in to accept your officer invitation</a></p>
<p>This invitation expires in 30 days.</p>
<p>- The Society of Software Engineers</p>`,
        text: `You've been selected as ${position.title}. Accept your officer invitation: ${acceptUrl}`,
      });
      emailSent = true;
    } catch (error) {
      console.error("Failed to send committee-head selection email:", error);
    }
  }

  return NextResponse.json({ ok: true, invitationId: invitation.id, emailSent });
}
