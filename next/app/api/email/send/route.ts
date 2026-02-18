import prisma from "@/lib/prisma";
import { getSessionToken } from "@/lib/sessionToken";
import { sendEmail, isEmailConfigured, EmailAttachment } from "@/lib/email";
import { NextRequest } from "next/server";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

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
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/\[(.+?)\]\((.+?)\)/g, "$1 ($2)")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/`{1,3}[^`]*`{1,3}/g, (m) => m.replace(/`/g, ""))
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/^\s*\d+\.\s+/gm, (m) => m)
    .replace(/\n{3,}/g, "\n\n");
}

/**
 * POST /api/email/send
 * Send an email to an explicit list of recipients.
 * Requires officer auth.
 *
 * Body: {
 *   subject: string,
 *   message: string,      // markdown content
 *   recipients: Array<{ email: string; name?: string }>,
 *   attachments?: Array<{ filename: string; content: string; encoding?: string }>
 * }
 */
export async function POST(request: NextRequest) {
  const authToken = getSessionToken(request);

  if (!authToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = await prisma.user.findFirst({
    where: {
      session: {
        some: { sessionToken: authToken },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      officers: {
        where: { is_active: true },
        select: {
          position: { select: { is_primary: true, title: true } },
        },
      },
      mentor: {
        where: { isActive: true },
      },
    },
  });

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const isOfficer = user.officers.length > 0;
  const isMentor = user.mentor.length > 0;

  if (!isOfficer && !isMentor) {
    return new Response("Only officers and mentors can send emails", { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { subject, message, recipients, attachments: rawAttachments } = body;

  if (!subject || !message) {
    return new Response('"subject" and "message" are required', { status: 400 });
  }

  if (!Array.isArray(recipients) || recipients.length === 0) {
    return new Response('"recipients" must be a non-empty array', { status: 400 });
  }

  const validRecipients = recipients.filter(
    (r: { email?: string }) => r.email && typeof r.email === "string"
  );
  if (validRecipients.length === 0) {
    return new Response("No valid recipient emails found", { status: 400 });
  }

  if (!isEmailConfigured()) {
    return new Response("Email service is not configured", { status: 503 });
  }

  const messageHtml = await markdownToHtml(message);
  const messagePlain = markdownToPlainText(message);

  const emailAttachments: EmailAttachment[] = [];
  if (Array.isArray(rawAttachments)) {
    for (const att of rawAttachments) {
      if (!att.filename || !att.content) continue;
      emailAttachments.push({
        filename: att.filename,
        content: att.content,
        encoding: att.encoding || "base64",
      });
    }
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #426E8C, #5289AF); color: white; padding: 24px 32px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 22px;">Society of Software Engineers</h1>
      </div>
      <div style="padding: 24px 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #333; margin-top: 0;">${subject}</h2>
        <div style="color: #555; line-height: 1.6;">${messageHtml}</div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">Sent by ${user.name} via SSE</p>
      </div>
    </div>
  `;

  const textContent = `${subject}\n\n${messagePlain}\n\n---\nSent by ${user.name} via SSE`;

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const recipient of validRecipients) {
    try {
      await sendEmail({
        to: recipient.email,
        subject,
        html: htmlContent,
        text: textContent,
        attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
      });
      sent++;
    } catch (err) {
      failed++;
      errors.push(`${recipient.email}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return Response.json({
    success: true,
    sent,
    failed,
    total: validRecipients.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
