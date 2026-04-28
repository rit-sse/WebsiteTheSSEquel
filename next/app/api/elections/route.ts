import prisma from "@/lib/prisma";
import { getGatewayAuthLevel } from "@/lib/authGateway";
import {
  assertPrimaryOfficerPositions,
  getElectionWithRelations,
  serializeElectionForClient,
  validateElectionWindow,
} from "@/lib/elections";
import { canManageElections } from "@/lib/seAdmin";
import { ElectionKind, ElectionStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

function parseDate(value: unknown, field: string) {
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date for ${field}`);
  }
  return parsed;
}

export async function GET() {
  const elections = await prisma.election.findMany({
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      certifiedBy: {
        select: { id: true, name: true, email: true },
      },
      offices: {
        include: {
          officerPosition: {
            select: { id: true, title: true, is_primary: true },
          },
          nominations: {
            select: {
              id: true,
              status: true,
              eligibilityStatus: true,
            },
          },
        },
      },
      approvals: {
        select: {
          id: true,
          stage: true,
          userId: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return Response.json(serializeElectionForClient(elections));
}

export async function POST(request: Request) {
  const authLevel = await getGatewayAuthLevel(request);
  if (!(await canManageElections(authLevel))) {
    return new Response("Only the President or an SE Admin can create elections", {
      status: 403,
    });
  }
  if (!authLevel.userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  try {
    const title = String(body.title ?? "").trim();
    const slug = String(body.slug ?? "").trim();
    const description = String(body.description ?? "").trim();
    const positionIds = Array.isArray(body.positionIds)
      ? body.positionIds.map((value: unknown) => Number(value))
      : [];

    if (!title || !slug || positionIds.length === 0) {
      return new Response("title, slug, and positionIds are required", {
        status: 400,
      });
    }

    const nominationsOpenAt = parseDate(body.nominationsOpenAt, "nominationsOpenAt");
    const nominationsCloseAt = parseDate(
      body.nominationsCloseAt,
      "nominationsCloseAt"
    );
    const votingOpenAt = parseDate(body.votingOpenAt, "votingOpenAt");
    const votingCloseAt = parseDate(body.votingCloseAt, "votingCloseAt");
    validateElectionWindow({
      nominationsOpenAt,
      nominationsCloseAt,
      votingOpenAt,
      votingCloseAt,
    });
    await assertPrimaryOfficerPositions(positionIds);

    const created = await prisma.election.create({
      data: {
        title,
        slug,
        description,
        kind: ElectionKind.PRIMARY_OFFICER,
        status: ElectionStatus.DRAFT,
        nominationsOpenAt,
        nominationsCloseAt,
        votingOpenAt,
        votingCloseAt,
        createdById: authLevel.userId,
        offices: {
          create: positionIds.map((officerPositionId: number) => ({
            officerPositionId,
          })),
        },
      },
    });

    return Response.json(
      serializeElectionForClient(await getElectionWithRelations({ id: created.id })),
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.code === "P2002") {
      return new Response("An election with that slug already exists", {
        status: 409,
      });
    }
    return new Response(
      error instanceof Error ? error.message : "Failed to create election",
      { status: 400 }
    );
  }
}
