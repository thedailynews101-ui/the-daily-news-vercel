import nodemailer, { Transporter } from "nodemailer";

import config from "../config";

let transporter: Transporter | null = null;

const getTransporter = (): Transporter | null => {
  if (!config.mail.isConfigured) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.port === 465,
      auth: {
        user: config.mail.user,
        pass: config.mail.pass,
      },
    });
  }

  return transporter;
};

type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/**
 * Sends an email via the configured SMTP transport. When SMTP env vars are
 * not set (typical in local development), logs the content to the console
 * instead of throwing, so auth flows remain usable without a mail provider.
 */
const sendMail = async ({ to, subject, html, text }: SendMailInput): Promise<void> => {
  const activeTransporter = getTransporter();

  if (!activeTransporter) {
    console.log(
      `\n--- [DEV MAIL] SMTP not configured, logging email instead ---\nTo: ${to}\nSubject: ${subject}\n\n${text}\n--- [END DEV MAIL] ---\n`
    );
    return;
  }

  await activeTransporter.sendMail({
    from: config.mail.from,
    to,
    subject,
    html,
    text,
  });
};

export const sendVerificationEmail = async (to: string, rawToken: string): Promise<void> => {
  const verifyUrl = `${config.clientUrl}/verify-email?token=${rawToken}`;

  await sendMail({
    to,
    subject: "Verify your email - The Daily News",
    text: `Welcome to The Daily News! Verify your email using the link below (expires in 24 hours):\n\n${verifyUrl}\n\nIf you did not create this account, you can ignore this email.`,
    html: `
      <p>Welcome to The Daily News!</p>
      <p>Please verify your email address by clicking the link below (expires in 24 hours):</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>If you did not create this account, you can ignore this email.</p>
    `,
  });
};

export const sendPasswordResetEmail = async (to: string, rawToken: string): Promise<void> => {
  const resetUrl = `${config.clientUrl}/reset-password?token=${rawToken}`;

  await sendMail({
    to,
    subject: "Reset your password - The Daily News",
    text: `We received a request to reset your password. Use the link below (expires in 1 hour):\n\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.`,
    html: `
      <p>We received a request to reset your password.</p>
      <p>Click the link below to choose a new password (expires in 1 hour):</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
    `,
  });
};
