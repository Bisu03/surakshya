import Billing from "@/models//Billing.models";
import "@/models/Patient.models";
import { connectDB } from "@/lib/mongoConnection"; // MongoDB connection utility
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { NextResponse } from "next/server";

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
        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Build date filter
        const dateFilter = {};
        if (startDate) dateFilter.$gte = startDate;
        if (endDate) dateFilter.$lte = endDate;

        const query = {};
        if (Object.keys(dateFilter).length > 0) {
            query.billing_date = dateFilter;
        }

        const bills = await Billing.find(query)
            .populate('patient')
            .select('mrd_id bill_no reg_id amount paidby isDone billing_date')
            .lean();

        // Transform data
        const report = bills.map(bill => ({
            mrd_id: bill.mrd_id,
            bill_no: bill.bill_no,
            reg_id: bill.reg_id,
            fullname: bill.patient?.fullname || 'N/A',
            netTotal: bill.amount?.netTotal || 0,
            due: bill.amount?.due || 0,
            paidby: bill.paidby,
            isDone: bill.isDone,
            billing_date: bill.billing_date
        }));

        return NextResponse.json({
            success: true,
            data: report,
        });


    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}