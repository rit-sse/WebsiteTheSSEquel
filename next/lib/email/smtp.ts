import nodemailer from "nodemailer";
import sanitizeHtml from "sanitize-html";
import { SendEmailOptions } from "./index";

const SAFE_STYLE_VALUE = /^(?!.*(?:url|expression)\s*\()[#%(),./:\-\w\s]+$/i;
const EMAIL_STYLE_PROPERTIES = [
  "background",
  "background-color",
  "border",
  "border-bottom",
  "border-left",
  "border-right",
  "border-top",
  "border-radius",
  "color",
  "display",
  "font-family",
  "font-size",
  "font-weight",
  "height",
  "line-height",
  "margin",
  "margin-bottom",
  "margin-left",
  "margin-right",
  "margin-top",
  "max-width",
  "opacity",
  "padding",
  "padding-bottom",
  "padding-left",
  "padding-right",
  "padding-top",
  "text-align",
  "text-decoration",
  "width",
];

const emailAllowedStyles = EMAIL_STYLE_PROPERTIES.reduce<
  Record<string, RegExp[]>
>((styles, property) => {
  styles[property] = [SAFE_STYLE_VALUE];
  return styles;
}, {});

function sanitizeEmailHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "div",
      "h1",
      "h2",
      "h3",
      "hr",
      "img",
      "span",
      "table",
      "tbody",
      "td",
      "th",
      "thead",
      "tr",
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      "*": ["style"],
      a: ["href", "name", "rel", "style", "target"],
      img: ["alt", "height", "src", "style", "width"],
      table: ["border", "cellpadding", "cellspacing", "style"],
      td: ["colspan", "rowspan", "style"],
      th: ["colspan", "rowspan", "style"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
    },
    allowedStyles: {
      "*": emailAllowedStyles,
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform(
        "a",
        { rel: "noopener noreferrer" },
        true
      ),
    },
  });
}

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
export async function sendEmailViaSMTP(
  options: SendEmailOptions
): Promise<void> {
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
    encoding: (attachment.encoding as BufferEncoding) || "base64",
  }));
  const sanitizedHtml = sanitizeEmailHtml(html);

  // Send email
  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text: text || undefined,
    html: sanitizedHtml,
    attachments: nodemailerAttachments,
  });

  console.log("Email sent via SMTP:", info.messageId);
}
