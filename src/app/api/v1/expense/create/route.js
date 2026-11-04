import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongoConnection";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

import Expense from "@/models/Expenses.models";

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
    const startDate = url.searchParams.get("start");
    const endDate = url.searchParams.get("end");

    const query = {};

    // Only add date filter if both are provided and valid
    if (startDate && endDate) {
      const start = startDate;
      const end = endDate

      if (start && end) {
        query.date = {
          $gte: start,
          $lte: end,
        };
      }
    }

    const data = await Expense.find(query).populate("categoryID");

    return NextResponse.json({ success: true, data }, { status: 200 });
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
  // Connect to the database
  await connectDB();

  // Get the current session from next-auth
  const session = await getServerSession(authOptions);

  if (session) {
    try {
      const body = await req.json();
      // insert data into data base
      await Expense.create({ ...body });

      // Return the message
      return NextResponse.json(
        { success: true, message: "Expense Added" },
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
  } else {
    // Unauthorized response if no session is found
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }
}

export async function PUT(req) {
  // Connect to the database
  await connectDB();

  // Get the current session from next-auth
  const session = await getServerSession(authOptions);

  if (session) {
    try {
      const body = await req.json();

      // insert data into data base
      await Expense.findByIdAndUpdate(body._id, body);

      // Return the message
      return NextResponse.json(
        { success: true, message: "Expense Updated" },
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
  } else {
    // Unauthorized response if no session is found
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }
}
export async function DELETE(req) {
  // Connect to the database
  await connectDB();

  // Get the current session from next-auth
  const session = await getServerSession(authOptions);

  if (session) {
    try {
      const url = new URL(req.url);
      const id = url.searchParams.get("id") || "";
      console.log(id);

      // insert data into data base
      await Expense.findByIdAndDelete(id);

      // Return the message
      return NextResponse.json(
        { success: true, message: "Expense Deleted" },
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
  } else {
    // Unauthorized response if no session is found
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }
}
