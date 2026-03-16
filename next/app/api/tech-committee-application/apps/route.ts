import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getGatewayAuthLevel } from "@/lib/authGateway";
import { Status } from "@prisma/client";

export const dynamic = "force-dynamic";

function validationError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function canReviewApplications(request: NextRequest) {
  const authLevel = await getGatewayAuthLevel(request);
  return (
    authLevel.isTechCommitteeHead ||
    authLevel.isPrimary ||
    authLevel.isTechCommitteeDivisionManager
  );
}

function validateStatus(statusParam?: string | null): Status | null {
  if (!statusParam) {
    return null;
  }

  const normalized = statusParam?.trim().toUpperCase();
  const validStatuses = new Set(Object.values(Status));
  if (validStatuses.has(normalized as Status)) {
    return normalized as Status;
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const canReview = await canReviewApplications(request);
    if (!canReview) {
      return validationError(
        "Only Tech Head, Primary Officers, or Tech Committee division managers can view Tech Committee applications",
        403
      );
    }

    const rawStatus = request.nextUrl.searchParams.get("status");
    const status = validateStatus(rawStatus);
    if (rawStatus && !status) {
      return validationError("Invalid status", 400);
    }

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
