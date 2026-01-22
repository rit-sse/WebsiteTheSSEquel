import { sendEmailViaGmail } from "./gmail";
import { sendEmailViaSMTP } from "./smtp";

export interface EmailAttachment {
  filename: string;
  content: string;
  encoding?: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  fromEmail?: string;
  fromName?: string;
  accessToken?: string; // For Gmail API
}

export type EmailProvider = "gmail" | "smtp";

/**
 * Get the configured email provider from environment variables
 * Defaults to "smtp" if not specified
 */
export function getEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER?.toLowerCase();
  if (provider === "gmail") {
    return "gmail";
  }
  return "smtp";
}

/**
 * Send an email using the configured provider
 * 
 * If EMAIL_PROVIDER=gmail, sends via Gmail API (requires accessToken)
 * If EMAIL_PROVIDER=smtp (default), sends via SMTP using nodemailer
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const provider = getEmailProvider();

  if (provider === "gmail" && options.accessToken) {
    return sendEmailViaGmail(options);
  }

  // Default to SMTP if Gmail is not configured or no access token
  return sendEmailViaSMTP(options);
}

/**
 * Check if the email service is properly configured
 */
export function isEmailConfigured(): boolean {
  const provider = getEmailProvider();

  if (provider === "gmail") {
    // Gmail API requires OAuth to be set up (handled at auth time)
    return true;
  }

  // SMTP requires host and credentials
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}
