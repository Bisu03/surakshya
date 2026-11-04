import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoConnection";
import { requireAuth } from "@/lib/serverAuth";
import MrdFolder from "@/models/MrdFolder.models";
import { ensureFolderDir } from "@/lib/mrdStorage";

export const runtime = "nodejs";

// GET /api/v1/mrd/folder?search=&page=&limit=  -> paginated folder list
export async function GET(req) {
  try {
    await connectDB();
    const authorization = await requireAuth();
    if (authorization.response) return authorization.response;

    const url = new URL(req.url);
    const searchTerm = url.searchParams.get("search") || "";
    const page = parseInt(url.searchParams.get("page")) || 1;
    const limit = parseInt(url.searchParams.get("limit")) || 12;

    const query = searchTerm
      ? { name: { $regex: searchTerm, $options: "i" } }
      : {};

    const total = await MrdFolder.countDocuments(query);
    const data = await MrdFolder.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Unable to load MRD folders:", error);
    return NextResponse.json(
      { success: false, message: "Unable to load MRD folders" },
      { status: 500 }
    );
  }
}

// POST /api/v1/mrd/folder  -> create a folder (and its storage directory)
export async function POST(req) {
  try {
    await connectDB();
    const authorization = await requireAuth();
    if (authorization.response) return authorization.response;

    const body = await req.json();
    const name = (body?.name || "").trim();
    if (!name) {
      return NextResponse.json(
        { success: false, message: "Folder name is required" },
        { status: 400 }
      );
    }

    const folder = await MrdFolder.create({
      name,
      createdBy:
        authorization.session.user?.username ||
        authorization.session.user?.name ||
        "",
    });

    // Create the physical directory up-front so it exists on the persistent
    // volume even before any file is uploaded.
    try {
      await ensureFolderDir(folder._id);
    } catch (dirError) {
      console.error(
        "MRD folder saved but its storage directory could not be created:",
        dirError
      );
    }

    return NextResponse.json(
      { success: true, message: "Folder created", data: folder },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unable to create MRD folder:", error);
    return NextResponse.json(
      { success: false, message: "Unable to create MRD folder", error: error.message },
      { status: 500 }
    );
  }
}
