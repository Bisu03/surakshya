import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoConnection";
import { requirePermission } from "@/lib/serverAuth";
import { sanitizePermissions } from "@/lib/permissions";
import User from "@/models/User.models";

export async function GET(req, context) {
  await connectDB();
  const authorization = await requirePermission("users", "view");
  if (authorization.response) return authorization.response;

  const { slug } = await context.params;
  const user = await User.findById(slug, "-password");
  if (!user) {
    return NextResponse.json(
      { success: false, message: "User not found" },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, data: user });
}

export async function PUT(req, context) {
  await connectDB();
  const authorization = await requirePermission("users", "manage_permissions");
  if (authorization.response) return authorization.response;

  const { slug } = await context.params;
  const body = await req.json();
  const user = await User.findById(slug);
  if (!user) {
    return NextResponse.json(
      { success: false, message: "User not found" },
      { status: 404 }
    );
  }

  user.permissions = sanitizePermissions(body.permissions);
  await user.save();
  return NextResponse.json({
    success: true,
    message: "Permissions updated successfully",
    data: await User.findById(slug, "-password"),
  });
}
