import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { connectDB } from "@/lib/mongoConnection"; // MongoDB connection utility
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

import Consultantfee from "@/models//Consultantfee.models"; // Mongoose  model
import Counter from "@/models/Counter.models";
import "@/models/Patient.models";
import "@/models/Doctor.models";


export async function GET(req, context) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }
        const { slug } = await context.params;
        const data = await Consultantfee.findOne({ billno: slug }).populate("patient").populate("consultant");
        return NextResponse.json({ success: true, data });

    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}
export async function DELETE(req, context) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }
        const { slug } = await context.params;
        const data = await Consultantfee.findByIdAndDelete( slug )
        return NextResponse.json({ success: true, data });

    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}
