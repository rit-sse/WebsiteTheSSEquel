import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getGatewayAuthLevel } from "@/lib/authGateway";
import { getPublicBaseUrl } from "@/lib/baseUrl";
import {
  MembershipAwardError,
  sendMembershipAwardEmail,
} from "@/lib/services/membershipAwardService";

async function requireOfficer(request: Request) {
  const auth = await getGatewayAuthLevel(request);
  if (!auth.userId)
    return new Response("Please sign in first.", { status: 401 });
  if (!auth.isOfficer)
    return new Response("Officer access required.", { status: 403 });
  return null;
}

export async function GET(request: Request) {
  const denied = await requireOfficer(request);
  if (denied) return denied;
  const awards = await prisma.pendingMembershipAward.findMany({
    where: { claimedAt: null, cancelledAt: null },
    orderBy: { createdAt: "desc" },
    include: { awardedBy: { select: { name: true } } },
  });
  return Response.json(awards, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

const actionSchema = z.object({ awardId: z.string().uuid() });

export async function POST(request: NextRequest) {
  const denied = await requireOfficer(request);
  if (denied) return denied;
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return new Response("Invalid membership award.", { status: 400 });
  try {
    return Response.json(
      await sendMembershipAwardEmail(
        parsed.data.awardId,
        getPublicBaseUrl(request)
      )
    );
  } catch (error) {
    if (error instanceof MembershipAwardError) {
      return new Response(error.message, { status: error.status });
    }
    console.error("Failed to retry membership invitation", error);
    return new Response("Could not retry the invitation email.", {
      status: 500,
    });
  }
}

export async function DELETE(request: Request) {
  const denied = await requireOfficer(request);
  if (denied) return denied;
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return new Response("Invalid membership award.", { status: 400 });
  const result = await prisma.pendingMembershipAward.updateMany({
    where: { id: parsed.data.awardId, claimedAt: null, cancelledAt: null },
    data: { cancelledAt: new Date() },
  });
  if (!result.count) {
    return new Response("This award is no longer pending. Refresh the list.", {
      status: 409,
    });
  }
  return Response.json({ message: "Pending award cancelled." });
}
