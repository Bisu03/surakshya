import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongoConnection";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

import Opd from "@/models/Opd.models"; // Mongoose  model
import Patient from "@/models/Patient.models"
import "@/models/Doctor.models"


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
        const data = await Opd.findById(slug).populate("patient").populate("consultant");
        return NextResponse.json({ success: true, data });


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

    // Get the session
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json(
            { success: false, message: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const { slug } = await context.params;
        const body = await req.json()

        const {
            fullname,
            phone_number,
            gender,
            patient,
            dob,
            age,
            address,
        } = body

        await Opd.findByIdAndUpdate(slug, body);
        await Patient.findByIdAndUpdate(body.patient, {
            fullname,
            phone_number,
            gender,
            patient,
            dob,
            age,
            address,
        })
        // Return the message
        return NextResponse.json(
            { success: true, message: "Update Successfully" },
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

    // Get the session
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json(
            { success: false, message: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const { slug } = await context.params;
        await Opd.findByIdAndDelete(slug);
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