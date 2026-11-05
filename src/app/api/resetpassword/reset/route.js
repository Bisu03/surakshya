import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoConnection';
import User from '@/models/User.models';
import bcrypt from 'bcrypt';

const MAX_ATTEMPTS = 5;
const CLEAR_OTP = { $unset: { resetOtpHash: 1, resetOtpExpires: 1, resetOtpRequestedAt: 1 }, resetOtpAttempts: 0 };

const fail = (message, status = 400) =>
    NextResponse.json({ success: false, message }, { status });

export async function PUT(req) {
    await connectDB();
    try {
        const body = await req.json();
        const email = String(body.email || "").trim().toLowerCase();
        const otp = String(body.otp || "").trim();
        const password = String(body.password || "");

        if (!email || !/^\d{6}$/.test(otp)) return fail("Enter the 6-digit OTP sent to your email");
        if (password.length < 6) return fail("Password must be at least 6 characters");

        const user = await User.findOne({ email }).select("+resetOtpHash +resetOtpExpires");
        if (!user?.resetOtpHash || !user.resetOtpExpires || user.resetOtpExpires < new Date()) {
            return fail("Invalid or expired OTP. Please request a new one.");
        }

        // Reserve an attempt atomically before comparing, so parallel guesses can't exceed the limit.
        const reserved = await User.findOneAndUpdate(
            { _id: user._id, resetOtpAttempts: { $lt: MAX_ATTEMPTS } },
            { $inc: { resetOtpAttempts: 1 } },
            { new: true, projection: { resetOtpAttempts: 1 } }
        );
        if (!reserved) {
            await User.updateOne({ _id: user._id }, CLEAR_OTP);
            return fail("Too many wrong attempts. Please request a new OTP.");
        }

        if (!(await bcrypt.compare(otp, user.resetOtpHash))) {
            const left = MAX_ATTEMPTS - reserved.resetOtpAttempts;
            if (left <= 0) {
                await User.updateOne({ _id: user._id }, CLEAR_OTP);
                return fail("Too many wrong attempts. Please request a new OTP.");
            }
            return fail(`Invalid OTP. ${left} attempt${left === 1 ? "" : "s"} left.`);
        }

        await User.updateOne(
            { _id: user._id },
            { password: await bcrypt.hash(password, 10), ...CLEAR_OTP }
        );

        return NextResponse.json(
            { success: true, message: 'Password Updated Successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Password reset error:', error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error", error: error.message },
            { status: 500 }
        );
    }
}
