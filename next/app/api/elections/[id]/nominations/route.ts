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

    // Split the old `upsert` into findUnique + branch so we can tell
    // whether this is a brand-new nomination or a duplicate attempt by a
    // second nominator. The schema only stores one `nominatorUserId` per
    // (office, nominee) pair, so duplicate attempts are a DB no-op — but
    // the email copy still needs to acknowledge the current nominator,
    // not just the first one whose row stuck.
    const existingNomination = await prisma.electionNomination.findUnique({
      where: {
        electionOfficeId_nomineeUserId: { electionOfficeId, nomineeUserId },
      },
      select: { id: true },
    });
    const isNewNomination = !existingNomination;
    const isSelfNomination = nomineeUserId === authLevel.userId;

    const nomination = existingNomination
      ? await prisma.electionNomination.update({
          where: { id: existingNomination.id },
          data: {}, // no-op — just returns the row with includes
          include: {
            nominee: { select: { id: true, name: true, email: true } },
            nominator: { select: { id: true, name: true, email: true } },
          },
        })
      : await prisma.electionNomination.create({
          data: {
            electionOfficeId,
            nomineeUserId,
            nominatorUserId: authLevel.userId,
          },
          include: {
            nominee: { select: { id: true, name: true, email: true } },
            nominator: { select: { id: true, name: true, email: true } },
          },
        });

    // The stored `nomination.nominator` is the *first* nominator (row
    // sticks on duplicate attempts). The email should credit whoever is
    // nominating *right now* — which is the authenticated requester.
    const currentNominator = await prisma.user.findUnique({
      where: { id: authLevel.userId },
      select: { name: true },
    });
    const currentNominatorName = currentNominator?.name ?? "A member";

    // Email rules:
    //   - self + new         → "You nominated yourself…" confirmation
    //   - self + duplicate   → skip entirely (you already emailed yourself)
    //   - other + new        → "X nominated you…"
    //   - other + duplicate  → "X also nominated you…" (another member
    //                          seconded your nomination)
    const skipEmail = isSelfNomination && !isNewNomination;
    if (isEmailConfigured() && !skipEmail) {
      try {
        const electionUrl = getElectionUrl(request, election.slug);
        const positionTitle = office.officerPosition.title;

        let subject: string;
        let html: string;
        let text: string;

        if (isSelfNomination) {
          subject = `You nominated yourself for ${positionTitle}`;
          html = `<p>Hi ${nominee.name},</p>
<p>You nominated yourself for <strong>${positionTitle}</strong> in the SSE primary election.</p>
<p>To appear on the ballot, accept the nomination on the SSE website — you&apos;ll show up once your eligibility is confirmed.</p>
<p><a href="${electionUrl}">Open the election on the SSE website</a> to accept.</p>
<p>— The Society of Software Engineers</p>`;
          text = `You nominated yourself for ${positionTitle} in the SSE primary election. Open ${electionUrl} to accept.`;
        } else if (isNewNomination) {
          subject = `You've been nominated for ${positionTitle}`;
          html = `<p>Hi ${nominee.name},</p>
<p><strong>${currentNominatorName}</strong> nominated you for <strong>${positionTitle}</strong> in the SSE primary election.</p>
<p>If you&apos;d like to run, accept the nomination on the SSE website. You&apos;ll appear on the ballot once your eligibility is confirmed. Otherwise, feel free to decline — no obligation.</p>
<p><a href="${electionUrl}">Open the election on the SSE website</a> to accept or decline.</p>
<p>— The Society of Software Engineers</p>`;
          text = `${currentNominatorName} nominated you for ${positionTitle} in the SSE primary election. Open ${electionUrl} to accept or decline.`;
        } else {
          subject = `${currentNominatorName} also nominated you for ${positionTitle}`;
          html = `<p>Hi ${nominee.name},</p>
<p><strong>${currentNominatorName}</strong> also nominated you for <strong>${positionTitle}</strong> in the SSE primary election — looks like members want to see you on the ballot.</p>
<p>Your existing nomination still stands; you only need to accept once to run.</p>
<p><a href="${electionUrl}">Open the election on the SSE website</a> to accept or decline.</p>
<p>— The Society of Software Engineers</p>`;
          text = `${currentNominatorName} also nominated you for ${positionTitle} in the SSE primary election. Open ${electionUrl} to accept or decline.`;
        }

        await sendEmail({ to: nominee.email, subject, html, text });
      } catch (error) {
        console.error("Failed to send nomination email:", error);
      }
    }

    return Response.json(nomination, {
      status: isNewNomination ? 201 : 200,
    });
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Failed to submit nomination",
      { status: 400 }
    );
  }
}
