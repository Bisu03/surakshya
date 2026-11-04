import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongoConnection";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

import ExpenseCategory from "@/models/ExpenseCategory.models";



export async function PUT(req, context) {
    // Connect to the database
    await connectDB();

    // Get the current session from next-auth
    const session = await getServerSession(authOptions);

    if (session) {
        try {
            const body = await req.json();
            const { slug } = await context.params;
            // insert data into data base
            await ExpenseCategory.findByIdAndUpdate(slug, body);

            // Return the message
            return NextResponse.json(
                { success: true, message: "Category Updated" },
                { status: 200 }
            );
        } catch (error) {
            console.error("Error handling pharmacy config API:", error);
            return NextResponse.json(
                {
                    success: false,
                    message: "Internal Server Error",
                    error: error.message,
                },
                { status: 500 }
            );
        }
    } else {
        // Unauthorized response if no session is found
        return NextResponse.json(
            { success: false, message: "Unauthorized" },
            { status: 401 }
        );
    }
}
export async function DELETE(req, context) {
    // Connect to the database
    await connectDB();

    // Get the current session from next-auth
    const session = await getServerSession(authOptions);

    if (session) {
        try {
            const body = await req.json();
            const { slug } = await context.params;
            // insert data into data base
            await ExpenseCategory.findByIdAndDelete(slug);

            // Return the message
            return NextResponse.json(
                { success: true, message: "Category Deleted" },
                { status: 200 }
            );
        } catch (error) {
            console.error("Error handling pharmacy config API:", error);
            return NextResponse.json(
                {
                    success: false,
                    message: "Internal Server Error",
                    error: error.message,
                },
                { status: 500 }
            );
        }
    } else {
        // Unauthorized response if no session is found
        return NextResponse.json(
            { success: false, message: "Unauthorized" },
            { status: 401 }
        );
    }
}
