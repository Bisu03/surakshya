import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { connectDB } from "@/lib/mongoConnection"; // MongoDB connection utility
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

import Labtest from "@/models/Labtest.models"; // Mongoose  model
import Patient from "@/models/Patient.models"
import "@/models/Doctor.models"

export async function GET(req, context) {
    // Connect to the database
    await connectDB();
    try {
        const { slug } = await context.params;

        const data = await Labtest.findOne({
            bill_no: slug
        }).populate("patient")
            .populate("consultant")
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
        const body = await req.json();

        const {
            fullname,
            phone_number,
            gender,
            patient,
            dob,
            age,
            address,
            reg_id,
        } = body

        const data = await Labtest.findOneAndUpdate({
            bill_no: slug
        }, body)


        if (body.patient) {
            await Patient.findByIdAndUpdate(body.patient, {
                fullname,
                phone_number,
                gender,
                patient,
                dob,
                age,
                address,
                reg_id,
            })
        }
        // Return the message
        return NextResponse.json(
            { success: true, data, message: "Record Updated", },
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

        const data = await Labtest.findByIdAndDelete(slug)
        // Return the message
        return NextResponse.json(
            { success: true, message: "Record Deleted" },
            { status: 200 }
        );

    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}


