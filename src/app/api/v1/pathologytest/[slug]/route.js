import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoConnection";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import PathologyTest from "@/models/PathologyTest.models";

export async function GET(req, context) {
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
        const data = await PathologyTest.findById(slug).lean();

        if (!data) {
            return NextResponse.json(
                { success: false, message: "Test not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                data,
            },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                message: "Internal Server Error",
                error: error.message,
            },
            { status: 500 }
        );
    }
}

export async function PUT(req, context) {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json(
            { success: false, message: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const body = await req.json();
        const { slug } = await context.params;

        const {
            assessment,
            reporting_details,
            name,
            department,
            sampleType,
            suffix,
            type,
            instrument,
            comment,
            testItems, // Replaced parameters and subTests
        } = body;

        const data = await PathologyTest.findByIdAndUpdate(
            slug,
            {
                assessment,
                reporting_details,
                name,
                department,
                sampleType,
                suffix,
                type,
                instrument,
                comment,
                testItems, // Use testItems instead of parameters and subTests
            },
            { new: true, runValidators: true }
        ).lean();

        if (!data) {
            return NextResponse.json(
                { success: false, message: "Test not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, message: "Update Successfully", data },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(req, context) {
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

        const deletedTest = await PathologyTest.findByIdAndDelete(slug);

        if (!deletedTest) {
            return NextResponse.json(
                { success: false, message: "Test not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, message: "Test deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                message: "Internal Server Error",
                error: error.message,
            },
            { status: 500 }
        );
    }
}