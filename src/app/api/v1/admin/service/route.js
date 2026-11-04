
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoConnection'; // MongoDB connection utility
import Service from '@/models/Service.models';
import { requirePermission } from "@/lib/serverAuth";

export async function GET(req) {
    await connectDB();
    const authorization = await requirePermission("services", "view");
    if (authorization.response) return authorization.response;

    try {
        const services = await Service.find({}).sort({ servicename: 1 });
        return NextResponse.json({ success: true, data: services });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(req) {
    await connectDB();
    const authorization = await requirePermission("services", "create");
    if (authorization.response) return authorization.response;

    try {
        const body = await req.json();

        await Service.create(body);
        return NextResponse.json(
            { success: true, message: "Service Added Successfully" },
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
