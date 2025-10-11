import nodemailer from "nodemailer";
import { logger } from "../utils/logger";
import { ENV } from "../config/env";

const transporter = nodemailer.createTransport({
  host: ENV.SMTP_HOST,
  port: ENV.SMTP_PORT,
  secure: ENV.SMTP_TLS, // true if using 465
  auth: {
    user: ENV.SMTP_USER,
    pass: ENV.SMTP_PASS,
  },
});

export interface EmailAddress {
  name: string;
  email: string;
}

export interface Attachment {
  filename: string;
  path?: string; // file path on disk
  content?: Buffer | string; // inline file content
  contentType?: string; // optional MIME type
}

export interface MailOptions {
  from?: EmailAddress;
  to: EmailAddress | EmailAddress[];
  cc?: EmailAddress | EmailAddress[];
  bcc?: EmailAddress | EmailAddress[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Attachment[];
}

const formatAddress = (addr: EmailAddress) => `${addr.name} <${addr.email}>`;

const formatAddresses = (addr?: EmailAddress | EmailAddress[]) => {
  if (!addr) return undefined;
  return Array.isArray(addr)
    ? addr.map(formatAddress).join(", ")
    : formatAddress(addr);
};

export const sendEmail = async (options: MailOptions) => {
  try {
    const info = await transporter.sendMail({
      from: options.from
        ? formatAddress(options.from)
        : formatAddress({ name: ENV.MAIL_FROM_NAME, email: ENV.MAIL_FROM }),
      to: formatAddresses(options.to),
      cc: formatAddresses(options.cc),
      bcc: formatAddresses(options.bcc),
      subject: options.subject,
      text: options.text || "",
      html: options.html,
      attachments: options.attachments,
      priority: "normal",
    });

    logger.info(`📧 Email sent: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error("❌ Error sending email", err);
    throw err;
  }
};
