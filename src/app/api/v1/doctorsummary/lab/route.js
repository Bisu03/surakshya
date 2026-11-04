// app/api/v1/doctorsummary/lab/route.js

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoConnection";
import Lab from "@/models/Labtest.models";
import Patient from "@/models/Patient.models";
import Doctor from "@/models/Doctor.models";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const drname = searchParams.get("drname");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!drname || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: "Missing required parameters" },
        { status: 400 }
      );
    }

    const pipeline = [
      {
        $match: {
          reporting_date: { $gte: startDate, $lte: endDate },
          $or: [
            { "pathology_test_cart.services": { $ne: [] } },
            { "radiology_test_cart.services": { $ne: [] } },
          ],
        },
      },
      {
        $lookup: {
          from: Patient.collection.name,  // Use correct collection name (e.g., "patients")
          localField: "patient",
          foreignField: "_id",
          as: "patientInfo",
        },
      },
      { $unwind: { path: "$patientInfo", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "doctors",
          localField: "consultant",
          foreignField: "_id",
          as: "consultantInfo",
        },
      },
      { $unwind: { path: "$consultantInfo", preserveNullAndEmptyArrays: true } },

      { $match: { "consultantInfo.drname": drname } },

      {
        $project: {
          _id: 1,
          fullname: { 
            $cond: {
              if: { $ifNull: ["$patientInfo.fullname", false] },
              then: "$patientInfo.fullname",
              else: { $concat: ["$patientInfo.first_name", " ", "$patientInfo.last_name"] }  // Fallback to first + last name
            }
          },
          mrdId: { $ifNull: ["$mrd_id", "-"] },
          reportingDate: "$reporting_date",

          pathologyTests: {
            $map: {
              input: { $ifNull: ["$pathology_test_cart.services", []] },
              as: "t",
              in: {
                testName: "$$t.pathology_category",
                charge: { $toDouble: "$$t.pathology_charge" },
              },
            },
          },
          radiologyTests: {
            $map: {
              input: { $ifNull: ["$radiology_test_cart.services", []] },
              as: "t",
              in: {
                testName: "$$t.test_name",
                charge: { $toDouble: "$$t.test_charge" },
              },
            },
          },

          totalAmount: { $toDouble: { $ifNull: ["$amount.total", 0] } },
          discount: { $toDouble: { $ifNull: ["$amount.discount", 0] } },
          totalPaid: { $toDouble: { $ifNull: ["$total_paid", 0] } },
          due: { $toDouble: { $ifNull: ["$due", 0] } },

          doctor_commission: {
            amount: {
              $round: [
                {
                  $multiply: [
                    { $toDouble: { $ifNull: ["$total_paid", 0] } },
                    {
                      $divide: [
                        { $toDouble: { $ifNull: ["$consultantInfo.comission", 0] } },
                        100,
                      ],
                    },
                  ],
                },
                2,
              ],
            },
            is_paid: { $ifNull: ["$doctor_commission.is_paid", false] },
            remarks: { $ifNull: ["$doctor_commission.remarks", ""] },
          },
        },
      },
      { $sort: { reportingDate: -1 } },
    ];

    const result = await Lab.aggregate(pipeline);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("GET Lab Summary Error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    await connectDB();

    const { ids, is_paid, remarks } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: "Invalid or missing ids" },
        { status: 400 }
      );
    }

    // Get records to calculate commission
    const records = await Lab.find({ _id: { $in: ids } })
      .populate("consultant", "comission")
      .select("total_paid doctor_commission consultant");

    const bulkOps = records.map((doc) => {
      const totalPaid = Number(doc.total_paid) || 0;
      const commissionRate = Number(doc.consultant?.comission) || 0;
      const commissionAmount = Number((totalPaid * commissionRate / 100).toFixed(2));

      const updateData = {
        "doctor_commission.amount": commissionAmount,
      };

      // Only update is_paid if explicitly provided
      if (is_paid !== undefined) {
        updateData["doctor_commission.is_paid"] = is_paid;
      }

      // Always update remarks if provided (even if empty string)
      if (remarks !== undefined) {
        updateData["doctor_commission.remarks"] = remarks;
      }

      return {
        updateOne: {
          filter: { _id: doc._id },
          update: {
            $set: updateData,
          },
        },
      };
    });

    const result = await Lab.bulkWrite(bulkOps);

    return NextResponse.json({
      success: true,
      message: `Updated ${result.modifiedCount} record(s)`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("PUT Lab Commission Error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}