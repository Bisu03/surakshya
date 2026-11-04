
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoConnection'; // MongoDB connection utility
import Service from '@/models/Service.models';
import { requirePermission } from "@/lib/serverAuth";

export async function DELETE(req, context) {
    try {
        await connectDB();
        const authorization = await requirePermission("services", "delete");
        if (authorization.response) return authorization.response;

        const { slug } = await context.params;
        await Service.findByIdAndDelete(slug);
        return NextResponse.json({
            success: true,
            message: "Item Deleted"
        });

    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}


export async function PUT(req, context) {
    await connectDB();
    const authorization = await requirePermission("services", "edit");
    if (authorization.response) return authorization.response;

    try {
        const body = await req.json();
        const { slug } = await context.params;

        await Service.findByIdAndUpdate(slug, body)
        return NextResponse.json(
            { success: true, message: "Service Upadated Successfully" },
            { status: 201 }
        );

    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                message: "Server error",
            },
            { status: 500 }
        );
    }
}
