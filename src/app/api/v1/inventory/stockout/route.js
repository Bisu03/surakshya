import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoConnection";
import { requirePermission } from "@/lib/serverAuth";
import Stock from "@/models/Stock.models";
import Medicine from "@/models/Medicine.models";
import { STOCK_OUT_REASONS } from "@/lib/inventoryConstants";

export async function POST(req) {
  await connectDB();
  const authorization = await requirePermission("inventory", "create");
  if (authorization.response) return authorization.response;

  let decrementedMedicineId;
  let decrementedQty;
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
    if (!STOCK_OUT_REASONS.includes(body.reason)) {
      return NextResponse.json(
        { success: false, message: "Invalid reason" },
        { status: 400 }
      );
    }

    // Atomic, race-safe guard: only decrements if current_stock >= quantity,
    // so two concurrent requests can never both succeed and oversubscribe stock.
    const updatedMedicine = await Medicine.findOneAndUpdate(
      { _id: medicineId, current_stock: { $gte: quantity } },
      { $inc: { current_stock: -quantity } },
      { new: true }
    );

    if (!updatedMedicine) {
      const existing = await Medicine.findById(medicineId);
      if (!existing) {
        return NextResponse.json(
          { success: false, message: "Medicine not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          message: `Insufficient stock: only ${existing.current_stock ?? 0} ${
            existing.unit_type || ""
          } in stock`.trim(),
        },
        { status: 400 }
      );
    }
    decrementedMedicineId = medicineId;
    decrementedQty = quantity;

    const stock = await Stock.create({
      medicine: medicineId,
      type: "OUT",
      quantity,
      date: body.date,
      reason: body.reason,
      reference: body.reference,
      remarks: body.remarks,
      recorded_by: authorization.session.user.username,
    });

    return NextResponse.json(
      { success: true, message: "Stock removed", data: stock },
      { status: 201 }
    );
  } catch (error) {
    if (decrementedMedicineId) {
      await Medicine.findByIdAndUpdate(decrementedMedicineId, {
        $inc: { current_stock: decrementedQty },
      });
    }
    return NextResponse.json(
      { success: false, message: "Unable to remove stock", error: error.message },
      { status: 500 }
    );
  }
}
