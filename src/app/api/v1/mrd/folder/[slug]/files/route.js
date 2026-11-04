import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { promises as fs } from "fs";
import { connectDB } from "@/lib/mongoConnection";
import { requireAuth } from "@/lib/serverAuth";
import MrdFolder from "@/models/MrdFolder.models";
import MrdFile from "@/models/MrdFile.models";
import { ensureFolderDir, makeStoredName, getFilePath } from "@/lib/mrdStorage";

export const runtime = "nodejs";

// POST /api/v1/mrd/folder/[slug]/files  -> upload one or more files ("files")
export async function POST(req, context) {
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

    const formData = await req.formData();
    const files = formData
      .getAll("files")
      .filter((f) => f && typeof f.arrayBuffer === "function");

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, message: "No files provided" },
        { status: 400 }
      );
    }

    await ensureFolderDir(folder._id);
    const uploadedBy =
      authorization.session.user?.username ||
      authorization.session.user?.name ||
      "";

    const created = [];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const storedName = makeStoredName(file.name);
      const destination = getFilePath(folder._id, storedName);
      await fs.writeFile(destination, buffer);

      const doc = await MrdFile.create({
        folder: folder._id,
        originalName: file.name || storedName,
        storedName,
        mimeType: file.type || "application/octet-stream",
        size: file.size || buffer.length,
        uploadedBy,
      });
      created.push(doc);
    }

    await MrdFolder.findByIdAndUpdate(folder._id, {
      $inc: { fileCount: created.length },
    });

    return NextResponse.json(
      {
        success: true,
        message: `${created.length} file(s) uploaded`,
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unable to upload MRD files:", error);
    return NextResponse.json(
      { success: false, message: "Unable to upload files", error: error.message },
      { status: 500 }
    );
  }
}
