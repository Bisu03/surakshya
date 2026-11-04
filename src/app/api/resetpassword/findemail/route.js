import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoConnection"; // MongoDB connection utility
import User from "@/models/User.models"; // Mongoose User model
import { randomInt } from "crypto";
import { sendMail } from "@/lib/mail";
import { SignJWT } from "jose";

export async function POST(req) {
    await connectDB()
    try {
        const body = await req.json();

        const user = await User.findOne({ email: body.email });
        if (!user) {
            return NextResponse.json(
                { success: false, message: "If the account exists, a reset email will be sent" },
                { status: 404 }
            );
        }

        const otp = String(randomInt(100000, 1000000));
        const secret = new TextEncoder().encode(process.env.NEXT_APP_JWT_SECRET);
        const token = await new SignJWT({ email: body.email, otp })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("10m")
            .sign(secret);

        if (body.email) {
            await sendMail({
                to: body.email,
                subject: "Hospital Management System password reset",
                text: `Your password reset OTP is ${otp}. It expires in 10 minutes.`,
                html: `<p>Your password reset OTP is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
            });
        }
        return NextResponse.json(
            { success: true, message: "Email Was Sent", token },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}
