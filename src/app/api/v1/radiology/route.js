// app/api/pathology/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongoConnection";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import Pathology from "@/models/Labtest.models";
import Patient from "@/models/Patient.models";
import { reserveSequence, releaseSequence } from "@/lib/sequence";

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
    const searchParams = {
      id: url.searchParams.get("id"),
      search: url.searchParams.get("search"),
      page: parseInt(url.searchParams.get("page")) || 1,
      limit: parseInt(url.searchParams.get("limit")) || 10,
    };

    if (searchParams.id) {
      const data = await Pathology.findById(searchParams.id)
        .populate("patient")
        .populate("consultant")
        .sort({ createdAt: -1 })
        .exec();
      return NextResponse.json({ success: true, data });
    }
    const pipeline = [
      {
        $lookup: {
          from: "patient_registrations",
          localField: "patient",
          foreignField: "_id",
          as: "patient",
        },
      },
      { $unwind: "$patient" },
      ...(searchParams.search
        ? [
          {
            $match: {
              $or: [
                {
                  "patient.fullname": {
                    $regex: searchParams.search,
                    $options: "i",
                  },
                },
                { bill_no: { $regex: searchParams.search, $options: "i" } },
                { mrd_id: { $regex: searchParams.search, $options: "i" } },
              ],
            },
          },
        ]
        : []),
      { $sort: { createdAt: -1 } },
      { $skip: (searchParams.page - 1) * searchParams.limit },
      { $limit: searchParams.limit },
      {
        $facet: {
          data: [],
          totalCount: [{ $count: "total" }],
        },
      },
    ];

    const result = await Pathology.aggregate(pipeline);
    const data = result[0]?.data || [];
    const total = result[0]?.totalCount?.[0]?.total || 0;

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        currentPage: searchParams.page,
        totalPages: Math.ceil(total / searchParams.limit),
        totalItems: total,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  let reservedBillNo;
  let reservedMrdId;
  let createdPatientId;
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      mrd_id,
      fullname,
      phone_number,
      referr_by,
      gender,
      patient,
      dob,
      age,
      consultant,
      address,
      paydby,
      amount,
      reporting_time,
      reporting_date,
      test_cart,
      admited_by
    } = body;

    let newPathology;

    reservedBillNo = await reserveSequence("pathologybill");
    if (!body.mrd_id) {
      reservedMrdId = await reserveSequence("mrdid");
    }


    if (body?.mrd_id) {
      newPathology = await Pathology.create({
        bill_no: reservedBillNo,
        mrd_id,
        paydby,
        amount,
        patient,
        consultant,
        reporting_time,
        reporting_date,
        test_cart,
        admited_by
      });
    } else {

      const data = await Patient.create({
        fullname,
        phone_number,
        referr_by,
        gender,
        patient,
        dob,
        age,
        address,
        mrd_id: reservedMrdId,
      });
      createdPatientId = data?._id;

      newPathology = await Pathology.create({
        bill_no: reservedBillNo,
        mrd_id: reservedMrdId,
        paydby,
        patient: data._id,
        amount,
        consultant,
        reporting_time,
        reporting_date,
        test_cart,
        admited_by
      });
    }

    return NextResponse.json({
      success: true,
      message: "Pathology record created",
      data: newPathology,
    });
  } catch (error) {
    // Reclaim reserved numbers and remove any orphaned patient on failure.
    if (createdPatientId) await Patient.findByIdAndDelete(createdPatientId);
    await releaseSequence("mrdid", reservedMrdId);
    await releaseSequence("pathologybill", reservedBillNo);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const recordId = searchParams.get("id");
    const body = await req.json();

    const updatedRecord = await Pathology.findByIdAndUpdate(recordId, body, {
      new: true,
    }).populate("patient");

    if (!updatedRecord) {
      return NextResponse.json(
        { success: false, message: "Record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Record updated",
      data: updatedRecord,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const recordId = searchParams.get("id");

    const deletedRecord = await Pathology.findByIdAndDelete(recordId);

    if (!deletedRecord) {
      return NextResponse.json(
        { success: false, message: "Record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Record deleted",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
