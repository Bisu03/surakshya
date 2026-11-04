import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoConnection";
import { requirePermission } from "@/lib/serverAuth";
import Stock from "@/models/Stock.models";
import Medicine from "@/models/Medicine.models"; // side-effect import: required for .populate("medicine")
import { getDate } from "@/lib/currentDate";

function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export async function GET(req) {
  await connectDB();
  const authorization = await requirePermission("inventory", "view");
  if (authorization.response) return authorization.response;

  try {
    const url = new URL(req.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const type = url.searchParams.get("type"); // "IN" | "OUT" | ""
    const medicine = url.searchParams.get("medicine");
    const expiringWithinDays = url.searchParams.get("expiringWithinDays");

    const query = {};
    if (medicine) query.medicine = medicine;

    let sort = { date: -1, createdAt: -1 };

    if (expiringWithinDays) {
      const days = Number(expiringWithinDays) || 30;
      query.type = "IN";
      query.expiry_date = { $ne: null, $lte: addDays(getDate(), days) };
      sort = { expiry_date: 1 };
    } else {
      if (type === "IN" || type === "OUT") query.type = type;
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = startDate;
        if (endDate) query.date.$lte = endDate;
      }
    }

    const data = await Stock.find(query)
      .populate("medicine", "name unit_type")
      .sort(sort);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
