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
}

/**
 * Send an email via SMTP
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  return sendEmailViaSMTP(options);
}

/**
 * Check if SMTP is properly configured
 */
export function isSmtpConfigured(): boolean {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

/**
 * Check if the email service is properly configured
 */
export function isEmailConfigured(): boolean {
  return isSmtpConfigured();
}
