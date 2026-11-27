import { NextResponse } from "next/server";
import { sendMail, smtpErrorHint, smtpSummary, verifySmtp } from "@/lib/mail";
import { requirePermission } from "@/lib/serverAuth";

// Admin email check: shows the SMTP settings this server is really using (never
// the password) and the exact failure, so mail problems on the deployed server
// can be diagnosed from the browser.

const failure = (message, error) =>
  NextResponse.json(
    {
      success: false,
      message,
      error: error.message,
      code: error.code || error.responseCode || "",
      hint: smtpErrorHint(error),
      config: smtpSummary(),
    },
    { status: 503 }
  );

// GET: log in to the mail server without sending anything.
export async function GET() {
  const authorization = await requirePermission("users", "manage_permissions");
  if (authorization.response) return authorization.response;

  try {
    await verifySmtp();
    return NextResponse.json({
      success: true,
      message: "Connected and logged in to the mail server",
      config: smtpSummary(),
    });
  } catch (error) {
    console.error("SMTP verification failed:", error);
    return failure("Could not connect to the mail server", error);
  }
}

// POST: send a real test email to the signed-in admin's own address.
export async function POST() {
  const authorization = await requirePermission("users", "manage_permissions");
  if (authorization.response) return authorization.response;

  const to = authorization.session.user.email;
  if (!to) {
    return NextResponse.json(
      { success: false, message: "Your account has no email address to send the test to" },
      { status: 400 }
    );
  }

  try {
    const info = await sendMail({
      to,
      subject: "Hospital Management System test email",
      text: "This is a test email. If you received it, email sending (password reset, new-user credentials) is working.",
      html: "<p>This is a test email.</p><p>If you received it, email sending (password reset, new-user credentials) is working.</p>",
    });
    return NextResponse.json({
      success: true,
      message: `Test email sent to ${to}. Check the inbox and the Spam folder.`,
      response: info.response,
      config: smtpSummary(),
    });
  } catch (error) {
    console.error("SMTP test email failed:", error);
    return failure(`Could not send the test email to ${to}`, error);
  }
}
