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

export async function GET(request: NextRequest) {
  try {
    const canReview = await canReviewApplications(request);
    if (!canReview) {
      return validationError(
        "Only Tech Head or Primary Officers can view Tech Committee applications",
        403
      );
    }

    const status = request.nextUrl.searchParams.get("status");

    const applications = await prisma.techCommitteeApplication.findMany({
      where: status ? { status } : undefined,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error("Error fetching Tech Committee review applications:", error);
    return validationError(
      "Failed to fetch Tech Committee applications",
      500
    );
  }
}
