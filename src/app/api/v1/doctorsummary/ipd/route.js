import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongoConnection";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import Billing from "@/models/Billing.models";
import Patient from "@/models/Patient.models";
import Ipd from "@/models/Ipd.models";

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
                    billing_date: { 
                        $gte: startDate, 
                        $lte: endDate
                    },
                    "consultant_cart.items.drname": drname
                }
            },
            { $unwind: "$consultant_cart.items" },
            {
                $match: {
                    "consultant_cart.items.drname": drname
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
                $lookup: {
                    from: Ipd.collection.name,
                    localField: "ipd",
                    foreignField: "_id",
                    as: "ipdDetails"
                }
            },
            { $unwind: "$ipdDetails" },
            {
                $group: {
                    _id: {
                        patientId: "$patient",
                        regId: "$reg_id",
                        mrdId: "$mrd_id"
                    },
                    fullname: { $first: "$patientDetails.fullname" },
                    admitDate: { $first: "$ipdDetails.admit_date" },
                    totalVisits: { $sum: { $toInt: "$consultant_cart.items.doctor_visit" } },
                    doctorName: { $first: "$consultant_cart.items.drname" }
                }
            },
            {
                $project: {
                    _id: 0,
                    patientId: "$_id.patientId",
                    fullname: 1,
                    mrdId: "$_id.mrdId",
                    regId: "$_id.regId",
                    admitDate: 1,
                    doctorName: 1,
                    totalVisits: 1
                }
            }
        ];

        const result = await Billing.aggregate(aggregationPipeline);

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