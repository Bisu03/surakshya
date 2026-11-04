import { NextResponse } from "next/server";
import { verifySmtp } from "@/lib/mail";
import { requirePermission } from "@/lib/serverAuth";

export async function GET() {
  const authorization = await requirePermission("users", "manage_permissions");
  if (authorization.response) return authorization.response;

  try {
    await verifySmtp();
    return NextResponse.json({ success: true, message: "SMTP connection verified" });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "SMTP verification failed", error: error.message },
      { status: 503 }
    );
  }
}
