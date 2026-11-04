"use client";

import { ErrorHandeling } from "@/utils/errorHandling";
import { SuccessHandling } from "@/utils/successHandling";
import axios from "axios";
import { useRouter } from "next/navigation";
import { FaLock } from "react-icons/fa";

export default function ForgotPassword() {
    const router = useRouter()
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post('/api/resetpassword/findemail', { email: e.target.email.value  });
            SuccessHandling(data?.message)
            router.push(`/resetpass/${data?.token}`)
        } catch (error) {
            ErrorHandeling(error)
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                <div className="flex flex-col items-center mb-6">
                    <div className="bg-teal-100 rounded-full p-3 mb-4">
                        <FaLock className="text-teal-600 w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        Forgot Password?
                    </h1>
                    <p className="text-gray-600 text-center">
                        Enter your email and we'll send you a reset link
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            placeholder="Enter your registered email"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 transition-colors duration-200 flex items-center justify-center"
                    >
                        <FaLock className="mr-2" />
                        Get Otp
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <a
                        href="/signin"
                        className="text-sm text-teal-600 hover:text-teal-700 transition-colors duration-200"
                    >
                        Back to Login
                    </a>
                </div>
            </div>
        </div>
    );
}