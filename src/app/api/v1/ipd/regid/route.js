import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoConnection";
import { requirePermission } from "@/lib/serverAuth";
import { isRegIdTaken, parseRegId, peekNextRegId } from "@/lib/regId";

// GET /api/v1/ipd/regid?value=123
// Live check for the admission form: is a hand-typed REGID free, and which
// number would be used automatically if the field is left blank.
export async function GET(req) {
  await connectDB();
  const authorization = await requirePermission("ipd", "create");
  if (authorization.response) return authorization.response;

  try {
    const next = await peekNextRegId();
    const raw = new URL(req.url).searchParams.get("value");
    if (raw === null || raw.trim() === "") {
      return NextResponse.json({ success: true, next });
    }

    const regId = parseRegId(raw);
    if (regId === null) {
      return NextResponse.json({
        success: true,
        next,
        available: false,
        message: "IPD ID must be a positive whole number",
      });
    }

    const taken = await isRegIdTaken(regId);
    return NextResponse.json({
      success: true,
      next,
      value: regId,
      available: !taken,
      message: taken
        ? `IPD ID ${regId} is already used`
        : `IPD ID ${regId} is available`,
    });
  } catch (error) {
    console.error("REGID check failed:", error);
    return NextResponse.json(
      { success: false, message: "Unable to check IPD ID" },
      { status: 500 }
    );
  }
}
