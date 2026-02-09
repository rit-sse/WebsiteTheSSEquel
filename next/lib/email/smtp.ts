import nodemailer from "nodemailer";
import { SendEmailOptions } from "./index";

/**
 * Send an email using SMTP via nodemailer
 * 
 * Required environment variables:
 * - SMTP_HOST: SMTP server hostname
 * - SMTP_PORT: SMTP server port (optional, defaults to 587)
 * - SMTP_USER: SMTP username
 * - SMTP_PASS: SMTP password
 * - SMTP_FROM: Default from address (optional, can be overridden)
 */
export async function sendEmailViaSMTP(options: SendEmailOptions): Promise<void> {
  const { to, subject, html, text, attachments } = options;

  // Validate SMTP configuration
  if (!process.env.SMTP_HOST) {
    throw new Error("SMTP_HOST environment variable is not set");
  }
  if (!process.env.SMTP_USER) {
    throw new Error("SMTP_USER environment variable is not set");
  }
  if (!process.env.SMTP_PASS) {
    throw new Error("SMTP_PASS environment variable is not set");
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Always send from no-reply
  const from = '"Society of Software Engineers" <no-reply@sse.rit.edu>';

  // Build attachments for nodemailer format
  const nodemailerAttachments = attachments?.map((attachment) => ({
    filename: attachment.filename,
    content: attachment.content,
    encoding: attachment.encoding as BufferEncoding || "base64",
  }));

  // Send email
  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text: text || undefined,
    html,
    attachments: nodemailerAttachments,
  });

  console.log("Email sent via SMTP:", info.messageId);
}
