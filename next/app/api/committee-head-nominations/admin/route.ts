import { NextRequest, NextResponse } from "next/server";
import {
  CommitteeHeadApplicationStatus,
  type Prisma,
} from "@prisma/client";
import prisma from "@/lib/prisma";
import { getGatewayAuthLevel } from "@/lib/authGateway";
import { isCommitteeHeadStatus } from "@/lib/committeeHeadNominations";

export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function requirePrimary(request: NextRequest) {
  const auth = await getGatewayAuthLevel(request);
  if (!auth.isPrimary || !auth.userId) {
    return { response: jsonError("Only active Primary Officers can review Committee Head nominations", 403) };
  }
  return { auth };
}

export async function GET(request: NextRequest) {
  const primary = await requirePrimary(request);
  if ("response" in primary) return primary.response;

  const cycleId = request.nextUrl.searchParams.get("cycleId");
  const status = request.nextUrl.searchParams.get("status");
  const positionId = request.nextUrl.searchParams.get("positionId");

  const cycles = await prisma.committeeHeadNominationCycle.findMany({
    orderBy: { openedAt: "desc" },
    take: 10,
  });
  const selectedCycle =
    (cycleId
      ? cycles.find((cycle) => cycle.id === Number(cycleId))
      : cycles.find((cycle) => cycle.status === "OPEN") ?? cycles[0]) ?? null;

  const where: Prisma.CommitteeHeadApplicationWhereInput = selectedCycle
    ? { cycleId: selectedCycle.id }
    : { id: -1 };

  if (status && isCommitteeHeadStatus(status)) {
    where.status = status as CommitteeHeadApplicationStatus;
  } else {
    where.status = {
      in: [
        CommitteeHeadApplicationStatus.PENDING_ACCEPTANCE,
        CommitteeHeadApplicationStatus.SUBMITTED,
        CommitteeHeadApplicationStatus.SELECTED,
      ],
    };
  }

  if (positionId && Number.isInteger(Number(positionId))) {
    where.preferences = {
      some: { officerPositionId: Number(positionId) },
    };
  }

  const [applications, positions] = await Promise.all([
    prisma.committeeHeadApplication.findMany({
      where,
      include: {
        applicant: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImageKey: true,
            googleImageURL: true,
          },
        },
        preferences: {
          include: { officerPosition: { select: { id: true, title: true } } },
          orderBy: { rank: "asc" },
        },
        nominations: {
          include: {
            nominator: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        selectedPosition: { select: { id: true, title: true } },
        selectedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ status: "asc" }, { submittedAt: "desc" }, { createdAt: "desc" }],
    }),
    prisma.officerPosition.findMany({
      where: { category: "COMMITTEE_HEAD", is_defunct: false },
      select: { id: true, title: true, email: true },
      orderBy: { title: "asc" },
    }),
  ]);

  return NextResponse.json({
    cycles,
    selectedCycle,
    positions,
    applications,
  });
}
