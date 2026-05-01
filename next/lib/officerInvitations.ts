import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { sendEmail, isEmailConfigured } from "@/lib/email";

type PrismaExecutor = Pick<
  Prisma.TransactionClient,
  "officerPosition" | "officer" | "invitation"
>;

const officerInvitationInclude = {
  position: true,
  inviter: {
    select: {
      name: true,
      email: true,
    },
  },
} satisfies Prisma.InvitationInclude;

export type OfficerInvitation = Prisma.InvitationGetPayload<{
  include: typeof officerInvitationInclude;
}>;

export class InvitationError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "InvitationError";
    this.status = status;
  }
}

export async function createOfficerInvitationRecord({
  db = prisma,
  email,
  positionId,
  startDate,
  endDate,
  invitedBy,
  refreshExisting = false,
}: {
  db?: PrismaExecutor;
  email: string;
  positionId: number;
  startDate: Date | string;
  endDate: Date | string;
  invitedBy: number;
  refreshExisting?: boolean;
}): Promise<{ invitation: OfficerInvitation; created: boolean }> {
  if (!email.endsWith("@g.rit.edu")) {
    throw new InvitationError("Email must be an @g.rit.edu address", 400);
  }

  if (!positionId || !startDate || !endDate) {
    throw new InvitationError(
      'Officer invitations require "positionId", "startDate", and "endDate"',
      400,
    );
  }

  const position = await db.officerPosition.findUnique({
    where: { id: positionId },
    select: { id: true },
  });
  if (!position) {
    throw new InvitationError("Position not found", 404);
  }

  const activeOfficer = await db.officer.findFirst({
    where: {
      position_id: positionId,
      is_active: true,
    },
    select: { id: true },
  });
  if (activeOfficer) {
    throw new InvitationError(
      "This position already has an active officer. Remove them first or wait for their term to end.",
      409,
    );
  }

  const existingInvitation = await db.invitation.findUnique({
    where: {
      invitedEmail_type: {
        invitedEmail: email,
        type: "officer",
      },
    },
  });

  if (existingInvitation && !refreshExisting) {
    throw new InvitationError(
      "An invitation for this email as a officer already exists",
      409,
    );
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  if (existingInvitation) {
    const invitation = await db.invitation.update({
      where: { id: existingInvitation.id },
      data: {
        positionId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        invitedBy,
        expiresAt,
      },
      include: officerInvitationInclude,
    });
    return { invitation, created: false };
  }

  const invitation = await db.invitation.create({
    data: {
      invitedEmail: email,
      type: "officer",
      positionId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      invitedBy,
      expiresAt,
    },
    include: officerInvitationInclude,
  });
  return { invitation, created: true };
}

export async function sendOfficerInvitationEmail({
  invitation,
  baseUrl,
}: {
  invitation: OfficerInvitation;
  baseUrl: string;
}) {
  if (!isEmailConfigured() || !invitation.position) return false;

  const acceptUrl = `${baseUrl}/accept-invitation?email=${encodeURIComponent(
    invitation.invitedEmail,
  )}`;
  await sendEmail({
    to: invitation.invitedEmail,
    subject: `You've been invited to join SSE as ${invitation.position.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">You've been invited to join SSE!</h1>
        <p>Hi! You've been invited to join the Society of Software Engineers officer board as <strong>${invitation.position.title}</strong>.</p>
        <p>Your term will be from <strong>${new Date(invitation.startDate!).toLocaleDateString()}</strong> to <strong>${new Date(invitation.endDate!).toLocaleDateString()}</strong>.</p>
        <p>To accept this invitation, click the button below to sign in with your RIT Google account:</p>
        <div style="margin: 30px 0;">
          <a href="${acceptUrl}" style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Sign In to Accept
          </a>
        </div>
        <p><em>This invitation expires in 30 days.</em></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #666; font-size: 12px;">
          Questions? Contact ${invitation.inviter.name} at ${invitation.inviter.email}
        </p>
      </div>
    `,
    text: `You've been invited to join SSE as ${invitation.position.title}!\n\nYour term: ${new Date(invitation.startDate!).toLocaleDateString()} to ${new Date(invitation.endDate!).toLocaleDateString()}\n\nAccept your invitation at: ${acceptUrl}\n\nThis invitation expires in 30 days.\n\nQuestions? Contact ${invitation.inviter.name} at ${invitation.inviter.email}`,
  });

  return true;
}

export type OfficerInvitationDispatch = {
  positionTitle: string;
  email: string;
  name: string;
  created: boolean;
  emailSent: boolean;
};
