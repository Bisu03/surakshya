import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongoConnection";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import Labtest from "@/models/Labtest.models";
import Patient from "@/models/Patient.models";
import { formattedTime } from "@/lib/timeGenerate";
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
      startDate: url.searchParams.get("startDate"),
      endDate: url.searchParams.get("endDate"),
      paidby: url.searchParams.get("paidby") || "", // Add payment filter
    };

    if (searchParams.id) {
      const data = await Labtest.findById(searchParams.id)
        .populate("patient")
        .populate("consultant")
        .sort({ createdAt: -1 })
        .exec();
      return NextResponse.json({ success: true, data });
    }

    const matchConditions = {};

    // Search filter
    if (searchParams.search) {
      matchConditions.$or = [
        { "patient.fullname": { $regex: searchParams.search, $options: "i" } },
        { bill_no: { $regex: searchParams.search, $options: "i" } },
        { mrd_id: { $regex: searchParams.search, $options: "i" } },
      ];
    }

    // Payment method filter (new model: payments array)
    if (searchParams.paidby) {
      matchConditions["payments.mode"] = searchParams.paidby;
    }

    // Date filter (use reporting_date)
    if (searchParams.startDate && searchParams.endDate) {
      matchConditions.reporting_date = {
        $gte: searchParams.startDate,
        $lte: searchParams.endDate,
      };
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
      {
        $lookup: {
          from: "doctors",
          localField: "consultant",
          foreignField: "_id",
          as: "consultant",
        },
      },
      { $unwind: "$consultant" },
      { $match: matchConditions },
      { $sort: { createdAt: -1 } },
    ];

    const data = await Labtest.aggregate(pipeline);
    
    return NextResponse.json({
      success: true,
      data,
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
      reg_id,
      fullname,
      phone_number,
      referr_by,
      gender,
      patient,
      dob,
      age,
      consultant,
      address,
      paidby,
      amount,
      reporting_date,
      pathology_test_cart,
      radiology_test_cart,
      admited_by,
      payments = [],
      total_paid = 0,
      due = 0,
    } = body;

    let newLabtest;

    reservedBillNo = await reserveSequence("labtestbill");
    if (!body.mrd_id) {
      reservedMrdId = await reserveSequence("mrdid");
    }

    if (body?.mrd_id) {
      const data = await Patient.findOneAndUpdate({
        mrd_id: mrd_id,
      }, {
        fullname,
        phone_number,
        referr_by,
        gender,
        patient,
        dob,
        age,
        address,
        reg_id
      });
      if (data) {
        newLabtest = await Labtest.create({
          mrd_id,
          reg_id,
          bill_no: reservedBillNo,
          patient: data._id,
          paidby,
          amount,
          consultant,
          reporting_time: formattedTime(),
          reporting_date,
          referr_by,
          pathology_test_cart,
          radiology_test_cart,
          admited_by,
          payments,
          total_paid,
          due,
        });
      }
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
        reg_id,
        mrd_id: reservedMrdId,
      });
      createdPatientId = data?._id;
      newLabtest = await Labtest.create({
        bill_no: reservedBillNo,
        mrd_id: reservedMrdId,
        reg_id,
        paidby,
        patient: data._id,
        amount,
        consultant,
        reporting_time: formattedTime(),
        reporting_date,
        pathology_test_cart,
        referr_by,
        radiology_test_cart,
        admited_by,
        payments,
        total_paid,
        due,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Labtest record created",
      data: newLabtest,
    });
  } catch (error) {
    // Reclaim reserved numbers and remove any orphaned patient on failure.
    if (createdPatientId) await Patient.findByIdAndDelete(createdPatientId);
    await releaseSequence("mrdid", reservedMrdId);
    await releaseSequence("labtestbill", reservedBillNo);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
