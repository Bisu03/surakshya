import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongoConnection";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import Expense from "@/models/Expenses.models";
import ExpenseCategory from "@/models/ExpenseCategory.models";

export async function GET(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: "Both startDate and endDate are required" },
        { status: 400 }
      );
    }

    const match = { date: { $gte: startDate, $lte: endDate } };

    const [rows, grouped, categories] = await Promise.all([
      Expense.find(match).populate("categoryID").sort({ date: -1 }).lean(),
      Expense.aggregate([
        { $match: match },
        {
          $addFields: {
            expenseAmount: {
              $convert: { input: "$expense", to: "double", onError: 0 },
            },
          },
        },
        {
          $group: {
            _id: "$categoryID",
            total: { $sum: "$expenseAmount" },
            count: { $sum: 1 },
          },
        },
      ]),
      ExpenseCategory.find({}).lean(),
    ]);

    const nameById = new Map(
      categories.map((category) => [String(category._id), category.name])
    );
    const categoryBreakdown = grouped
      .map((group) => ({
        categoryId: group._id,
        name: nameById.get(String(group._id)) || "Uncategorized",
        total: group.total,
        count: group.count,
      }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({
      success: true,
      data: rows,
      categoryBreakdown,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
