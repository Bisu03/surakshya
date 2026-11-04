// app/api/pathology-service/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongoConnection";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import PathologyService from "@/models/Pathologyservice.models";
import "@/models/Pathologycategory.models"


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
        const { slug } = await context.params;
        const body = await req.json();

        await PathologyService.findByIdAndUpdate(
            slug,
            body,
            { new: true }
        )

        return NextResponse.json({
            success: true,
            message: "Service updated successfully",
        });

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

        await PathologyService.findByIdAndDelete(slug);
        return NextResponse.json({
            success: true,
            message: "Service deleted successfully"
        });

    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}