import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { connectDB } from "@/lib/mongoConnection"; // MongoDB connection utility
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

import Labtest from "@/models/Labtest.models"; // Mongoose  model
import Billing from "@/models/Billing.models";
import Patient from "@/models/Patient.models";
import "@/models/Doctor.models";

export async function GET(req, context) {
  // Connect to the database
  await connectDB();
  try {
    const { slug } = await context.params;

    const pData = await Patient.findOne({
      reg_id: slug,
    }).sort({ createdAt: -1 });

    const labData = await Labtest.find({
      reg_id: slug,
    })
      .populate("consultant")
      .sort({ createdAt: -1 });

    const ipdData = await Billing.findOne({
      reg_id: slug,
    })
      .sort({ createdAt: -1 });

    // Return the message
    return NextResponse.json(
      { success: true, data: { pData, labData, ipdData } },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
