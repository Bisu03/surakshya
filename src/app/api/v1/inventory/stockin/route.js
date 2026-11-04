import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoConnection";
import { requirePermission } from "@/lib/serverAuth";
import Stock from "@/models/Stock.models";
import Medicine from "@/models/Medicine.models";
import { STOCK_IN_REASONS } from "@/lib/inventoryConstants";

export async function POST(req) {
  await connectDB();
  const authorization = await requirePermission("inventory", "create");
  if (authorization.response) return authorization.response;

  let createdStockId;
  try {
    const body = await req.json();
    const medicineId = body.medicine;
    const quantity = Number(body.quantity);

    if (!medicineId) {
      return NextResponse.json(
        { success: false, message: "Medicine is required" },
        { status: 400 }
      );
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json(
        { success: false, message: "Quantity must be a positive number" },
        { status: 400 }
      );
    }
    if (!body.date) {
      return NextResponse.json(
        { success: false, message: "Date is required" },
        { status: 400 }
      );
    }
    if (!STOCK_IN_REASONS.includes(body.reason)) {
      return NextResponse.json(
        { success: false, message: "Invalid reason" },
        { status: 400 }
      );
    }

    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return NextResponse.json(
        { success: false, message: "Medicine not found" },
        { status: 404 }
      );
    }

    const stock = await Stock.create({
      medicine: medicine._id,
      type: "IN",
      quantity,
      date: body.date,
      reason: body.reason,
      reference: body.reference,
      unit_cost: body.unit_cost ? Number(body.unit_cost) : undefined,
      expiry_date: body.expiry_date || undefined,
      remarks: body.remarks,
      recorded_by: authorization.session.user.username,
    });
    createdStockId = stock._id;

    const updated = await Medicine.findByIdAndUpdate(
      medicine._id,
      { $inc: { current_stock: quantity } },
      { new: true }
    );
    if (!updated) {
      throw new Error("Failed to update medicine stock balance");
    }

    return NextResponse.json(
      { success: true, message: "Stock added", data: stock },
      { status: 201 }
    );
  } catch (error) {
    if (createdStockId) {
      await Stock.findByIdAndDelete(createdStockId);
    }
    return NextResponse.json(
      { success: false, message: "Unable to add stock", error: error.message },
      { status: 500 }
    );
  }
}
