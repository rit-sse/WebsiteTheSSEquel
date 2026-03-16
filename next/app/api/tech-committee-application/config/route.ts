import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getGatewayAuthLevel } from "@/lib/authGateway";
import { ApiError } from "@/lib/apiError";
import { formatAcademicTerm, getCurrentAcademicTerm } from "@/lib/academicTerm";

export const dynamic = "force-dynamic";

function buildCycleName() {
  const { term, year } = getCurrentAcademicTerm();
  return formatAcademicTerm(term, year);
}

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

    const cycle = await prisma.techCommitteeApplicationCycle.findFirst({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      isOpen: cycle?.isOpen ?? false,
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

    const existingCycle = await prisma.techCommitteeApplicationCycle.findFirst({
      orderBy: { createdAt: "desc" },
    });
    const currentCycleName = buildCycleName();

    const cycle =
      body.isOpen && (existingCycle?.name !== currentCycleName)
        ? await prisma.techCommitteeApplicationCycle.create({
            data: {
              name: currentCycleName,
              isOpen: true,
            },
          })
        : existingCycle
          ? await prisma.techCommitteeApplicationCycle.update({
              where: { id: existingCycle.id },
              data: { isOpen: body.isOpen },
            })
          : await prisma.techCommitteeApplicationCycle.create({
              data: {
                name: currentCycleName,
                isOpen: body.isOpen,
              },
            });

    return NextResponse.json({
      isOpen: cycle.isOpen,
    });
  } catch (error) {
    console.error("Error updating Tech Committee application config:", error);
    return ApiError.internal();
  }
}
