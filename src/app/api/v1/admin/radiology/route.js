// app/api/radiology-test/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongoConnection";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import RadiologyTest from "@/models/Radiologytest.models";

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
        const result = await RadiologyTest.find({});

        return NextResponse.json({
            success: true,
            data: result,
        });

    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(req) {
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
        const { test_name, test_charge } = body;

        if (!test_name || !test_charge) {
            return NextResponse.json(
                { success: false, message: "Test name and charge are required" },
                { status: 400 }
            );
        }


        const newTest = await RadiologyTest.create({
            test_name,
            test_charge
        });

        return NextResponse.json({
            success: true,
            message: "Test created successfully",
            data: newTest
        });

    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}


