import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongoConnection";
import { requirePermission } from "@/lib/serverAuth";

import Doctor from '@/models/Doctor.models'; // Mongoose model

export async function PUT(req, context) {
    // Connect to the database
    await connectDB();
    const authorization = await requirePermission("doctors", "edit");
    if (authorization.response) return authorization.response;

    try {
        const { slug } = await context.params;
        const body = await req.json()
        await Doctor.findByIdAndUpdate(slug, body);
        // Return the message
        return NextResponse.json(
            { success: true, message: " Update Successfully" },
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
    // Connect to the database
    await connectDB();
    const authorization = await requirePermission("doctors", "delete");
    if (authorization.response) return authorization.response;

    try {
        const { slug } = await context.params;
        await Doctor.findByIdAndDelete(slug);
        // Return the message
        return NextResponse.json(
            { success: true, message: " Deleted Successfully" },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}