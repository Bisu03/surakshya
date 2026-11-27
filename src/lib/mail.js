import nodemailer from "nodemailer";

// Trim and drop wrapping quotes — values pasted into a hosting panel often carry them.
function env(key) {
  const value = String(process.env[key] ?? "").trim();
  const quoted = value.length > 1 && /^(['"]).*\1$/.test(value);
  return quoted ? value.slice(1, -1) : value;
}

const REQUIRED = ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM_EMAIL"];

// What the server is actually using, for the admin email check. Never the password.
export function smtpSummary() {
  const port = Number(env("SMTP_PORT") || 587);
  return {
    host: env("SMTP_HOST"),
    port,
    secure: port === 465 || env("SMTP_SECURE").toLowerCase() === "true",
    user: env("SMTP_USER"),
    from: env("SMTP_FROM_EMAIL"),
    passwordSet: Boolean(env("SMTP_PASSWORD")),
    missing: REQUIRED.filter((key) => !env(key)),
  };
}

// Plain-language next step for the common SMTP failures.
export function smtpErrorHint(error) {
  const text = `${error?.code || ""} ${error?.responseCode || ""} ${error?.message || ""}`;
  if (/not configured/i.test(text)) return "Add the missing variables in Coolify → Environment Variables, then redeploy.";
  if (/EAUTH|\b535\b|\b534\b|authentication/i.test(text)) return "The mail server rejected the username or password. Check SMTP_USER and SMTP_PASSWORD.";
  if (/Greeting never received/i.test(text)) return "Connected but the mail server never replied. On port 587 leave SMTP_SECURE unset or false; if it persists, outgoing mail may be filtered by the hosting provider.";
  if (/ETIMEDOUT|timeout/i.test(text)) return "The server cannot reach the mail server on this port. The hosting provider may block outgoing mail; try SMTP_PORT=587 or ask them to unblock it.";
  if (/ENOTFOUND|EAI_AGAIN/i.test(text)) return "The SMTP_HOST name could not be found. Check its spelling.";
  if (/ECONNREFUSED/i.test(text)) return "The mail server refused the connection on this port. Check SMTP_PORT.";
  if (/wrong version number/i.test(text)) return "This port expects STARTTLS: leave SMTP_SECURE unset or false (or use port 465).";
  if (/certificate|self.signed|TLS|SSL/i.test(text)) return "TLS/certificate problem. Check SMTP_HOST matches the mail server's certificate name.";
  if (/\b55\d\b|rejected|relay/i.test(text)) return "The mail server refused the sender or recipient. Check SMTP_FROM_EMAIL is an address this account may send from.";
  return "";
}

function smtpConfig() {
  const port = Number(env("SMTP_PORT") || 587);
  const missing = REQUIRED.filter((key) => !env(key));

  if (missing.length > 0) {
    throw new Error(`SMTP is not configured. Missing: ${missing.join(", ")}`);
  }

  return {
    host: env("SMTP_HOST"),
    port,
    // Port 465 is implicit TLS only; a plain connection there just times out
    // ("Greeting never received"), so ignore SMTP_SECURE=false for it.
    secure: port === 465 || env("SMTP_SECURE").toLowerCase() === "true",
    auth: {
      user: env("SMTP_USER"),
      pass: env("SMTP_PASSWORD"),
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
  const fromName = env("SMTP_FROM_NAME") || "Hospital Management System";
  return transporter.sendMail({
    from: `"${fromName}" <${env("SMTP_FROM_EMAIL")}>`,
    to,
    subject,
    text,
    html,
  });
}
