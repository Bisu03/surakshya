import { randomBytes } from "crypto";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoConnection";
import { sendMail } from "@/lib/mail";
import { sanitizePermissions } from "@/lib/permissions";
import { requirePermission } from "@/lib/serverAuth";
import User from "@/models/User.models";

const publicFields = "-password";

function temporaryPassword() {
  return randomBytes(9).toString("base64url");
}

async function sendCredentials(user, password) {
  await sendMail({
    to: user.email,
    subject: "Hospital Management System login credentials",
    text: `Login: ${user.email}\nTemporary password: ${password}`,
    html: `<p>Your account has been created.</p><p>Login: <strong>${user.email}</strong></p><p>Temporary password: <strong>${password}</strong></p><p>Please keep these credentials private.</p>`,
  });
}

export async function GET() {
  await connectDB();
  const authorization = await requirePermission("users", "view");
  if (authorization.response) return authorization.response;

  const users = await User.find({}, publicFields).sort({ createdAt: -1 });
  return NextResponse.json({ success: true, data: users });
}

export async function POST(req) {
  await connectDB();
  const authorization = await requirePermission("users", "create");
  if (authorization.response) return authorization.response;

  try {
    const body = await req.json();
    const username = String(body.username || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    if (!username || !email) {
      return NextResponse.json(
        { success: false, message: "Username and email are required" },
        { status: 400 }
      );
    }

    if (await User.exists({ $or: [{ email }, { username }] })) {
      return NextResponse.json(
        { success: false, message: "A user with that email or username already exists" },
        { status: 409 }
      );
    }
    if (body.role === "Admin" && authorization.session.user.role !== "Admin") {
      return NextResponse.json(
        { success: false, message: "Only an administrator can create another administrator" },
        { status: 403 }
      );
    }

    const password = temporaryPassword();
    const user = await User.create({
      username,
      email,
      password: await bcrypt.hash(password, 10),
      role: body.role === "Admin" ? "Admin" : "Staff",
      isActive: body.isActive !== false,
      permissions: sanitizePermissions(body.permissions),
    });

    let emailSent = true;
    let warning;
    try {
      await sendCredentials(user, password);
    } catch (error) {
      emailSent = false;
      warning = "User created, but SMTP delivery failed. Use Reset Password to retry.";
      console.error("Credential email delivery failed:", error.message);
    }

    return NextResponse.json(
      {
        success: true,
        message: emailSent ? "User registered and credentials sent" : warning,
        emailSent,
        data: { _id: user._id },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Unable to create user", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  await connectDB();
  const authorization = await requirePermission("users", "edit");
  if (authorization.response) return authorization.response;

  try {
    const body = await req.json();
    const user = await User.findById(body._id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (body.resetPassword) {
      const password = temporaryPassword();
      user.password = await bcrypt.hash(password, 10);
      await user.save();
      try {
        await sendCredentials(user, password);
      } catch (error) {
        return NextResponse.json(
          {
            success: true,
            emailSent: false,
            message: "Password reset, but SMTP delivery failed",
          },
          { status: 200 }
        );
      }
      return NextResponse.json({
        success: true,
        emailSent: true,
        message: "Temporary password sent",
      });
    }

    if (body.username !== undefined) user.username = String(body.username).trim();
    if (body.email !== undefined) user.email = String(body.email).trim().toLowerCase();
    if (
      body.role !== undefined &&
      body.role !== user.role &&
      authorization.session.user.role !== "Admin"
    ) {
      return NextResponse.json(
        { success: false, message: "Only an administrator can change roles" },
        { status: 403 }
      );
    }
    const wasFinalActiveAdmin =
      user.role === "Admin" &&
      user.isActive &&
      (await User.countDocuments({ role: "Admin", isActive: true })) <= 1;
    if (body.role !== undefined) user.role = body.role === "Admin" ? "Admin" : "Staff";
    if (body.isActive !== undefined) user.isActive = Boolean(body.isActive);
    if (body.permissions !== undefined) {
      user.permissions = sanitizePermissions(body.permissions);
    }

    if (wasFinalActiveAdmin && (user.role !== "Admin" || user.isActive === false)) {
      return NextResponse.json(
        { success: false, message: "The final active administrator cannot be demoted" },
        { status: 409 }
      );
    }

    await user.save();
    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      data: await User.findById(user._id, publicFields),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Unable to update user", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  await connectDB();
  const authorization = await requirePermission("users", "delete");
  if (authorization.response) return authorization.response;

  const userId = new URL(req.url).searchParams.get("id");
  if (!userId) {
    return NextResponse.json(
      { success: false, message: "User ID is required" },
      { status: 400 }
    );
  }
  if (userId === authorization.session.user.id) {
    return NextResponse.json(
      { success: false, message: "You cannot delete your own account" },
      { status: 409 }
    );
  }

  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json(
      { success: false, message: "User not found" },
      { status: 404 }
    );
  }
  if (
    user.role === "Admin" &&
    user.isActive &&
    (await User.countDocuments({ role: "Admin", isActive: true })) <= 1
  ) {
    return NextResponse.json(
      { success: false, message: "The final active administrator cannot be deleted" },
      { status: 409 }
    );
  }

  await user.deleteOne();
  return NextResponse.json({ success: true, message: "User deleted successfully" });
}
