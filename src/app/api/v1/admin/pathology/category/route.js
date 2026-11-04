// app/api/pathology-category/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongoConnection";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import PathologyCategory from "@/models/Pathologycategory.models";

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
        const idSearch = url.searchParams.get("id");
        if (idSearch) {
            const data = await PathologyCategory.findById(idSearch).sort({ createdAt: -1 });
            return NextResponse.json({ success: true, data });
        } else {
            const result = await PathologyCategory.find({}).sort({ createdAt: -1 });
            return NextResponse.json({
                success: true,
                data: result,
            });
        }
    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(req) {
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


        const newCategory = await PathologyCategory.create({
            ...body
        });

        return NextResponse.json({
            success: true,
            message: "Category created successfully",
            data: newCategory
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(req) {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json(
            { success: false, message: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const { searchParams } = new URL(req.url);
        const categoryId = searchParams.get("id");
        const body = await req.json();

        const updatedCategory = await PathologyCategory.findByIdAndUpdate(
            categoryId,
            body,
            { new: true }
        );

        if (!updatedCategory) {
            return NextResponse.json(
                { success: false, message: "Category not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Category updated successfully",
            data: updatedCategory
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(req) {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json(
            { success: false, message: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const { searchParams } = new URL(req.url);
        const categoryId = searchParams.get("id");

        const deletedCategory = await PathologyCategory.findByIdAndDelete(categoryId);

        if (!deletedCategory) {
            return NextResponse.json(
                { success: false, message: "Category not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Category deleted successfully"
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}