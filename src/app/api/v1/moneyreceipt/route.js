import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { connectDB } from "@/lib/mongoConnection";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import MoneyReceipt from "@/models/MoneyReceipt.models";
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
        const startDate = url.searchParams.get("startDate");
        const endDate = url.searchParams.get("endDate");

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
                $match: {
                    billing_date: {
                        $gte: startDate,
                        $lte: endDate,
                    },
                },
            },
            { $sort: { billing_date: -1 } }
        ];

        const data = await MoneyReceipt.aggregate(pipeline);
        return NextResponse.json({ success: true, data });
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

    let reservedRecNo;
    try {
        const body = await req.json();

        const { reg_id, mrd_id, paidby, patient, billing, billing_date, billing_time, amount, admit_time, admit_date } = body;
        // Reserve the receipt number.
        reservedRecNo = await reserveSequence("rec_no");

        // Create money receipt
        const moneyReceipt = await MoneyReceipt.create({
            billing,
            reg_id,
            mrd_id,
            patient,
            rec_no: reservedRecNo,
            admit_time, admit_date,
            billing_date: billing_date,
            billing_time: billing_time ? billing_time : formattedTime(),
            amount: amount,
            paidby,
        });

        return NextResponse.json({
            success: true,
            message: "Money receipt created successfully",
            data: moneyReceipt,
        });
    } catch (error) {
        // Reclaim the reserved receipt number so a failed receipt does not skip it.
        await releaseSequence("rec_no", reservedRecNo);
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
        const receiptId = searchParams.get("id");
        const body = await req.json();

        const updatedReceipt = await MoneyReceipt.findByIdAndUpdate(
            receiptId,
            body,
            { new: true }
        );

        return NextResponse.json({
            success: true,
            message: "Receipt updated successfully",
            data: updatedReceipt,
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
        const receiptId = searchParams.get("id");

        await MoneyReceipt.findByIdAndDelete(receiptId);
        return NextResponse.json({
            success: true,
            message: "Receipt deleted successfully",
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}