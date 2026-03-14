import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getGatewayAuthLevel } from "@/lib/authGateway";

export const dynamic = "force-dynamic";

function validationError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function canReviewApplications(request: NextRequest) {
  const authLevel = await getGatewayAuthLevel(request);
  return authLevel.isTechCommitteeHead || authLevel.isPrimary;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const canReview = await canReviewApplications(request);
    if (!canReview) {
      return validationError(
        "Only Tech Head or Primary Officers can view Tech Committee applications",
        403
      );
    }

    const { id } = await params;
    const applicationId = Number(id);

    if (Number.isNaN(applicationId)) {
      return validationError("Invalid application id");
    }

    const application = await prisma.techCommitteeApplication.findUnique({
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

    if (!application) {
      return validationError("Application not found", 404);
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("Error fetching Tech Committee application:", error);
    return validationError("Failed to fetch Tech Committee application", 500);
  }
}
