import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongoConnection";
import { requireAuth, requireAdmin } from "@/lib/serverAuth";
import MrdFolder from "@/models/MrdFolder.models";
import MrdFile from "@/models/MrdFile.models";
import { removeFolderDir } from "@/lib/mrdStorage";

export const runtime = "nodejs";

// GET /api/v1/mrd/folder/[slug]  -> folder details + its files
export async function GET(req, context) {
  try {
    await connectDB();
    const authorization = await requireAuth();
    if (authorization.response) return authorization.response;

    const { slug } = await context.params;
    if (!mongoose.isValidObjectId(slug)) {
      return NextResponse.json(
        { success: false, message: "Invalid folder id" },
        { status: 400 }
      );
    }

    const folder = await MrdFolder.findById(slug);
    if (!folder) {
      return NextResponse.json(
        { success: false, message: "Folder not found" },
        { status: 404 }
      );
    }

    const files = await MrdFile.find({ folder: slug }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: { folder, files } });
  } catch (error) {
    console.error("Unable to load MRD folder:", error);
    return NextResponse.json(
      { success: false, message: "Unable to load MRD folder" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/mrd/folder/[slug]  -> delete folder, its files (DB + disk)
export async function DELETE(req, context) {
  try {
    await connectDB();
    const authorization = await requireAdmin();
    if (authorization.response) return authorization.response;

    const { slug } = await context.params;
    if (!mongoose.isValidObjectId(slug)) {
      return NextResponse.json(
        { success: false, message: "Invalid folder id" },
        { status: 400 }
      );
    }

    const folder = await MrdFolder.findById(slug);
    if (!folder) {
      return NextResponse.json(
        { success: false, message: "Folder not found" },
        { status: 404 }
      );
    }

    await MrdFile.deleteMany({ folder: slug });
    try {
      await removeFolderDir(slug);
    } catch (dirError) {
      console.error("MRD folder removed from DB but disk cleanup failed:", dirError);
    }
    await folder.deleteOne();

    return NextResponse.json({ success: true, message: "Folder deleted" });
  } catch (error) {
    console.error("Unable to delete MRD folder:", error);
    return NextResponse.json(
      { success: false, message: "Unable to delete folder" },
      { status: 500 }
    );
  }
}
