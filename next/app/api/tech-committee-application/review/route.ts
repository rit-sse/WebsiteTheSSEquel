import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getGatewayAuthLevel } from "@/lib/authGateway";
import { ApiError } from "@/lib/apiError";
import { isEmailConfigured, sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

type ReviewPayload = {
  id?: number;
  action?: string;
};

async function canReviewApplications(request: NextRequest) {
  const authLevel = await getGatewayAuthLevel(request);
  return authLevel.isTechCommitteeHead || authLevel.isPrimary;
}

function buildRejectionEmail(applicantName: string) {
  return {
    subject: "Update on your Tech Committee application",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #426E8C, #5289AF); color: white; padding: 24px 32px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 22px;">Society of Software Engineers</h1>
        </div>
        <div style="padding: 24px 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Hi ${applicantName},</p>
          <p>Thank you for applying to join Tech Committee.</p>
          <p>After reviewing your application, we are not moving forward with it at this time.</p>
          <p>We appreciate your interest in contributing to SSE and encourage you to apply again in the future.</p>
        </div>
      </div>
    `,
    text: `Hi ${applicantName},\n\nThank you for applying to join Tech Committee.\n\nAfter reviewing your application, we are not moving forward with it at this time.\n\nWe appreciate your interest in contributing to SSE and encourage you to apply again in the future.`,
  };
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

    if (existingApplication.status !== "pending") {
      return ApiError.conflict(
        `Only pending applications can be ${action}d`
      );
    }

    const nextStatus = action === "approve" ? "approved" : "rejected";

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

    if (action === "reject") {
      if (!isEmailConfigured()) {
        await prisma.techCommitteeApplication.update({
          where: { id: applicationId },
          data: { status: "pending" },
        });
        return new Response(
          JSON.stringify({ error: "Email service is not configured" }),
          { status: 503 }
        );
      }

      try {
        const rejectionEmail = buildRejectionEmail(updatedApplication.user.name);
        await sendEmail({
          to: updatedApplication.user.email,
          subject: rejectionEmail.subject,
          html: rejectionEmail.html,
          text: rejectionEmail.text,
        });
      } catch (emailError) {
        console.error("Failed to send Tech Committee rejection email:", emailError);
        await prisma.techCommitteeApplication.update({
          where: { id: applicationId },
          data: { status: "pending" },
        });
        return new Response(
          JSON.stringify({ error: "Failed to send rejection email" }),
          { status: 502 }
        );
      }
    }

    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error("Error reviewing Tech Committee application:", error);
    return ApiError.internal();
  }
}
