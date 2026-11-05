"use client";

import { FaKey, FaShieldAlt } from "react-icons/fa";
import { useEffect, useState } from 'react';
import { useParams } from "next/navigation";
import { SuccessHandling } from "@/utils/successHandling";
import { ErrorHandeling } from "@/utils/errorHandling";
import axios from "axios";
import { useRouter } from "next/navigation";

const RESEND_COOLDOWN_SECONDS = 60;

function decodeEmail(slug) {
    try {
        return decodeURIComponent(slug || "");
    } catch {
        return slug || "";
    }
}

export default function ResetPassword() {
    const [showPassword, setShowPassword] = useState(false);
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
    const { slug } = useParams();
    const email = decodeEmail(slug);
    const router = useRouter()

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        try {
            const { data } = await axios.put(`/api/resetpassword/reset`, { email, otp, password });
            SuccessHandling(data?.message)
            router.push(`/signin`)
        } catch (error) {
            ErrorHandeling(error)
            setSubmitting(false);
        }
    };

    const handleResend = async () => {
        if (resending || cooldown > 0) return;
        setResending(true);
        try {
            const { data } = await axios.post('/api/resetpassword/findemail', { email });
            SuccessHandling(data?.message)
            setOtp('');
            setCooldown(RESEND_COOLDOWN_SECONDS);
        } catch (error) {
            ErrorHandeling(error)
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                <div className="flex flex-col items-center mb-6">
                    <div className="bg-teal-100 rounded-full p-3 mb-4">
                        <div className="flex gap-2">
                            <FaShieldAlt className="text-teal-600 w-6 h-6" />
                            <FaKey className="text-teal-600 w-6 h-6" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        Reset Password
                    </h1>
                    <p className="text-gray-600 text-center">
                        Enter the OTP sent to <span className="font-medium text-gray-800 break-all">{email}</span> and set a new password
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                            OTP (One-Time Password)
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                id="otp"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                pattern="\d{6}"
                                maxLength={6}
                                title="Enter the 6-digit OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                placeholder="Enter 6-digit OTP"
                            />
                            <FaShieldAlt className="absolute right-3 top-3 text-gray-400" />
                        </div>
                        <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-gray-500">Valid for 10 minutes</p>
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={resending || cooldown > 0}
                                className="text-xs text-teal-600 hover:text-teal-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                                {resending ? "Sending..." : cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength="6"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 pr-10"
                                placeholder="Enter new password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-gray-400 hover:text-teal-600"
                            >
                                {showPassword ? <FaKey className="w-5 h-5" /> : <FaKey className="w-5 h-5" />}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Minimum 6 characters
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 transition-colors duration-200 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <FaKey className="mr-2" />
                        {submitting ? "Resetting..." : "Reset Password"}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <a
                        href="/forgotpass"
                        className="text-sm text-teal-600 hover:text-teal-700 transition-colors duration-200"
                    >
                        Use a different email
                    </a>
                </div>
            </div>
        </div>
    );
}