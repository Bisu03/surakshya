import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { connectDB } from "@/lib/mongoConnection"; // MongoDB connection utility
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

import Consultantfee from "@/models//Consultantfee.models"; // Mongoose  model
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
        const searchTerm = url.searchParams.get("search");
        const startDate = url.searchParams.get("startDate");
        const endDate = url.searchParams.get("endDate");

        // Build match conditions
        const matchConditions = {};

        // Search by fullname only
        if (searchTerm) {
            matchConditions.fullname = {
                $regex: searchTerm,
                $options: "i" // Case-insensitive
            };
        }

        // Date filtering
        if (startDate || endDate) {
            matchConditions.date = {};
            if (startDate) matchConditions.date.$gte = startDate
            if (endDate) matchConditions.date.$lte = endDate
        }

        const pipeline = [
            {
                $lookup: {
                    from: "doctors",
                    localField: "consultant",
                    foreignField: "_id",
                    as: "consultant"
                }
            },
            { $unwind: { path: "$consultant", preserveNullAndEmptyArrays: true } },
            { $match: matchConditions },
            {
                $sort: { date: -1 } // Newest first
            }
        ];

        const data = await Consultantfee.aggregate(pipeline);
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
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json(
            { success: false, message: "Unauthorized" },
            { status: 401 }
        );
    }
    let reservedBillNo;
    try {
        const body = await req.json();
        const {
            mrd_id,
            on,
            patient,
            amount,
            fullname,
            address,
            guardian_name,
            referr_by,
            consultant,
            date,
            desc,
        } = body

        reservedBillNo = await reserveSequence("consultantbill");

        const data = await Consultantfee.create({
            mrd_id,
            billno: reservedBillNo,
            on,
            patient,
            amount,
            fullname,
            address,
            consultant,
            referr_by,
            guardian_name,
            date,
            desc,
        });

        return NextResponse.json({
            success: true,
            message: "Patient Registered Successfully",
            data
        });




    } catch (error) {
        // Reclaim the reserved bill number so a failed voucher does not skip it.
        await releaseSequence("consultantbill", reservedBillNo);
        return NextResponse.json(
            { success: false, message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}
