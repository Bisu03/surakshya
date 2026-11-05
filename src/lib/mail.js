import nodemailer from "nodemailer";

// Trim and drop wrapping quotes — values pasted into a hosting panel often carry them.
function env(key) {
  const value = String(process.env[key] ?? "").trim();
  const quoted = value.length > 1 && /^(['"]).*\1$/.test(value);
  return quoted ? value.slice(1, -1) : value;
}

function smtpConfig() {
  const port = Number(env("SMTP_PORT") || 587);
  const required = ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM_EMAIL"];
  const missing = required.filter((key) => !env(key));

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
