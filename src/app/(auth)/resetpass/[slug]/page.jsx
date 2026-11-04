"use client";

import { FaKey, FaShieldAlt } from "react-icons/fa";
import { useState } from 'react';
import { useParams } from "next/navigation";
import { SuccessHandling } from "@/utils/successHandling";
import { ErrorHandeling } from "@/utils/errorHandling";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function ResetPassword() {
    const [showPassword, setShowPassword] = useState(false);
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const { slug } = useParams();
    const router = useRouter()

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.put(`/api/resetpassword/${slug}`, { password, otp });
            SuccessHandling(data?.message)
            router.push(`/signin`)
        } catch (error) {
            ErrorHandeling(error)
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
                        Enter OTP and set new password
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                            OTP (One-Time Password)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                id="otp"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                placeholder="Enter OTP"

                            />
                            <FaShieldAlt className="absolute right-3 top-3 text-gray-400" />
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
                        className="w-full bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 transition-colors duration-200 flex items-center justify-center"
                    >
                        <FaKey className="mr-2" />
                        Reset Password
                    </button>
                </form>
            </div>
        </div>
    );
}