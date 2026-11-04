import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongoConnection";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import Billing from "@/models/Billing.models";
import Labtest from "@/models/Labtest.models";
import Opd from "@/models/Opd.models";
import Ipd from "@/models/Ipd.models";
import Expense from "@/models/Expenses.models";
import Stock from "@/models/Stock.models";
import Medicine from "@/models/Medicine.models";

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

    // Parallel database queries
    const [billingSummary, labSummary, opdSummary, ipdSummary, expenseSummary, stockSummary, outOfStockCount] = await Promise.all([
      // Billing Summary
      Billing.aggregate([
        {
          $match: {
            billing_date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            dischargedCount: { $sum: { $cond: ["$isDone", 1, 0] } },
            totalNet: { $sum: { $ifNull: ["$amount.netTotal", 0] } },
            totalDue: { $sum: { $ifNull: ["$amount.due", 0] } }
          }
        }
      ]),

      // Lab Summary (calculate totalPaid and totalDue from payments array, due clamped at 0 per document)
      Labtest.aggregate([
        {
          $match: {
            reporting_date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $addFields: {
            totalPaid: {
              $sum: {
                $map: {
                  input: { $ifNull: ["$payments", []] },
                  as: "p",
                  in: { $ifNull: ["$$p.amount", 0] }
                }
              }
            },
            netTotal: { $ifNull: ["$amount.netTotal", 0] }
          }
        },
        {
          $addFields: {
            dueClamped: { $max: [{ $subtract: ["$netTotal", "$totalPaid"] }, 0] }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalNet: { $sum: "$netTotal" },
            totalPaid: { $sum: "$totalPaid" },
            totalDue: { $sum: "$dueClamped" }
          }
        }
      ]),

      // OPD Summary (opd_fees is stored as String, must convert before summing)
      Opd.aggregate([
        {
          $match: {
            consultant_date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalFees: { $sum: { $convert: { input: "$opd_fees", to: "double", onError: 0 } } }
          }
        }
      ]),

      // IPD Summary (corrected admission charge handling)
      Ipd.aggregate([
        {
          $match: {
            admit_date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalAdmissionFees: {
              $sum: {
                $convert: {
                  input: "$admission_charge",
                  to: "double",
                  onError: 0
                }
              }
            }
          }
        }
      ]),

      // Expense Summary (expense is stored as String, must convert before summing)
      Expense.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalExpense: { $sum: { $convert: { input: "$expense", to: "double", onError: 0 } } }
          }
        }
      ]),

      // Stock Summary (quantity is a real Number on this model, no $convert needed)
      Stock.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: "$type",
            totalQuantity: { $sum: "$quantity" }
          }
        }
      ]),

      // Live count, not date-scoped: medicines currently at zero (or below) stock
      Medicine.countDocuments({ current_stock: { $lte: 0 } })
    ]);

    const stockIn = stockSummary.find((s) => s._id === "IN");
    const stockOut = stockSummary.find((s) => s._id === "OUT");

    const response = {
      billing: {
        count: billingSummary[0]?.count || 0,
        dischargedCount: billingSummary[0]?.dischargedCount || 0,
        totalNet: billingSummary[0]?.totalNet || 0,
        totalDue: billingSummary[0]?.totalDue || 0
      },
      lab: {
        count: labSummary[0]?.count || 0,
        totalNet: labSummary[0]?.totalNet || 0,
        totalPaid: labSummary[0]?.totalPaid || 0,
        totalDue: labSummary[0]?.totalDue || 0
      },
      opd: {
        count: opdSummary[0]?.count || 0,
        totalFees: opdSummary[0]?.totalFees || 0
      },
      ipd: {
        count: ipdSummary[0]?.count || 0,
        totalAdmissionFees: ipdSummary[0]?.totalAdmissionFees || 0
      },
      expense: {
        count: expenseSummary[0]?.count || 0,
        totalExpense: expenseSummary[0]?.totalExpense || 0
      },
      stock: {
        stockInQty: stockIn?.totalQuantity || 0,
        stockOutQty: stockOut?.totalQuantity || 0,
        outOfStockMedicineCount: outOfStockCount || 0
      }
    };

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}