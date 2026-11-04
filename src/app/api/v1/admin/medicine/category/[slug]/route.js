import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoConnection";
import { requirePermission } from "@/lib/serverAuth";
import MedicineCategory from "@/models/MedicineCategory.models";
import Medicine from "@/models/Medicine.models";

export async function PUT(req, context) {
  await connectDB();
  const authorization = await requirePermission("inventory", "edit");
  if (authorization.response) return authorization.response;

  try {
    const { slug } = await context.params;
    const body = await req.json();
    if (!body?.name?.trim()) {
      return NextResponse.json(
        { success: false, message: "Category name is required" },
        { status: 400 }
      );
    }
    const updated = await MedicineCategory.findByIdAndUpdate(slug, {
      name: body.name.trim(),
    });
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      message: "Category updated successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req, context) {
  await connectDB();
  const authorization = await requirePermission("inventory", "delete");
  if (authorization.response) return authorization.response;

  try {
    const { slug } = await context.params;
    const inUse = await Medicine.exists({ category: slug });
    if (inUse) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot delete a category that is assigned to one or more medicines",
        },
        { status: 400 }
      );
    }
    const deleted = await MedicineCategory.findByIdAndDelete(slug);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
