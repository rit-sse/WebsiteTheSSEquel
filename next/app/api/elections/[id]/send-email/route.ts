import prisma from "@/lib/prisma";
import { getGatewayAuthLevel } from "@/lib/authGateway";
import { getElectionUrl } from "@/lib/elections";
import { listEligibleElectionVoters } from "@/lib/electionEligibility";
import { sendEmail, isEmailConfigured, type EmailAttachment } from "@/lib/email";
import { NextRequest } from "next/server";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { ElectionEmailKind } from "@prisma/client";
import { canManageElections } from "@/lib/seAdmin";

export const dynamic = "force-dynamic";

async function markdownToHtml(md: string): Promise<string> {
  const result = await remark()
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(md);
  return String(result);
}

function markdownToPlainText(md: string): string {
  return md
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\[(.+?)\]\((.+?)\)/g, "$1 ($2)")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authLevel = await getGatewayAuthLevel(request);
  if (!(await canManageElections(authLevel)) || !authLevel.userId) {
    return new Response("Only the President or an SE Admin can send election emails", {
      status: 403,
    });
  }
  if (!isEmailConfigured()) {
    return new Response("Email service is not configured", { status: 503 });
  }

  const { id } = await params;
  const electionId = Number(id);
  if (!Number.isInteger(electionId)) {
    return new Response("Invalid election ID", { status: 400 });
  }

  const election = await prisma.election.findUnique({
    where: { id: electionId },
    select: { id: true, title: true, slug: true },
  });
  if (!election) {
    return new Response("Election not found", { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const kind = body.kind as ElectionEmailKind | undefined;
  // RUNNING_MATE_INVITE is sent by the running-mate invite route directly
  // (one recipient, templated), not by this broadcast endpoint.
  const broadcastKinds: readonly ElectionEmailKind[] = [
    ElectionEmailKind.BALLOT_ANNOUNCEMENT,
    ElectionEmailKind.BALLOT_REMINDER,
    ElectionEmailKind.NOMINATION_NOTICE,
  ];
  if (!kind || !broadcastKinds.includes(kind)) {
    return new Response("A valid election email kind is required", { status: 400 });
  }

  const subject = String(body.subject ?? "").trim();
  const message = String(body.message ?? "").trim();
  if (!subject || !message) {
    return new Response("subject and message are required", { status: 400 });
  }

  const recipients = await listEligibleElectionVoters();
  const excludeSubmitted = Boolean(body.excludeSubmitted);
  const submittedVoterIds = excludeSubmitted
    ? new Set(
        (
          await prisma.electionBallot.findMany({
            where: { electionId },
            select: { voterId: true },
          })
        ).map((ballot) => ballot.voterId)
      )
    : new Set<number>();
  const finalRecipients = recipients.filter(
    (recipient) => !submittedVoterIds.has(recipient.id)
  );

  const htmlMessage = await markdownToHtml(
    `${message}\n\n[Open the election](${getElectionUrl(request, election.slug)})`
  );
  const plainMessage = `${markdownToPlainText(message)}\n\nOpen the election: ${getElectionUrl(
    request,
    election.slug
  )}`;

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  const attachments: EmailAttachment[] = Array.isArray(body.attachments)
    ? body.attachments
        .filter((attachment: any) => attachment.filename && attachment.content)
        .map((attachment: any) => ({
          filename: attachment.filename,
          content: attachment.content,
          encoding: attachment.encoding || "base64",
        }))
    : [];

  for (const recipient of finalRecipients) {
    try {
      await sendEmail({
        to: recipient.email,
        subject,
        text: plainMessage,
        html: htmlMessage,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      sent++;
    } catch (error) {
      failed++;
      errors.push(
        `${recipient.email}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  await prisma.electionEmailLog.create({
    data: {
      electionId,
      sentById: authLevel.userId,
      kind,
      subject,
      message,
      recipientCount: finalRecipients.length,
    },
  });

  return Response.json({
    sent,
    failed,
    total: finalRecipients.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
