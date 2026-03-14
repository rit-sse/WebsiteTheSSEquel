import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getGatewayAuthLevel } from "@/lib/authGateway";
import { ApiError } from "@/lib/apiError";

export const dynamic = "force-dynamic";

async function canManageApplications(request: NextRequest) {
  const authLevel = await getGatewayAuthLevel(request);
  return (
    authLevel.isTechCommitteeHead ||
    authLevel.isPrimary ||
    authLevel.isTechCommitteeDivisionManager
  );
}

export async function GET(request: NextRequest) {
  try {
    if (!(await canManageApplications(request))) {
      return ApiError.forbidden();
    }

    const config = await prisma.techCommitteeApplicationConfig.findUnique({
      where: { id: 1 },
    });

    return NextResponse.json({
      isOpen: config?.isOpen ?? true,
    });
  } catch (error) {
    console.error("Error fetching Tech Committee application config:", error);
    return ApiError.internal();
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!(await canManageApplications(request))) {
      return ApiError.forbidden();
    }

    let body: { isOpen?: boolean };
    try {
      body = await request.json();
    } catch {
      return ApiError.badRequest("Invalid JSON body");
    }

    if (typeof body?.isOpen !== "boolean") {
      return ApiError.badRequest("isOpen must be provided as a boolean");
    }

    const config = await prisma.techCommitteeApplicationConfig.upsert({
      where: { id: 1 },
      update: { isOpen: body.isOpen },
      create: {
        id: 1,
        isOpen: body.isOpen,
      },
    });

    return NextResponse.json({
      isOpen: config.isOpen,
    });
  } catch (error) {
    console.error("Error updating Tech Committee application config:", error);
    return ApiError.internal();
  }
}
