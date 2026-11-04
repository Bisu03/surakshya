import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoConnection";
import { requirePermission } from "@/lib/serverAuth";
import MedicineCategory from "@/models/MedicineCategory.models";

export async function GET() {
  await connectDB();
  const authorization = await requirePermission("inventory", "view");
  if (authorization.response) return authorization.response;

  try {
    const data = await MedicineCategory.find({}).sort({ name: 1 });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  await connectDB();
  const authorization = await requirePermission("inventory", "create");
  if (authorization.response) return authorization.response;

  try {
    const body = await req.json();
    if (!body?.name?.trim()) {
      return NextResponse.json(
        { success: false, message: "Category name is required" },
        { status: 400 }
      );
    }
    const data = await MedicineCategory.create({ name: body.name.trim() });
    return NextResponse.json(
      { success: true, message: "Category created successfully", data },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
