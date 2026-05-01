import { NextRequest, NextResponse } from "next/server";
import { CommitteeHeadNominationCycleStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getGatewayAuthLevel } from "@/lib/authGateway";

export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function PUT(request: NextRequest) {
  const auth = await getGatewayAuthLevel(request);
  if (!auth.isPrimary) {
    return jsonError("Only active Primary Officers can manage nomination cycles", 403);
  }

  let body: { cycleId?: number; status?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const cycleId = Number(body.cycleId);
  if (!Number.isInteger(cycleId)) return jsonError("cycleId is required");
  if (
    body.status !== "OPEN" &&
    body.status !== "CLOSED" &&
    body.status !== "ARCHIVED"
  ) {
    return jsonError("status must be OPEN, CLOSED, or ARCHIVED");
  }

  const status = body.status as CommitteeHeadNominationCycleStatus;
  const cycle = await prisma.committeeHeadNominationCycle.update({
    where: { id: cycleId },
    data: {
      status,
      closedAt:
        status === CommitteeHeadNominationCycleStatus.OPEN ? null : new Date(),
    },
  });

  return NextResponse.json(cycle);
}
