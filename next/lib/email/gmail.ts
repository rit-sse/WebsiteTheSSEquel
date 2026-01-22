import { SendEmailOptions } from "./index";

/**
 * Send an email using the Gmail API
 * 
 * This requires the user to have granted the gmail.send scope during OAuth
 * The accessToken is retrieved from the user's account record
 */
export async function sendEmailViaGmail(options: SendEmailOptions): Promise<void> {
  if (!options.accessToken) {
    throw new Error("Gmail API requires an access token");
  }

  const { to, subject, html, text, attachments, fromEmail, fromName, accessToken } = options;

  // Build the email in RFC 2822 format
  const boundary = `boundary_${Date.now()}`;
  const fromHeader = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
  
  let emailLines: string[] = [
    `From: ${fromHeader}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
  ];

  if (attachments && attachments.length > 0) {
    // Multipart message with attachments
    emailLines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    emailLines.push("");
    emailLines.push(`--${boundary}`);
    emailLines.push(`Content-Type: multipart/alternative; boundary="${boundary}_alt"`);
    emailLines.push("");
    
    // Text part
    if (text) {
      emailLines.push(`--${boundary}_alt`);
      emailLines.push(`Content-Type: text/plain; charset="UTF-8"`);
      emailLines.push("");
      emailLines.push(text);
    }
    
    // HTML part
    emailLines.push(`--${boundary}_alt`);
    emailLines.push(`Content-Type: text/html; charset="UTF-8"`);
    emailLines.push("");
    emailLines.push(html);
    emailLines.push(`--${boundary}_alt--`);

    // Attachments
    for (const attachment of attachments) {
      emailLines.push(`--${boundary}`);
      emailLines.push(`Content-Type: application/octet-stream; name="${attachment.filename}"`);
      emailLines.push(`Content-Disposition: attachment; filename="${attachment.filename}"`);
      emailLines.push(`Content-Transfer-Encoding: base64`);
      emailLines.push("");
      emailLines.push(attachment.content);
    }
    
    emailLines.push(`--${boundary}--`);
  } else {
    // Simple HTML message
    emailLines.push(`Content-Type: text/html; charset="UTF-8"`);
    emailLines.push("");
    emailLines.push(html);
  }

  const rawEmail = emailLines.join("\r\n");
  
  // Base64url encode the email (Gmail API requirement)
  const encodedEmail = Buffer.from(rawEmail)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  // Send via Gmail API
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      raw: encodedEmail,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gmail API error: ${response.status} - ${error}`);
  }
}
