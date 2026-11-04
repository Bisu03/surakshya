import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoConnection'; // MongoDB connection utility
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import Doctor from '@/models/Doctor.models';

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
    const searchTerm = url.searchParams.get("drname")?.trim().toLowerCase() || "";
    const page = parseInt(url.searchParams.get("page")) || 1;
    const limit = parseInt(url.searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    let query = {};

    if (searchTerm) {
      query = {
        $expr: {
          $regexMatch: {
            input: { $toLower: "$drname" },
            regex: searchTerm,
          },
        },
      };
    }

    const [data, total] = await Promise.all([
      Doctor.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Doctor.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
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
        await Doctor.create(body);
        return NextResponse.json(
            { success: true, message: "Doctor Add Successfully" },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}
