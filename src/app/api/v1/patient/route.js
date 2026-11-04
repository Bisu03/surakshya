import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { connectDB } from "@/lib/mongoConnection"; // MongoDB connection utility
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

import Patient from "@/models/Patient.models"; // Mongoose  model
import Billing from "@/models/Billing.models"; // Mongoose  model
import { reserveSequence, releaseSequence } from "@/lib/sequence";

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
        const searchTerm = url.searchParams.get("fullname") || "";
        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 10;

        const query = {
            fullname: { $exists: true, $type: "string", $regex: searchTerm, $options: "i" }
        };


        const total = await Patient.countDocuments(query);
        const data = await Patient.find(query)
            .sort({ mrd_id: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

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

    let reservedRegId;
    let reservedMrdId;
    let createdPatientId;
    try {
        const body = await req.json();
        if (!body) {
            return NextResponse.json(
                { success: false, message: "Invalid request body" },
                { status: 400 }
            );
        }

        // reg_id is always assigned; mrd_id (UH ID) only for a brand-new patient.
        // (The old "uhid" counter was dropped — Patient has no uh_id field, so it
        // was burning a number every registration for a value that was discarded.)
        reservedRegId = await reserveSequence("regid");
        if (!body.mrd_id) {
            reservedMrdId = await reserveSequence("mrdid");
        }

        const { _id, ipd_id, opd_id, billing, ...newData } = body;

        let patientData;
        if (body.mrd_id) {
            patientData = await Patient.create({
                ...newData,
                reg_id: reservedRegId,
            });
        } else {
            patientData = await Patient.create({
                ...newData,
                reg_id: reservedRegId,
                mrd_id: reservedMrdId,
            });
        }
        createdPatientId = patientData?._id;

        if (patientData) {
            const billData = await Billing.create({
                reg_id: reservedRegId,
                mrd_id: patientData.mrd_id || newData?.mrd_id,
                patient: patientData._id,
            });

            if (billData) {
                await Patient.findByIdAndUpdate(patientData._id, { billing: billData._id });
            }
        }


        return NextResponse.json({
            success: true,
            message: "Patient Registered Successfully",
        });
    } catch (error) {
        // Reclaim reserved numbers and remove any orphaned patient on failure.
        if (createdPatientId) await Patient.findByIdAndDelete(createdPatientId);
        await releaseSequence("mrdid", reservedMrdId);
        await releaseSequence("regid", reservedRegId);
        return NextResponse.json(
            { success: false, message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}


export async function PUT(req) {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json(
            { success: false, message: "Unauthorized" },
            { status: 401 }
        );
    }
    try {
        const { searchParams } = new URL(req.url);
        const patientid = searchParams.get("id");

        const body = await req.json();
        await Patient.findByIdAndUpdate(patientid, body);
        return NextResponse.json({
            success: true,
            message: "Patient Updated Successfully",
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(req) {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json(
            { success: false, message: "Unauthorized" },
            { status: 401 }
        );
    }
    try {
        const { searchParams } = new URL(req.url);
        const patientid = searchParams.get("id");

        await Patient.findByIdAndDelete(patientid);

        return NextResponse.json({
            success: true,
            message: "Patient Deleted Successfully",
        });

    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}
