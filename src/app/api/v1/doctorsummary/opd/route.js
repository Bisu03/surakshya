import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongoConnection";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import Opd from "@/models/Opd.models";
import Patient from "@/models/Patient.models";
import consultant from "@/models/Doctor.models";

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
        const drname = url.searchParams.get("drname");
        const startDate = url.searchParams.get("startDate");
        const endDate = url.searchParams.get("endDate");

        if (!drname || !startDate || !endDate) {
            return NextResponse.json(
                { success: false, message: "Missing required parameters" },
                { status: 400 }
            );
        }

        const aggregationPipeline = [
            {
                $match: {
                    consultant_date: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $lookup: {
                    from: "doctors", // Make sure this matches your Doctor collection name
                    localField: "consultant",
                    foreignField: "_id",
                    as: "consultantDetails"
                }
            },
            { $unwind: "$consultantDetails" },
            {
                $match: {
                    "consultantDetails.drname": drname
                }
            },
            {
                $lookup: {
                    from: Patient.collection.name,
                    localField: "patient",
                    foreignField: "_id",
                    as: "patientDetails"
                }
            },
            { $unwind: "$patientDetails" },
            {
                $project: {
                    _id: 0,
                    fullname: "$patientDetails.fullname",
                    mrdId: "$mrd_id",
                    consultantDate: "$consultant_date",
                    doctorName: "$consultantDetails.drname"
                }
            }
        ];

        const result = await Opd.aggregate(aggregationPipeline);

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