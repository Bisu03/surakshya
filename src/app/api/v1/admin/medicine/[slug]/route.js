import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongoConnection";
import { requirePermission } from "@/lib/serverAuth";

import Medicine from "@/models/Medicine.models";
import Stock from "@/models/Stock.models";

export async function PUT(req, context) {
  await connectDB();
  const authorization = await requirePermission("inventory", "edit");
  if (authorization.response) return authorization.response;

  try {
    const { slug } = await context.params;
    const body = await req.json();

    // current_stock is a ledger-derived balance, never client-supplied.
    const { current_stock, ...safeBody } = body;
    await Medicine.findByIdAndUpdate(slug, { ...safeBody });

    return NextResponse.json(
      { success: true, message: "Medicine Updated" },
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

export async function DELETE(req, context) {
  await connectDB();
  const authorization = await requirePermission("inventory", "delete");
  if (authorization.response) return authorization.response;

  try {
    const { slug } = await context.params;

    const hasHistory = await Stock.exists({ medicine: slug });
    if (hasHistory) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot delete a medicine with recorded stock history",
        },
        { status: 400 }
      );
    }

    await Medicine.findByIdAndDelete(slug);
    return NextResponse.json(
      { success: true, message: "Medicine Deleted" },
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
