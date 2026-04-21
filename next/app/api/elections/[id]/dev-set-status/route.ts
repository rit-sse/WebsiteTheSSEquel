/**
 * DEV-ONLY election status override — bypasses all the production guards
 * in PATCH /api/elections/[id] (date cutoffs, approved-candidate counts,
 * linear-only transitions) so that demos and local testing can flip an
 * election to any phase instantly.
 *
 * Safety:
 *   • Disabled in production (returns 404 when NODE_ENV === "production").
 *   • Requires an authenticated SE Admin (same gate as the real transition).
 *   • Also shoves the date cutoffs into the past when needed so downstream
 *     code that re-reads `nominationsCloseAt` / `votingCloseAt` doesn't
 *     immediately yank the status back.
 */
import prisma from "@/lib/prisma";
import { getGatewayAuthLevel } from "@/lib/authGateway";
import { ElectionStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

async function parseElectionId(params: Promise<{ id: string }>) {
  const { id } = await params;
  const parsed = Number(id);
  if (!Number.isInteger(parsed)) {
    throw new Error("Invalid election ID");
  }
  return parsed;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (IS_PRODUCTION) {
    return new Response("Not found", { status: 404 });
  }

  const authLevel = await getGatewayAuthLevel(request);
  if (!authLevel.userId) {
    return new Response("Sign in required", { status: 401 });
  }
  if (!authLevel.isSeAdmin) {
    return new Response("SE Admin only", { status: 403 });
  }

  let body: { status?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  const nextStatus = body.status;
  if (
    typeof nextStatus !== "string" ||
    !(Object.values(ElectionStatus) as string[]).includes(nextStatus)
  ) {
    return new Response("status must be a valid ElectionStatus", {
      status: 400,
    });
  }

  try {
    const electionId = await parseElectionId(params);
    const existing = await prisma.election.findUnique({
      where: { id: electionId },
    });
    if (!existing) {
      return new Response("Election not found", { status: 404 });
    }

    // Pull the relevant date cutoffs into the past so syncElectionStatus()
    // won't spring the election back to a later phase the next time it
    // runs. This is the key reason the normal PATCH route can't be used
    // for quick demo flipping.
    const now = new Date();
    const past = (minutesAgo: number) =>
      new Date(now.getTime() - minutesAgo * 60 * 1000);
    const future = (minutesAhead: number) =>
      new Date(now.getTime() + minutesAhead * 60 * 1000);

    let nominationsOpenAt = existing.nominationsOpenAt;
    let nominationsCloseAt = existing.nominationsCloseAt;
    let votingOpenAt = existing.votingOpenAt;
    let votingCloseAt = existing.votingCloseAt;

    switch (nextStatus as ElectionStatus) {
      case ElectionStatus.DRAFT:
        nominationsOpenAt = future(60);
        nominationsCloseAt = future(60 * 24 * 2);
        votingOpenAt = future(60 * 24 * 4);
        votingCloseAt = future(60 * 24 * 6);
        break;
      case ElectionStatus.NOMINATIONS_OPEN:
        nominationsOpenAt = past(30);
        nominationsCloseAt = future(60 * 24);
        votingOpenAt = future(60 * 24 * 3);
        votingCloseAt = future(60 * 24 * 5);
        break;
      case ElectionStatus.NOMINATIONS_CLOSED:
        nominationsOpenAt = past(60 * 24 * 2);
        nominationsCloseAt = past(60);
        votingOpenAt = future(60 * 24);
        votingCloseAt = future(60 * 24 * 3);
        break;
      case ElectionStatus.VOTING_OPEN:
        nominationsOpenAt = past(60 * 24 * 3);
        nominationsCloseAt = past(60 * 24);
        votingOpenAt = past(30);
        votingCloseAt = future(60 * 24);
        break;
      case ElectionStatus.VOTING_CLOSED:
      case ElectionStatus.TIE_RUNOFF_REQUIRED:
      case ElectionStatus.CERTIFIED:
        nominationsOpenAt = past(60 * 24 * 4);
        nominationsCloseAt = past(60 * 24 * 2);
        votingOpenAt = past(60 * 24);
        votingCloseAt = past(30);
        break;
      case ElectionStatus.CANCELLED:
        // Dates untouched
        break;
    }

    const updated = await prisma.election.update({
      where: { id: electionId },
      data: {
        status: nextStatus as ElectionStatus,
        nominationsOpenAt,
        nominationsCloseAt,
        votingOpenAt,
        votingCloseAt,
        // If moving back out of CERTIFIED, clear the certification marker.
        ...(nextStatus !== ElectionStatus.CERTIFIED
          ? { certifiedById: null, certifiedAt: null }
          : {}),
      },
    });

    return Response.json(updated);
  } catch (error) {
    return new Response(
      error instanceof Error
        ? error.message
        : "Failed to dev-set election status",
      { status: 400 }
    );
  }
}
