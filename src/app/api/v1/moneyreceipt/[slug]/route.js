import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { connectDB } from "@/lib/mongoConnection";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import MoneyReceipt from "@/models/MoneyReceipt.models";
import "@/models/Billing.models"
import "@/models/Patient.models"

export async function GET(req, context) {
    // Connect to the database
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json(
            { success: false, message: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const { slug } = await context.params;

        const data = await MoneyReceipt.findOne({
            rec_no: slug
        }).populate("billing").populate("patient")
        // Return the message
        return NextResponse.json(
            { success: true, data },
            { status: 200 }
        );

    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(req, context) {
    // Connect to the database
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json(
            { success: false, message: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const { slug } = await context.params;
        const body = await req.json();

        const data = await MoneyReceipt.findOneAndUpdate({
            rec_no: slug
        }, {
            ...body
        })
        // Return the message
        return NextResponse.json(
            { success: true, message: "Receipt Updated" },
            { status: 200 }
        );

    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}