import { NextRequest, NextResponse } from "next/server";
import { CommitteeHeadApplicationStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getGatewayAuthLevel } from "@/lib/authGateway";

export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function parseId(params: Promise<{ id: string }>) {
  const { id } = await params;
  const parsed = Number(id);
  if (!Number.isInteger(parsed)) throw new Error("Invalid application ID");
  return parsed;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getGatewayAuthLevel(request);
  if (!auth.isPrimary) {
    return jsonError("Only active Primary Officers can update nominations", 403);
  }

  const id = await parseId(params);
  await prisma.committeeHeadApplication.update({
    where: { id },
    data: {
      status: CommitteeHeadApplicationStatus.NOT_SELECTED,
      selectedAt: null,
      selectedById: null,
      selectedPositionId: null,
    },
  });

  return NextResponse.json({ ok: true });
}
