import nodemailer from "nodemailer";

function smtpConfig() {
  const port = Number(process.env.SMTP_PORT || 587);
  const required = ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM_EMAIL"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`SMTP is not configured. Missing: ${missing.join(", ")}`);
  }

  return {
    host: process.env.SMTP_HOST,
    port,
    secure:
      process.env.SMTP_SECURE === "true" ||
      (process.env.SMTP_SECURE !== "false" && port === 465),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    // Fail fast instead of hanging for minutes when the SMTP port is blocked.
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
  };
}

export function createMailTransport() {
  return nodemailer.createTransport(smtpConfig());
}

export async function verifySmtp() {
  return createMailTransport().verify();
}

export async function sendMail({ to, subject, text, html }) {
  const transporter = createMailTransport();
  const fromName = process.env.SMTP_FROM_NAME || "Hospital Management System";
  return transporter.sendMail({
    from: `"${fromName}" <${process.env.SMTP_FROM_EMAIL}>`,
    to,
    subject,
    text,
    html,
  });
}
