import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongoConnection";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import Opd from "@/models/Opd.models";

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

        // Convert dates to proper format (YYYY-MM-DD)
        const formatDateString = (dateString) => {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
        };

        const aggregationPipeline = [
            {
                $match: {
                    consultant_date: {
                        $gte: formatDateString(startDate),
                        $lte: formatDateString(endDate)
                    }
                }
            },
            {
                $lookup: {
                    from: "patient_registrations", // Verify actual collection name
                    localField: "patient",
                    foreignField: "_id",
                    as: "patient"
                }
            },
            { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    mrd_id: 1,
                    fullname: { $ifNull: ["$patient.fullname", "N/A"] },
                    paidby: 1,
                    opd_fees: 1,
                    consultant_date: 1
                }
            }
        ];

        const result = await Opd.aggregate(aggregationPipeline);

        return NextResponse.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error("OPD Report Error:", error);
        return NextResponse.json(
            { success: false, message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}