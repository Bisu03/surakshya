import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongoConnection";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import Labtest from "@/models/Labtest.models";

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

    // Validate date parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: "Both startDate and endDate are required" },
        { status: 400 }
      );
    }

    const pipeline = [
      // Only match records that have at least one payment in the date range
      {
        $match: {
          payments: { $exists: true, $ne: [] },
          $expr: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: "$payments",
                    as: "p",
                    cond: {
                      $and: [
                        { $gte: ["$$p.date", startDate] },
                        { $lte: ["$$p.date", endDate] }
                      ]
                    }
                  }
                }
              },
              0
            ]
          }
        }
      },
      // Lookup patient and consultant
      {
        $lookup: {
          from: "patient_registrations",
          localField: "patient",
          foreignField: "_id",
          as: "patient",
        },
      },
      { $unwind: "$patient" },
      {
        $lookup: {
          from: "doctors",
          localField: "consultant",
          foreignField: "_id",
          as: "consultant"
        }
      },
      { $unwind: { path: "$consultant", preserveNullAndEmptyArrays: true } },
      // Add a field for payments in the date range, but keep all payments too
      {
        $addFields: {
          payments_in_range: {
            $filter: {
              input: "$payments",
              as: "p",
              cond: {
                $and: [
                  { $gte: ["$$p.date", startDate] },
                  { $lte: ["$$p.date", endDate] }
                ]
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          mrd_id: 1,
          bill_no: 1,
          patient: { fullname: "$patient.fullname" },
          consultant: { drname: "$consultant.drname" },
          reporting_date: 1,
          amount: 1,
          due: { $ifNull: ["$amount.due", 0] },
          total_paid: { $ifNull: ["$total_paid", 0] },
          payments: {
            $map: {
              input: "$payments",
              as: "p",
              in: {
                amount: "$$p.amount",
                mode: "$$p.mode",
                date: "$$p.date",
                remark: "$$p.remark"
              }
            }
          },
          payments_in_range: {
            $map: {
              input: "$payments_in_range",
              as: "p",
              in: {
                amount: "$$p.amount",
                mode: "$$p.mode",
                date: "$$p.date",
                remark: "$$p.remark"
              }
            }
          }
        }
      }
    ];

    const result = await Labtest.aggregate(pipeline);
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}