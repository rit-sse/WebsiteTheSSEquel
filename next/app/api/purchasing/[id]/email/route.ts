import prisma from "@/lib/prisma";
import { getSessionToken } from "@/lib/sessionToken";
import { NextRequest } from "next/server";
import { sendEmail } from "@/lib/email";

export const dynamic = 'force-dynamic'

// Required email recipient that is always included and cannot be removed
const REQUIRED_RECIPIENT = "softwareengineering@rit.edu";

/**
 * POST /api/purchasing/[id]/email - Send email with purchase request details
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const requestId = parseInt(id);

  if (isNaN(requestId)) {
    return new Response("Invalid ID", { status: 400 });
  }

  const authToken = getSessionToken(request);

  if (!authToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = await prisma.user.findFirst({
    where: {
      session: {
        some: {
          sessionToken: authToken,
        },
      },
    },
    select: { 
      id: true, 
      email: true, 
      name: true,
    },
  });

  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  // Get the purchase request
  const purchaseRequest = await prisma.purchaseRequest.findUnique({
    where: { id: requestId },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });

  if (!purchaseRequest) {
    return new Response("Purchase request not found", { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  // Validate required fields
  if (!("type" in body)) {
    return new Response("'type' must be included in the body", { status: 400 });
  }

  const validTypes = ["checkout", "receipt"];
  if (!validTypes.includes(body.type)) {
    return new Response(`'type' must be one of: ${validTypes.join(", ")}`, { status: 422 });
  }

  try {
    // Determine recipient emails (always include required recipient)
    const userEmail = body.type === "checkout" 
      ? purchaseRequest.notifyEmail 
      : purchaseRequest.receiptEmail || purchaseRequest.notifyEmail;

    // Combine required recipient with user-specified email(s), avoiding duplicates
    const allRecipients = new Set([REQUIRED_RECIPIENT]);
    if (userEmail) {
      userEmail.split(",").forEach((email: string) => allRecipients.add(email.trim()));
    }
    const toEmail = Array.from(allRecipients).join(", ");

    // Build email content based on type
    let subject: string;
    let htmlContent: string;
    let attachments: { filename: string; content: string; encoding: string }[] = [];

    if (body.type === "checkout") {
      subject = `PCard Checkout Request: ${purchaseRequest.description.substring(0, 50)}`;
      htmlContent = buildCheckoutEmail(purchaseRequest);
    } else {
      subject = `PCard Receipt Submission: ${purchaseRequest.eventName || purchaseRequest.description.substring(0, 50)}`;
      htmlContent = buildReceiptEmail(purchaseRequest);
      
      // Add receipt image as attachment if present
      if (purchaseRequest.receiptImage) {
        attachments.push({
          filename: "receipt.png",
          content: purchaseRequest.receiptImage.replace(/^data:image\/\w+;base64,/, ""),
          encoding: "base64",
        });
      }

      // Add attendance image as attachment if present
      if (purchaseRequest.attendanceImage) {
        attachments.push({
          filename: "attendance.png",
          content: purchaseRequest.attendanceImage.replace(/^data:image\/\w+;base64,/, ""),
          encoding: "base64",
        });
      }
    }

    // Send the email via SMTP
    await sendEmail({
      to: toEmail,
      subject,
      html: htmlContent,
      attachments,
    });

    return Response.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("POST /api/purchasing/[id]/email error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(`Email error: ${errorMessage}`, { status: 500 });
  }
}

function buildCheckoutEmail(request: any): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">PCard Checkout Request</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Name:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${request.name}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Committee:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${request.committee}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Description:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${request.description}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Estimated Cost:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">$${parseFloat(request.estimatedCost).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Planned Date:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date(request.plannedDate).toLocaleDateString()}</td>
        </tr>
      </table>
      <p style="margin-top: 20px; color: #666; font-size: 12px;">
        Submitted on ${new Date(request.createdAt).toLocaleString()}
      </p>
    </div>
  `;
}

function buildReceiptEmail(request: any): string {
  let attendanceHtml = "";
  
  if (request.attendanceData) {
    try {
      const attendees = JSON.parse(request.attendanceData);
      if (Array.isArray(attendees) && attendees.length > 0) {
        attendanceHtml = `
          <h3 style="margin-top: 20px;">Attendance List</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">First Name</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Last Name</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Email</th>
            </tr>
            ${attendees.map((a: any) => `
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${a.firstName || ""}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${a.lastName || ""}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${a.email || ""}</td>
              </tr>
            `).join("")}
          </table>
          <p style="margin-top: 10px; color: #666;">Total Attendees: ${attendees.length}</p>
        `;
      }
    } catch (e) {
      console.error("Error parsing attendance data:", e);
    }
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">PCard Receipt Submission</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Name:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${request.name}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Committee:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${request.committee}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Description:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${request.description}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Actual Cost:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">$${request.actualCost ? parseFloat(request.actualCost).toFixed(2) : "N/A"}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Event Name:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${request.eventName || "N/A"}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Event Date:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${request.eventDate ? new Date(request.eventDate).toLocaleDateString() : "N/A"}</td>
        </tr>
      </table>
      ${attendanceHtml}
      <p style="margin-top: 20px; color: #666; font-size: 12px;">
        Receipt images are attached to this email.
      </p>
      <p style="margin-top: 10px; padding: 10px; background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 4px;">
        <strong>Reminder:</strong> Please save a copy of the receipt to the $$$RECEIPTS folder in SSE Drive!
      </p>
    </div>
  `;
}
