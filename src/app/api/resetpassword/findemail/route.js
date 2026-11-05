import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoConnection"; // MongoDB connection utility
import User from "@/models/User.models"; // Mongoose User model
import { randomInt } from "crypto";
import bcrypt from "bcrypt";
import { sendMail } from "@/lib/mail";

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const GENERIC_MESSAGE = "If the account exists, an OTP has been sent to that email";

export async function POST(req) {
    await connectDB()
    try {
        const body = await req.json();
        const email = String(body.email || "").trim().toLowerCase();
        if (!email) {
            return NextResponse.json(
                { success: false, message: "Email is required" },
                { status: 400 }
            );
        }

        const user = await User.findOne({ email, isActive: { $ne: false } })
            .select("+resetOtpRequestedAt");
        // Same response whether or not the account exists, so emails can't be probed.
        if (!user) {
            return NextResponse.json({ success: true, message: GENERIC_MESSAGE, email });
        }

        const sinceLast = Date.now() - (user.resetOtpRequestedAt?.getTime() || 0);
        if (sinceLast < RESEND_COOLDOWN_MS) {
            const wait = Math.ceil((RESEND_COOLDOWN_MS - sinceLast) / 1000);
            return NextResponse.json(
                { success: false, message: `Please wait ${wait} seconds before requesting another OTP` },
                { status: 429 }
            );
        }

        // The OTP only ever leaves the server by email; the database keeps a hash.
        const otp = String(randomInt(100000, 1000000));
        await User.updateOne(
            { _id: user._id },
            {
                resetOtpHash: await bcrypt.hash(otp, 10),
                resetOtpExpires: new Date(Date.now() + OTP_TTL_MS),
                resetOtpRequestedAt: new Date(),
                resetOtpAttempts: 0,
            }
        );

        try {
            await sendMail({
                to: email,
                subject: "Hospital Management System password reset",
                text: `Your password reset OTP is ${otp}. It expires in 10 minutes.`,
                html: `<p>Your password reset OTP is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
            });
        } catch (error) {
            console.error("Password reset email delivery failed:", error.message);
            await User.updateOne(
                { _id: user._id },
                { $unset: { resetOtpHash: 1, resetOtpExpires: 1, resetOtpRequestedAt: 1 } }
            );
            return NextResponse.json(
                { success: false, message: "Could not send the OTP email. Please try again later or contact the administrator." },
                { status: 503 }
            );
        }

        return NextResponse.json({ success: true, message: GENERIC_MESSAGE, email });
    } catch (error) {
        console.error("Password reset request error:", error);
        return NextResponse.json(
            { success: false, message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}
