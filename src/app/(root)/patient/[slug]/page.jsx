"use client";

import React, { lazy, Suspense, useEffect, useState } from "react";

import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import { withAuth } from "@/services/withAuth";
import PatientRegistration from "@/components/component/PatientRegistration";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchData, updateData } from "@/services/apiService";
import { FaClinicMedical, FaEdit, FaPrint } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { useParams, redirect, useRouter } from "next/navigation";
import Link from "next/link";
import { SuccessHandling } from "@/utils/successHandling";
import { ErrorHandeling } from "@/utils/errorHandling";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const PatientUpdate = () => {

    const queryClient = useQueryClient();
    const { slug } = useParams();
    const router = useRouter()
    const [formData, setFormData] = useState({});

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const { data, error, isLoading, refetch } = useQuery({
        queryKey: ["patientdetails"], // Unique query key
        queryFn: () => fetchData(`/patient?id=${slug}`), // Function to fetch data
    });

    useEffect(() => {
        refetch(); // Fetch data when slug changes

    }, [slug]);

    useEffect(() => {
        if (data?.data) {
            setFormData(data.data); // Update form data when data is available
        }
    }, [data]);



    const mutation = useMutation({
        mutationFn: (newItem) => updateData(`/patient`, newItem?._id, newItem),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["patientrecord"] }); // Refetch data after adding;
            SuccessHandling(data.message);
            router.push("/patient/record");
        },
        onError: (error) => {
            ErrorHandeling(error);
            console.error("Error adding data:", error);
        },
    });

    const handleSubmit = () => {
        mutation.mutate(formData);
    };

    return (
        <>
            <Suspense fallback={<Loading />}>
                <div className="flex flex-wrap w-full justify-between">
                    <MiddleSection>
                        <div className="w-full">
                            <Heading heading="Patient Record">
                                <Link href="/patient/record" className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded flex items-center">
                                    <FaClinicMedical className="mr-2" />
                                    Patient Record
                                </Link>
                            </Heading>

                            {isLoading && <Loading />}
                            <div className="p-6 pt-0">
                                {" "}
                                <div className="w-full  p-6">
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-1">
                                                <label className="block text-sm font-medium text-gray-700 ">
                                                    Full Name
                                                    <span className="text-red-500 text-lg">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="fullname"
                                                    value={formData?.fullname}
                                                    onChange={handleChange}
                                                    className="w-full max-w-sm py-1  px-4 border border-gray-300 rounded-lg  focus:ring-2 focus:ring-blue-500 focus:border-blue-500   transition-all duration-200 shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-sm font-medium text-gray-700 ">
                                                    Phone Number
                                                    <span className="text-red-500 text-lg">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="phone_number"
                                                    value={formData?.phone_number}
                                                    onChange={handleChange}
                                                    className="w-full max-w-sm py-1  px-4 border border-gray-300 rounded-lg  focus:ring-2 focus:ring-blue-500 focus:border-blue-500   transition-all duration-200 shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-sm font-medium text-gray-700 ">
                                                    Gender
                                                    <span className="text-red-500 text-lg">*</span>
                                                </label>
                                                <select
                                                    name="gender"
                                                    value={formData?.gender}
                                                    onChange={handleChange}
                                                    className="w-full max-w-sm py-1  px-4 border border-gray-300 rounded-lg  focus:ring-2 focus:ring-blue-500 focus:border-blue-500   transition-all duration-200 shadow-sm"
                                                >
                                                    <option>Select</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-sm font-medium text-gray-700 ">
                                                    Age
                                                    <span className="text-red-500 text-lg">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="age"
                                                    value={formData?.age}
                                                    onChange={handleChange}
                                                    className="w-full max-w-sm py-1  px-4 border border-gray-300 rounded-lg  focus:ring-2 focus:ring-blue-500 focus:border-blue-500   transition-all duration-200 shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-sm font-medium text-gray-700 ">
                                                    Date of Birth
                                                </label>
                                                <input
                                                    type="date"
                                                    name="dob"
                                                    value={formData?.dob}
                                                    onChange={handleChange}
                                                    className="w-full max-w-sm py-1  px-4 border border-gray-300 rounded-lg  focus:ring-2 focus:ring-blue-500 focus:border-blue-500   transition-all duration-200 shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-sm font-medium text-gray-700 ">
                                                    Marital Status
                                                </label>
                                                <input
                                                    type="text"
                                                    name="marital_status"
                                                    value={formData?.marital_status}
                                                    onChange={handleChange}
                                                    className="w-full max-w-sm py-1  px-4  border border-gray-300 rounded-lg  focus:ring-2 focus:ring-blue-500 focus:border-blue-500   transition-all duration-200 shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-sm font-medium text-gray-700 ">
                                                    Occupation
                                                </label>
                                                <input
                                                    type="text"
                                                    name="occupation"
                                                    value={formData?.occupation}
                                                    onChange={handleChange}
                                                    className="w-full max-w-sm py-1  px-4  border border-gray-300 rounded-lg  focus:ring-2 focus:ring-blue-500 focus:border-blue-500   transition-all duration-200 shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-sm font-medium text-gray-700 ">
                                                    State
                                                </label>
                                                <input
                                                    type="text"
                                                    name="state"
                                                    value={formData?.state}
                                                    onChange={handleChange}
                                                    className="w-full max-w-sm py-1  px-4  border border-gray-300 rounded-lg  focus:ring-2 focus:ring-blue-500 focus:border-blue-500   transition-all duration-200 shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-sm font-medium text-gray-700 ">
                                                    Dist
                                                </label>
                                                <input
                                                    type="text"
                                                    name="dist"
                                                    value={formData?.dist}
                                                    onChange={handleChange}
                                                    className="w-full max-w-sm py-1  px-4  border border-gray-300 rounded-lg  focus:ring-2 focus:ring-blue-500 focus:border-blue-500   transition-all duration-200 shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-sm font-medium text-gray-700 ">
                                                    City/Vill
                                                </label>
                                                <input
                                                    type="text"
                                                    name="city_vill"
                                                    value={formData?.city_vill}
                                                    onChange={handleChange}
                                                    className="w-full max-w-sm py-1  px-4  border border-gray-300 rounded-lg  focus:ring-2 focus:ring-blue-500 focus:border-blue-500   transition-all duration-200 shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-sm font-medium text-gray-700 ">
                                                    P.S.
                                                </label>
                                                <input
                                                    type="text"
                                                    name="ps"
                                                    value={formData?.ps}
                                                    onChange={handleChange}
                                                    className="w-full max-w-sm py-1  px-4  border border-gray-300 rounded-lg  focus:ring-2 focus:ring-blue-500 focus:border-blue-500   transition-all duration-200 shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-sm font-medium text-gray-700 ">
                                                    P.O.
                                                </label>
                                                <input
                                                    type="text"
                                                    name="po"
                                                    value={formData?.po}
                                                    onChange={handleChange}
                                                    className="w-full max-w-sm py-1  px-4  border border-gray-300 rounded-lg  focus:ring-2 focus:ring-blue-500 focus:border-blue-500   transition-all duration-200 shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-sm font-medium text-gray-700 ">
                                                    Pincode
                                                </label>
                                                <input
                                                    type="text"
                                                    name="pincode"
                                                    value={formData?.pincode}
                                                    onChange={handleChange}
                                                    className="w-full max-w-sm py-1  px-4  border border-gray-300 rounded-lg  focus:ring-2 focus:ring-blue-500 focus:border-blue-500   transition-all duration-200 shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-sm font-medium text-gray-700 ">
                                                    Aadhar
                                                </label>
                                                <input
                                                    type="text"
                                                    name="aadhar"
                                                    value={formData?.aadhar}
                                                    onChange={handleChange}
                                                    className="w-full max-w-sm py-1  px-4  border border-gray-300 rounded-lg  focus:ring-2 focus:ring-blue-500 focus:border-blue-500   transition-all duration-200 shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-sm font-medium text-gray-700 ">
                                                    Guardian Name
                                                </label>
                                                <input
                                                    type="text"
                                                    name="guardian_name"
                                                    value={formData?.guardian_name}
                                                    onChange={handleChange}
                                                    className="w-full max-w-sm py-1  px-4  border border-gray-300 rounded-lg  focus:ring-2 focus:ring-blue-500 focus:border-blue-500   transition-all duration-200 shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-sm font-medium text-gray-700 ">
                                                    Religion
                                                </label>
                                                <input
                                                    type="text"
                                                    name="religion"
                                                    value={formData?.religion}
                                                    onChange={handleChange}
                                                    className="w-full max-w-sm py-1  px-4  border border-gray-300 rounded-lg  focus:ring-2 focus:ring-blue-500 focus:border-blue-500   transition-all duration-200 shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-sm font-medium text-gray-700 ">
                                                    Guardian Phone
                                                </label>
                                                <input
                                                    type="text"
                                                    name="guardian_phone"
                                                    value={formData?.guardian_phone}
                                                    onChange={handleChange}
                                                    className="w-full max-w-sm py-1  px-4  border border-gray-300 rounded-lg  focus:ring-2 focus:ring-blue-500 focus:border-blue-500   transition-all duration-200 shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-sm font-medium text-gray-700 ">
                                                    Referr By
                                                </label>
                                                <input
                                                    type="text"
                                                    name="referr_by"
                                                    value={formData?.referr_by}
                                                    onChange={handleChange}
                                                    className="w-full max-w-sm py-1  px-4  border border-gray-300 rounded-lg  focus:ring-2 focus:ring-blue-500 focus:border-blue-500   transition-all duration-200 shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Submit Button */}
                                        <div className="flex justify-end">
                                            <button
                                                onClick={handleSubmit}
                                                className="px-6 py-2 bg-primary text-white rounded-lg  hover:bg-secondary "
                                            >
                                                Update
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </MiddleSection>
                </div>
            </Suspense>
        </>
    );
};

export default withAuth(PatientUpdate);
