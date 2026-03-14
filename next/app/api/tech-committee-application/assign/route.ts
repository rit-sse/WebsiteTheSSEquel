import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getGatewayAuthLevel } from "@/lib/authGateway";
import { ApiError } from "@/lib/apiError";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { buildTechCommitteeAssignmentEmail } from "@/lib/email/techCommittee";
import { getPublicBaseUrl } from "@/lib/baseUrl";

export const dynamic = "force-dynamic";

const VALID_DIVISIONS = [
  "Web Division",
  "Lab Division",
  "Services Division",
] as const;

type AssignPayload = {
  id?: number;
  finalDivision?: string;
};

async function canAssignApplications(request: NextRequest) {
  const authLevel = await getGatewayAuthLevel(request);
  return authLevel.isTechCommitteeHead || authLevel.isPrimary;
}

export async function PUT(request: NextRequest) {
  try {
    if (!(await canAssignApplications(request))) {
      return ApiError.forbidden();
    }

    let body: AssignPayload;
    try {
      body = await request.json();
    } catch {
      return ApiError.badRequest("Invalid JSON body");
    }

    const applicationId = Number(body?.id);
    const finalDivision = body?.finalDivision?.trim();

    if (!applicationId || Number.isNaN(applicationId)) {
      return ApiError.badRequest("Application id is required");
    }

    if (!finalDivision) {
      return ApiError.badRequest("Final division is required");
    }

    if (!VALID_DIVISIONS.includes(finalDivision as (typeof VALID_DIVISIONS)[number])) {
      return ApiError.badRequest("Invalid final division");
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

    if (existingApplication.status !== "approved") {
      return ApiError.conflict(
        "Only approved applications can be assigned to a division"
      );
    }

    const updatedApplication = await prisma.techCommitteeApplication.update({
      where: { id: applicationId },
      data: {
        finalDivision,
        status: "assigned",
      },
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

    if (!isEmailConfigured()) {
      await prisma.techCommitteeApplication.update({
        where: { id: applicationId },
        data: {
          status: "approved",
          finalDivision: existingApplication.finalDivision,
        },
      });
      return new Response(
        JSON.stringify({ error: "Email service is not configured" }),
        { status: 503 }
      );
    }

    try {
      const assignmentEmail = buildTechCommitteeAssignmentEmail({
        applicantName: updatedApplication.user.name,
        finalDivision,
        baseUrl: getPublicBaseUrl(request),
      });
      await sendEmail({
        to: updatedApplication.user.email,
        subject: assignmentEmail.subject,
        html: assignmentEmail.html,
        text: assignmentEmail.text,
      });
    } catch (emailError) {
      console.error("Failed to send Tech Committee assignment email:", emailError);
      await prisma.techCommitteeApplication.update({
        where: { id: applicationId },
        data: {
          status: "approved",
          finalDivision: existingApplication.finalDivision,
        },
      });
      return new Response(
        JSON.stringify({ error: "Failed to send onboarding email" }),
        { status: 502 }
      );
    }

    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error("Error assigning Tech Committee application:", error);
    return ApiError.internal();
  }
}
