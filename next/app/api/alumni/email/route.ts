import prisma from "@/lib/prisma";
import { sendEmail, isEmailConfigured, EmailAttachment } from "@/lib/email";
import { NextRequest } from "next/server";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

export const dynamic = "force-dynamic";

/**
 * Convert markdown text to sanitized HTML
 */
async function markdownToHtml(md: string): Promise<string> {
  const result = await remark()
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(md);
  return String(result);
}

/**
 * Strip markdown syntax for plain-text fallback
 */
function markdownToPlainText(md: string): string {
  return md
    .replace(/#{1,6}\s+/g, "") // headings
    .replace(/\*\*(.+?)\*\*/g, "$1") // bold
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.+?)\*/g, "$1") // italic
    .replace(/_(.+?)_/g, "$1")
    .replace(/\[(.+?)\]\((.+?)\)/g, "$1 ($2)") // links
    .replace(/!\[.*?\]\(.*?\)/g, "") // images
    .replace(/`{1,3}[^`]*`{1,3}/g, (m) => m.replace(/`/g, "")) // code
    .replace(/^\s*[-*+]\s+/gm, "• ") // unordered lists
    .replace(/^\s*\d+\.\s+/gm, (m) => m) // ordered lists (keep)
    .replace(/\n{3,}/g, "\n\n"); // collapse newlines
}

/**
 * POST /api/alumni/email
 * Send a mass email to all alumni who opted in to receive emails (showEmail: true).
 * Only accessible by primary officers.
 *
 * Body: {
 *   subject: string,
 *   message: string,            // markdown content
 *   attachments?: Array<{ filename: string, content: string, encoding?: string }>
 * }
 */
export async function POST(request: NextRequest) {
  // Verify the user is a primary officer
  const authToken = request.cookies.get(process.env.SESSION_COOKIE_NAME!)?.value;

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
          position: {
            select: { is_primary: true },
          },
        },
      },
    },
  });

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const isPrimary = user.officers.some((o) => o.position.is_primary);
  if (!isPrimary) {
    return new Response("Only primary officers can send alumni emails", { status: 403 });
  }

  // Parse the request body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { subject, message, attachments: rawAttachments } = body;

  if (!subject || !message) {
    return new Response('"subject" and "message" are required', { status: 400 });
  }

  // Check email is configured
  if (!isEmailConfigured()) {
    return new Response("Email service is not configured", { status: 503 });
  }

  // Convert markdown to HTML
  const messageHtml = await markdownToHtml(message);
  const messagePlain = markdownToPlainText(message);

  // Validate and build attachments
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

  // Get all opted-in alumni
  const alumni = await prisma.alumni.findMany({
    where: { showEmail: true },
    select: { email: true, name: true },
  });

  if (alumni.length === 0) {
    return Response.json({
      success: true,
      sent: 0,
      message: "No alumni have opted in to receive emails.",
    });
  }

  // Build HTML email with rendered markdown
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #426E8C, #5289AF); color: white; padding: 24px 32px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 22px;">Society of Software Engineers</h1>
        <p style="margin: 4px 0 0; opacity: 0.9; font-size: 14px;">Alumni Newsletter</p>
      </div>
      <div style="padding: 24px 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #333; margin-top: 0;">${subject}</h2>
        <div style="color: #555; line-height: 1.6;">${messageHtml}</div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">
          You received this email because you opted in as an SSE alumni.
          To unsubscribe, update your preferences on the SSE alumni page.
        </p>
      </div>
    </div>
  `;

  const textContent = `${subject}\n\n${messagePlain}\n\n---\nYou received this email because you opted in as an SSE alumni.`;

  // Send emails
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const alum of alumni) {
    try {
      await sendEmail({
        to: alum.email,
        subject: `[SSE Alumni] ${subject}`,
        html: htmlContent,
        text: textContent,
        attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
      });
      sent++;
    } catch (err) {
      failed++;
      errors.push(`${alum.email}: ${err instanceof Error ? err.message : String(err)}`);
      console.error(`Failed to send alumni email to ${alum.email}:`, err);
    }
  }

  return Response.json({
    success: true,
    sent,
    failed,
    total: alumni.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}

/**
 * GET /api/alumni/email
 * Returns the count of alumni who have opted in to receive emails.
 * Only accessible by primary officers.
 */
export async function GET(request: NextRequest) {
  const authToken = request.cookies.get(process.env.SESSION_COOKIE_NAME!)?.value;

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
      officers: {
        where: { is_active: true },
        select: {
          position: { select: { is_primary: true } },
        },
      },
    },
  });

  if (!user || !user.officers.some((o) => o.position.is_primary)) {
    return new Response("Forbidden", { status: 403 });
  }

  const count = await prisma.alumni.count({
    where: { showEmail: true },
  });

  return Response.json({ optedInCount: count });
}
