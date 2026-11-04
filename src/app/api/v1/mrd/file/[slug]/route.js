import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { promises as fs } from "fs";
import { connectDB } from "@/lib/mongoConnection";
import { requireAuth, requireAdmin } from "@/lib/serverAuth";
import MrdFile from "@/models/MrdFile.models";
import MrdFolder from "@/models/MrdFolder.models";
import { getFilePath, removeFile } from "@/lib/mrdStorage";

export const runtime = "nodejs";

// GET /api/v1/mrd/file/[slug]        -> stream the file inline (view in tab)
// GET /api/v1/mrd/file/[slug]?download=1 -> stream as an attachment (download)
export async function GET(req, context) {
  try {
    await connectDB();
    const authorization = await requireAuth();
    if (authorization.response) return authorization.response;

    const { slug } = await context.params;
    if (!mongoose.isValidObjectId(slug)) {
      return NextResponse.json(
        { success: false, message: "Invalid file id" },
        { status: 400 }
      );
    }

    const fileDoc = await MrdFile.findById(slug);
    if (!fileDoc) {
      return NextResponse.json(
        { success: false, message: "File not found" },
        { status: 404 }
      );
    }

    const filePath = getFilePath(fileDoc.folder, fileDoc.storedName);
    let data;
    try {
      data = await fs.readFile(filePath);
    } catch (readError) {
      console.error("MRD file missing on disk:", filePath, readError);
      return NextResponse.json(
        { success: false, message: "File is no longer available on the server" },
        { status: 404 }
      );
    }

    const url = new URL(req.url);
    const disposition = url.searchParams.get("download") ? "attachment" : "inline";
    const safeName = (fileDoc.originalName || "file").replace(/["\r\n]/g, "");

    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": fileDoc.mimeType || "application/octet-stream",
        "Content-Disposition": `${disposition}; filename="${safeName}"`,
        "Content-Length": String(data.length),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Unable to download MRD file:", error);
    return NextResponse.json(
      { success: false, message: "Unable to download file" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/mrd/file/[slug]  -> delete a single file (DB + disk)
export async function DELETE(req, context) {
  try {
    await connectDB();
    const authorization = await requireAdmin();
    if (authorization.response) return authorization.response;

    const { slug } = await context.params;
    if (!mongoose.isValidObjectId(slug)) {
      return NextResponse.json(
        { success: false, message: "Invalid file id" },
        { status: 400 }
      );
    }

    const fileDoc = await MrdFile.findById(slug);
    if (!fileDoc) {
      return NextResponse.json(
        { success: false, message: "File not found" },
        { status: 404 }
      );
    }

    try {
      await removeFile(fileDoc.folder, fileDoc.storedName);
    } catch (diskError) {
      console.error("MRD file record removed but disk cleanup failed:", diskError);
    }
    await fileDoc.deleteOne();
    await MrdFolder.findByIdAndUpdate(fileDoc.folder, { $inc: { fileCount: -1 } });

    return NextResponse.json({ success: true, message: "File deleted" });
  } catch (error) {
    console.error("Unable to delete MRD file:", error);
    return NextResponse.json(
      { success: false, message: "Unable to delete file" },
      { status: 500 }
    );
  }
}
