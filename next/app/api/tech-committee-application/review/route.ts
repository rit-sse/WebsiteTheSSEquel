import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getGatewayAuthLevel } from "@/lib/authGateway";
import { ApiError } from "@/lib/apiError";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { buildTechCommitteeRejectionEmail } from "@/lib/email/techCommittee";

export const dynamic = "force-dynamic";

type ReviewPayload = {
  id?: number;
  action?: string;
};

async function canReviewApplications(request: NextRequest) {
  const authLevel = await getGatewayAuthLevel(request);
  return (
    authLevel.isTechCommitteeHead ||
    authLevel.isPrimary ||
    authLevel.isTechCommitteeDivisionManager
  );
}

export async function PUT(request: NextRequest) {
  try {
    if (!(await canReviewApplications(request))) {
      return ApiError.forbidden();
    }

    let body: ReviewPayload;
    try {
      body = await request.json();
    } catch {
      return ApiError.badRequest("Invalid JSON body");
    }

    const { id, action } = body ?? {};
    const applicationId = Number(id);

    if (!applicationId || Number.isNaN(applicationId)) {
      return ApiError.badRequest("Application id is required");
    }

    if (action !== "approve" && action !== "reject") {
      return ApiError.badRequest("Unsupported reviewer action");
    }

    const existingApplication = await prisma.techCommitteeApplication.findUnique({
      where: { id: applicationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!existingApplication) {
      return ApiError.notFound("Application");
    }

    if (existingApplication.status !== "PENDING") {
      return ApiError.conflict(
        `Only pending applications can be ${action}`
      );
    }

    if (action === "reject") {
      if (!isEmailConfigured()) {
        return new Response(
          JSON.stringify({ error: "Email service is not configured" }),
          { status: 503 }
        );
      }

      try {
        const rejectionEmail = buildTechCommitteeRejectionEmail(
          existingApplication.user.name
        );
        await sendEmail({
          to: existingApplication.user.email,
          subject: rejectionEmail.subject,
          html: rejectionEmail.html,
          text: rejectionEmail.text,
        });
      } catch (emailError) {
        console.error("Failed to send Tech Committee rejection email:", emailError);
        return new Response(
          JSON.stringify({ error: "Failed to send rejection email" }),
          { status: 502 }
        );
      }
    }

    const nextStatus = action === "approve" ? "APPROVED" : "REJECTED";
    const updatedApplication = await prisma.techCommitteeApplication.update({
      where: { id: applicationId },
      data: { status: nextStatus },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error("Error reviewing Tech Committee application:", error);
    return ApiError.internal();
  }
}
