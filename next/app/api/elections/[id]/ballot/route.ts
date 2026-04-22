import prisma from "@/lib/prisma";
import { getGatewayAuthLevel } from "@/lib/authGateway";
import {
  getElectionWithRelations,
  isTicketDerivedOffice,
  serializeElectionForClient,
} from "@/lib/elections";
import { isActiveMemberForElection } from "@/lib/electionEligibility";
import {
  ElectionEligibilityStatus,
  ElectionNominationStatus,
  ElectionStatus,
} from "@prisma/client";

export const dynamic = "force-dynamic";

async function parseElectionId(params: Promise<{ id: string }>) {
  const { id } = await params;
  const parsed = Number(id);
  if (!Number.isInteger(parsed)) {
    throw new Error("Invalid election ID");
  }
  return parsed;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authLevel = await getGatewayAuthLevel(request);
  if (!authLevel.userId) {
    return new Response("You must be signed in to view a ballot", { status: 401 });
  }

  try {
    const electionId = await parseElectionId(params);
    const election = await getElectionWithRelations({ id: electionId });
    if (!election) {
      return new Response("Election not found", { status: 404 });
    }

    const ballot = election.ballots.find((item) => item.voterId === authLevel.userId) ?? null;
    // Amendment 12: VP is ticket-derived and never appears on the ballot.
    const offices = election.offices
      .filter((office) => !isTicketDerivedOffice(office.officerPosition.title))
      .map((office) => ({
        ...office,
        nominations: office.nominations.filter(
          (nomination) =>
            nomination.status === ElectionNominationStatus.ACCEPTED &&
            nomination.eligibilityStatus === ElectionEligibilityStatus.APPROVED
        ),
      }));

    return Response.json(
      serializeElectionForClient({
        electionId: election.id,
        title: election.title,
        slug: election.slug,
        status: election.status,
        presidentOnlyBallot: false,
        isEligibleVoter: await isActiveMemberForElection(authLevel.userId),
        offices,
        ballot,
      })
    );
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Failed to load ballot",
      { status: 400 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authLevel = await getGatewayAuthLevel(request);
  if (!authLevel.userId) {
    return new Response("You must be signed in to vote", { status: 401 });
  }

  try {
    const electionId = await parseElectionId(params);
    const election = await getElectionWithRelations({ id: electionId });
    if (!election) {
      return new Response("Election not found", { status: 404 });
    }
    if (election.status !== ElectionStatus.VOTING_OPEN) {
      return new Response("Voting is not currently open", { status: 409 });
    }
    if (!(await isActiveMemberForElection(authLevel.userId))) {
      return new Response("Only active-term members can vote", { status: 403 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const rankings = Array.isArray(body.rankings) ? body.rankings : [];
    if (rankings.length === 0) {
      return new Response("At least one office ranking is required", { status: 400 });
    }

    const eligibleOffices = election.offices.filter(
      (office) => !isTicketDerivedOffice(office.officerPosition.title)
    );

    const rankingRows: Array<{
      electionOfficeId: number;
      nominationId: number;
      rank: number;
    }> = [];

    for (const officePayload of rankings) {
      const electionOfficeId = Number(officePayload.electionOfficeId);
      const nominationIds = Array.isArray(officePayload.nominationIds)
        ? officePayload.nominationIds.map((value: unknown) => Number(value))
        : [];
      const office = eligibleOffices.find((item) => item.id === electionOfficeId);
      if (!office) {
        return new Response("One or more office rankings are invalid", { status: 400 });
      }
      const validNominationIds = new Set(
        office.nominations
          .filter(
            (nomination) =>
              nomination.status === ElectionNominationStatus.ACCEPTED &&
              nomination.eligibilityStatus === ElectionEligibilityStatus.APPROVED
          )
          .map((nomination) => nomination.id)
      );
      if (new Set(nominationIds).size !== nominationIds.length) {
        return new Response("Duplicate candidate rankings are not allowed", {
          status: 400,
        });
      }
      if (
        !nominationIds.every((nominationId: number) =>
          validNominationIds.has(nominationId)
        )
      ) {
        return new Response("One or more ranked nominees are invalid", {
          status: 400,
        });
      }
      nominationIds.forEach((nominationId: number, index: number) => {
        rankingRows.push({
          electionOfficeId,
          nominationId,
          rank: index + 1,
        });
      });
    }

    const ballot = await prisma.$transaction(async (tx) => {
      const upsertedBallot = await tx.electionBallot.upsert({
        where: {
          electionId_voterId: {
            electionId,
            voterId: authLevel.userId!,
          },
        },
        create: {
          electionId,
          voterId: authLevel.userId!,
        },
        update: {
          submittedAt: new Date(),
        },
      });

      await tx.electionBallotRanking.deleteMany({
        where: { ballotId: upsertedBallot.id },
      });

      if (rankingRows.length > 0) {
        await tx.electionBallotRanking.createMany({
          data: rankingRows.map((row) => ({
            ballotId: upsertedBallot.id,
            electionOfficeId: row.electionOfficeId,
            nominationId: row.nominationId,
            rank: row.rank,
          })),
        });
      }

      return tx.electionBallot.findUnique({
        where: { id: upsertedBallot.id },
        include: {
          rankings: {
            orderBy: [{ electionOfficeId: "asc" }, { rank: "asc" }],
          },
        },
      });
    });

    return Response.json(ballot);
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Failed to save ballot",
      { status: 400 }
    );
  }
}
