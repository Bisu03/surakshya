import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongoConnection";
import { requirePermission } from "@/lib/serverAuth";

import Medicine from "@/models/Medicine.models";
import "@/models/MedicineCategory.models";

export async function GET(req) {
  await connectDB();
  const authorization = await requirePermission("inventory", "view");
  if (authorization.response) return authorization.response;

  try {
    const url = new URL(req.url);
    const name = url.searchParams.get("name") || "";
    const page = parseInt(url.searchParams.get("page")) || 1;
    const limit = parseInt(url.searchParams.get("limit")) || 10;

    const searchQuery = name ? { name: { $regex: name, $options: "i" } } : {};

    const [data, total] = await Promise.all([
      Medicine.find(searchQuery)
        .populate("category", "name")
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Medicine.countDocuments(searchQuery),
    ]);

    return NextResponse.json(
      {
        success: true,
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        error: error.message,
      },
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
        { success: false, message: "Medicine name is required" },
        { status: 400 }
      );
    }

    // current_stock is a ledger-derived balance, never client-supplied.
    const { current_stock, ...safeBody } = body;
    const data = await Medicine.create({ ...safeBody, current_stock: 0 });

    return NextResponse.json(
      { success: true, message: "Medicine Added", data },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
