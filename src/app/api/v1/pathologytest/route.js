import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoConnection";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import PathologyTest from "@/models/PathologyTest.models";

export async function GET(req) {
  await connectDB();
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") || "10", 10)));
    const search = url.searchParams.get("search") || "";

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: new RegExp(search, "i") } },
      ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      PathologyTest.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1, _id: -1 }) // Stable sorting
        .lean(),
      PathologyTest.countDocuments(query),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: data || [],
        total: total || 0,
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
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();

    // Validate and create the new lab test
    const newTest = await PathologyTest.create({
      name: body.name,
      department: body.department,
      sampleType: body.sampleType,
      suffix: body.suffix,
      instrument: body.instrument,
      comment: body.comment,
      type: body.type,
      assessment: body.assessment,
      reporting_details: body.reporting_details || [],
      testItems: body.testItems || [], // Use testItems instead of parameters and subTests
    });

    return NextResponse.json(
      { success: true, message: "Test Added", data: newTest },
      { status: 201 }
    );
  } catch (error) {
    console.log(error);

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