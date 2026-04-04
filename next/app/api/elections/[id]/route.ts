import prisma from "@/lib/prisma";
import { getGatewayAuthLevel } from "@/lib/authGateway";
import {
  assertPrimaryOfficerPositions,
  canTransitionElectionStatus,
  getElectionWithRelations,
  serializeElectionForClient,
  stageHasRequiredApprovals,
  validateElectionWindow,
} from "@/lib/elections";
import { canManageElections } from "@/lib/seAdmin";
import {
  ElectionApprovalStage,
  ElectionEligibilityStatus,
  ElectionNominationStatus,
  ElectionStatus,
} from "@prisma/client";

export const dynamic = "force-dynamic";

function parseDate(value: unknown, field: string) {
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date for ${field}`);
  }
  return parsed;
}

async function parseElectionId(params: Promise<{ id: string }>) {
  const { id } = await params;
  const parsed = Number(id);
  if (!Number.isInteger(parsed)) {
    throw new Error("Invalid election ID");
  }
  return parsed;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const electionId = await parseElectionId(params);
    const election = await getElectionWithRelations({ id: electionId });
    if (!election) {
      return new Response("Election not found", { status: 404 });
    }
    return Response.json(serializeElectionForClient(election));
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Failed to load election",
      { status: 400 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authLevel = await getGatewayAuthLevel(request);
  if (!(await canManageElections(authLevel))) {
    return new Response("Only the President or an SE Admin can update elections", {
      status: 403,
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  try {
    const electionId = await parseElectionId(params);
    const existing = await prisma.election.findUnique({
      where: { id: electionId },
      include: {
        offices: {
          include: {
            nominations: true,
          },
        },
      },
    });

    if (!existing) {
      return new Response("Election not found", { status: 404 });
    }

    const nextStatus = body.status as ElectionStatus | undefined;
    if (nextStatus) {
      if (!canTransitionElectionStatus(existing.status, nextStatus)) {
        return new Response(
          `Cannot transition election from ${existing.status} to ${nextStatus}`,
          { status: 409 }
        );
      }

      if (
        nextStatus === ElectionStatus.NOMINATIONS_OPEN &&
        !(await stageHasRequiredApprovals(electionId, ElectionApprovalStage.CONFIG))
      ) {
        return new Response(
          "CONFIG approval requires the President and one distinct SE Admin",
          { status: 409 }
        );
      }

      if (
        nextStatus === ElectionStatus.NOMINATIONS_CLOSED &&
        new Date() < existing.nominationsCloseAt
      ) {
        return new Response("Nominations cannot be closed before the cutoff", {
          status: 409,
        });
      }

      if (nextStatus === ElectionStatus.VOTING_OPEN) {
        const approvedCandidateCounts = existing.offices.map((office) =>
          office.nominations.filter(
            (nomination) =>
              nomination.status === ElectionNominationStatus.ACCEPTED &&
              nomination.eligibilityStatus === ElectionEligibilityStatus.APPROVED
          ).length
        );
        if (approvedCandidateCounts.some((count) => count < 1)) {
          return new Response(
            "Each office must have at least one approved candidate before voting opens",
            { status: 409 }
          );
        }
        if (
          !(await stageHasRequiredApprovals(electionId, ElectionApprovalStage.BALLOT))
        ) {
          return new Response(
            "BALLOT approval requires the President and one distinct SE Admin",
            { status: 409 }
          );
        }
      }

      if (nextStatus === ElectionStatus.CERTIFIED) {
        return new Response(
          "Use /api/elections/:id/certify to certify an election",
          { status: 400 }
        );
      }

      const updated = await prisma.election.update({
        where: { id: electionId },
        data: { status: nextStatus },
      });
      return Response.json(updated);
    }

    const title = body.title !== undefined ? String(body.title).trim() : existing.title;
    const slug = body.slug !== undefined ? String(body.slug).trim() : existing.slug;
    const description =
      body.description !== undefined
        ? String(body.description).trim()
        : existing.description;
    const positionIds = Array.isArray(body.positionIds)
      ? body.positionIds.map((value: unknown) => Number(value))
      : existing.offices.map((office) => office.officerPositionId);
    const nominationsOpenAt =
      body.nominationsOpenAt !== undefined
        ? parseDate(body.nominationsOpenAt, "nominationsOpenAt")
        : existing.nominationsOpenAt;
    const nominationsCloseAt =
      body.nominationsCloseAt !== undefined
        ? parseDate(body.nominationsCloseAt, "nominationsCloseAt")
        : existing.nominationsCloseAt;
    const votingOpenAt =
      body.votingOpenAt !== undefined
        ? parseDate(body.votingOpenAt, "votingOpenAt")
        : existing.votingOpenAt;
    const votingCloseAt =
      body.votingCloseAt !== undefined
        ? parseDate(body.votingCloseAt, "votingCloseAt")
        : existing.votingCloseAt;
    validateElectionWindow({
      nominationsOpenAt,
      nominationsCloseAt,
      votingOpenAt,
      votingCloseAt,
    });
    await assertPrimaryOfficerPositions(positionIds);

    await prisma.$transaction(async (tx) => {
      await tx.election.update({
        where: { id: electionId },
        data: {
          title,
          slug,
          description,
          nominationsOpenAt,
          nominationsCloseAt,
          votingOpenAt,
          votingCloseAt,
        },
      });

      const currentPositionIds = existing.offices.map((office) => office.officerPositionId);
      const toDelete = currentPositionIds.filter(
        (positionId: number) => !positionIds.includes(positionId)
      );
      const toCreate = positionIds.filter(
        (positionId: number) => !currentPositionIds.includes(positionId)
      );

      if (toDelete.length > 0) {
        await tx.electionOffice.deleteMany({
          where: {
            electionId,
            officerPositionId: { in: toDelete },
          },
        });
      }

      if (toCreate.length > 0) {
        await tx.electionOffice.createMany({
          data: toCreate.map((officerPositionId: number) => ({
            electionId,
            officerPositionId,
          })),
        });
      }
    });

    return Response.json(
      serializeElectionForClient(await getElectionWithRelations({ id: electionId }))
    );
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Failed to update election",
      { status: 400 }
    );
  }
}
