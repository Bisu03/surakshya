// app/api/radiology-test/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongoConnection";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import RadiologyTest from "@/models/Radiologytest.models";


export async function PUT(req, context) {
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
        const body = await req.json();

        const updatedTest = await RadiologyTest.findByIdAndUpdate(
            slug,
            body,
            { new: true }
        );

        return NextResponse.json({
            success: true,
            message: "Test updated successfully",
            data: updatedTest
        });

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
        await RadiologyTest.findByIdAndDelete(slug);

        return NextResponse.json({
            success: true,
            message: "Test deleted successfully"
        });

    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}

