import prisma from "@/lib/prisma";
import { getGatewayAuthLevel } from "@/lib/authGateway";
import { getElectionUrl, getElectionWithRelations } from "@/lib/elections";
import { isActiveMemberForElection } from "@/lib/electionEligibility";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { ElectionStatus } from "@prisma/client";

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
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const electionId = await parseElectionId(params);
    const election = await getElectionWithRelations({ id: electionId });
    if (!election) {
      return new Response("Election not found", { status: 404 });
    }
    return Response.json(election.offices.flatMap((office) => office.nominations));
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Failed to load nominations",
      { status: 400 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authLevel = await getGatewayAuthLevel(request);
  if (!authLevel.userId) {
    return new Response("You must be signed in to submit nominations", {
      status: 401,
    });
  }

  try {
    const electionId = await parseElectionId(params);
    const election = await prisma.election.findUnique({
      where: { id: electionId },
      include: {
        offices: {
          include: {
            officerPosition: {
              select: { title: true },
            },
          },
        },
      },
    });
    if (!election) {
      return new Response("Election not found", { status: 404 });
    }
    if (election.status !== ElectionStatus.NOMINATIONS_OPEN) {
      return new Response("Nominations are not currently open", { status: 409 });
    }
    if (!(await isActiveMemberForElection(authLevel.userId))) {
      return new Response("Only active-term members can submit nominations", {
        status: 403,
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const electionOfficeId = Number(body.electionOfficeId);
    const nomineeUserId = Number(body.nomineeUserId);

    if (!Number.isInteger(electionOfficeId) || !Number.isInteger(nomineeUserId)) {
      return new Response("electionOfficeId and nomineeUserId are required", {
        status: 400,
      });
    }

    const office = election.offices.find((item) => item.id === electionOfficeId);
    if (!office) {
      return new Response("Election office not found", { status: 404 });
    }

    const nominee = await prisma.user.findUnique({
      where: { id: nomineeUserId },
      select: { id: true, name: true, email: true },
    });
    if (!nominee) {
      return new Response("Nominee not found", { status: 404 });
    }

    const nomination = await prisma.electionNomination.upsert({
      where: {
        electionOfficeId_nomineeUserId: {
          electionOfficeId,
          nomineeUserId,
        },
      },
      update: {},
      create: {
        electionOfficeId,
        nomineeUserId,
        nominatorUserId: authLevel.userId,
      },
      include: {
        nominee: {
          select: { id: true, name: true, email: true },
        },
        nominator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (isEmailConfigured()) {
      try {
        const electionUrl = getElectionUrl(request, election.slug);
        const positionTitle = office.officerPosition.title;
        const nominatorName = nomination.nominator.name;
        await sendEmail({
          to: nominee.email,
          subject: `You've been nominated for ${positionTitle}`,
          html: `<p>Hi ${nominee.name},</p>
<p><strong>${nominatorName}</strong> nominated you for <strong>${positionTitle}</strong> in the SSE primary election.</p>
<p>If you&apos;d like to run, accept the nomination on the SSE website. You&apos;ll appear on the ballot once your eligibility is confirmed. Otherwise, feel free to decline — no obligation.</p>
<p><a href="${electionUrl}">Open the election on the SSE website</a> to accept or decline.</p>
<p>— The Society of Software Engineers</p>`,
          text: `${nominatorName} nominated you for ${positionTitle} in the SSE primary election. Open ${electionUrl} to accept or decline.`,
        });
      } catch (error) {
        console.error("Failed to send nomination email:", error);
      }
    }

    return Response.json(nomination, { status: 201 });
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Failed to submit nomination",
      { status: 400 }
    );
  }
}
