import prisma from "@/lib/prisma";
import { getGatewayAuthLevel } from "@/lib/authGateway";
import { PRESIDENT_TITLE } from "@/lib/elections";
import { isActiveMemberForElection } from "@/lib/electionEligibility";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import {
  ElectionEligibilityStatus,
  ElectionNominationStatus,
  ElectionRunningMateStatus,
  ElectionStatus,
} from "@prisma/client";

export const dynamic = "force-dynamic";

// Amendment 12: the presidential nominee has 22 hours after inviting someone
// to run with them before the invite expires (matches the design spec).
const RUNNING_MATE_INVITE_TTL_MS = 22 * 60 * 60 * 1000;

async function parseIds(
  params: Promise<{ id: string; nominationId: string }>
) {
  const { id, nominationId } = await params;
  const electionId = Number(id);
  const parsedNominationId = Number(nominationId);
  if (!Number.isInteger(electionId) || !Number.isInteger(parsedNominationId)) {
    throw new Error("Invalid election or nomination ID");
  }
  return { electionId, nominationId: parsedNominationId };
}

async function loadPresidentialNomination(
  electionId: number,
  nominationId: number
) {
  return prisma.electionNomination.findUnique({
    where: { id: nominationId },
    include: {
      electionOffice: {
        include: {
          election: true,
          officerPosition: { select: { title: true } },
        },
      },
      runningMateInvitation: {
        include: {
          invitee: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImageKey: true,
              googleImageURL: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Invite an active member to be the presidential ticket's VP.
 * Only the presidential nominee themselves can call this route, and only
 * while their own nomination is ACCEPTED + APPROVED.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; nominationId: string }> }
) {
  const authLevel = await getGatewayAuthLevel(request);
  if (!authLevel.userId) {
    return new Response("You must be signed in to invite a running mate", {
      status: 401,
    });
  }

  let body: { inviteeUserId?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  const inviteeUserId = Number(body.inviteeUserId);
  if (!Number.isInteger(inviteeUserId)) {
    return new Response("inviteeUserId is required", { status: 400 });
  }

  try {
    const { electionId, nominationId } = await parseIds(params);
    const nomination = await loadPresidentialNomination(electionId, nominationId);
    if (!nomination || nomination.electionOffice.electionId !== electionId) {
      return new Response("Nomination not found", { status: 404 });
    }
    if (nomination.electionOffice.officerPosition.title !== PRESIDENT_TITLE) {
      return new Response(
        "Only presidential nominees can invite a running mate",
        { status: 400 }
      );
    }
    if (nomination.nomineeUserId !== authLevel.userId) {
      return new Response(
        "Only the presidential nominee themselves can invite a running mate",
        { status: 403 }
      );
    }
    if (
      nomination.status !== ElectionNominationStatus.ACCEPTED ||
      nomination.eligibilityStatus !== ElectionEligibilityStatus.APPROVED
    ) {
      return new Response(
        "Your nomination must be accepted and eligibility-approved before you can invite a VP",
        { status: 409 }
      );
    }
    const election = nomination.electionOffice.election;
    if (
      election.status !== ElectionStatus.NOMINATIONS_OPEN &&
      election.status !== ElectionStatus.NOMINATIONS_CLOSED
    ) {
      return new Response(
        "Running-mate invitations can only be sent before voting opens",
        { status: 409 }
      );
    }
    if (inviteeUserId === authLevel.userId) {
      return new Response("You cannot invite yourself as a running mate", {
        status: 400,
      });
    }
    if (!(await isActiveMemberForElection(inviteeUserId))) {
      return new Response("Running mate must be an active member", {
        status: 400,
      });
    }

    // A presidential nomination may have at most one active invitation.
    // Existing non-terminal invitations (INVITED, ACCEPTED) block re-invite.
    const existing = nomination.runningMateInvitation;
    if (
      existing &&
      (existing.status === ElectionRunningMateStatus.INVITED ||
        existing.status === ElectionRunningMateStatus.ACCEPTED)
    ) {
      return new Response(
        "You already have an active running-mate invitation — revoke it first",
        { status: 409 }
      );
    }

    // Prevent double-laying-claim: no other president in this election may
    // already have this invitee as an ACCEPTED or INVITED running mate.
    const conflict = await prisma.electionRunningMateInvitation.findFirst({
      where: {
        inviteeUserId,
        status: {
          in: [
            ElectionRunningMateStatus.INVITED,
            ElectionRunningMateStatus.ACCEPTED,
          ],
        },
        presidentNomination: {
          electionOffice: { electionId },
        },
      },
    });
    if (conflict) {
      return new Response(
        "That member is already attached to another presidential ticket in this election",
        { status: 409 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + RUNNING_MATE_INVITE_TTL_MS);

    const invitation = await prisma.electionRunningMateInvitation.upsert({
      where: { presidentNominationId: nomination.id },
      create: {
        presidentNominationId: nomination.id,
        inviteeUserId,
        status: ElectionRunningMateStatus.INVITED,
        expiresAt,
      },
      update: {
        inviteeUserId,
        status: ElectionRunningMateStatus.INVITED,
        expiresAt,
        respondedAt: null,
        declineReason: null,
      },
      include: {
        invitee: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImageKey: true,
            googleImageURL: true,
          },
        },
        presidentNomination: {
          include: {
            nominee: { select: { id: true, name: true } },
            electionOffice: {
              include: {
                election: { select: { id: true, title: true, slug: true } },
              },
            },
          },
        },
      },
    });

    // Fire-and-forget email. Guarded so local dev without SMTP env vars
    // is a silent no-op rather than a 500.
    if (isEmailConfigured()) {
      const election = invitation.presidentNomination.electionOffice.election;
      const presidentName = invitation.presidentNomination.nominee.name;
      const link = `${process.env.NEXTAUTH_URL?.replace(/\/+$/, "") || ""}/elections/${election.slug}`;
      const subject = `You've been invited as a running mate on ${presidentName}'s ticket`;
      const html = `<p>Hi ${invitation.invitee.name},</p>
<p><strong>${presidentName}</strong> invited you to run as their Vice President on the <strong>${election.title}</strong> ticket.</p>
<p>If you accept, you&apos;ll appear on the ballot together. Voters who choose your ticket for President are implicitly electing you for VP under Amendment 12.</p>
<p><a href="${link}">Open the election on the SSE website</a> and find the running-mate invitation panel to accept or decline. The invitation expires in 22 hours.</p>
<p>— The Society of Software Engineers</p>`;
      const text = `${presidentName} invited you to run as VP on their ${election.title} ticket. Open ${link} to accept or decline. Expires in 22 hours.`;
      // Don't await — email failures should not block the invite.
      sendEmail({ to: invitation.invitee.email, subject, html, text }).catch(
        (err) => console.error("running-mate invite email failed", err)
      );
    }

    return Response.json(invitation);
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Failed to invite running mate",
      { status: 400 }
    );
  }
}

/**
 * Revoke an outstanding invitation. Allowed while still INVITED — after the
 * invitee has ACCEPTED, the invitation is recorded as WITHDRAWN.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; nominationId: string }> }
) {
  const authLevel = await getGatewayAuthLevel(request);
  if (!authLevel.userId) {
    return new Response("You must be signed in to revoke a running-mate invite", {
      status: 401,
    });
  }

  try {
    const { electionId, nominationId } = await parseIds(params);
    const nomination = await loadPresidentialNomination(electionId, nominationId);
    if (!nomination || nomination.electionOffice.electionId !== electionId) {
      return new Response("Nomination not found", { status: 404 });
    }
    if (nomination.nomineeUserId !== authLevel.userId) {
      return new Response(
        "Only the presidential nominee can revoke their own invitation",
        { status: 403 }
      );
    }
    const existing = nomination.runningMateInvitation;
    if (!existing) {
      return new Response("No running-mate invitation to revoke", {
        status: 404,
      });
    }
    if (
      existing.status !== ElectionRunningMateStatus.INVITED &&
      existing.status !== ElectionRunningMateStatus.ACCEPTED
    ) {
      return new Response("This invitation is already closed", { status: 409 });
    }

    const updated = await prisma.electionRunningMateInvitation.update({
      where: { id: existing.id },
      data: {
        status: ElectionRunningMateStatus.WITHDRAWN,
        respondedAt: new Date(),
      },
    });

    return Response.json(updated);
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Failed to revoke running-mate invite",
      { status: 400 }
    );
  }
}
