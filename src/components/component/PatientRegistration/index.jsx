
import Spinner from "@/components/ui/Spinner";
import { usePatient } from "@/context/patientdetails/PatientDetails";
import { createData, fetchData } from "@/services/apiService";
import { stateData } from "@/utils/data";
import { ErrorHandeling } from "@/utils/errorHandling";
import { SuccessHandling } from "@/utils/successHandling";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import React, { useEffect, useReducer, useRef, useState } from "react";
const PatientRegistration = ({ admitedin }) => {
    const queryClient = useQueryClient();
    const { data: session } = useSession();
    
    const [isModalOpen, setModalOpen] = useState(false);
    const [MrdId, setMrdId] = useState("");
    const { patientRefetch } = usePatient()
    const [searchTerm, setSearchTerm] = useState("");

    const initialState = {
        fullname: "",
        phone_number: "",
        age: "",
        dob: "",
        gender: "",
        marital_status: "",
        occupation: "",
        blood_group: "",
        state: "West Bengal",
        dist: "Purba Medinipur (East Medinipur)",
        city_vill: "",
        ps: "",
        po: "",
        pincode: "",
        admited_in: admitedin,
        aadhar: "",
        guardian_name: "",
        religion: "",
        guardian_phone: "",
        referr_by: "",
        admited_by: session?.user?.username,
    }
    const [formData, setFormData] = useState(initialState);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
    }, [isModalOpen]);

    const handleOpen = () => setModalOpen(true);
    const handleClose = () => setModalOpen(false);

    const handleGetPatient = async () => {
        try {
            const response = await fetchData(`/patient/${MrdId}`);
            setFormData(response?.data);

        } catch (error) {
            ErrorHandeling(error)
        }
    }

    const submittingRef = useRef(false);

    // 🔹 POST Request: Add New Data
    const mutation = useMutation({
        mutationFn: (newItem) => createData("/patient", newItem),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["patientrecord"] }); // Refetch data after adding
            setFormData(initialState);
            SuccessHandling(data.message);
            patientRefetch()
            handleClose();
        },
        onError: (error) => {
            ErrorHandeling(error);
            console.error("Error adding data:", error);
        },
        onSettled: () => {
            submittingRef.current = false;
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault(); // Prevents default form submission
        // Synchronous re-entrancy guard: blocks a fast double-click from firing
        // two POSTs and consuming two registration numbers.
        if (submittingRef.current) return;
        submittingRef.current = true;
        const {
            ipd_id,
            opd_id,
            ...newData } = formData
        mutation.mutate(newData);
    };


    return (
        <>
            <button className="btn btn-secondary" onClick={handleOpen}>
                New Patient
            </button>

            {isModalOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4"
                    onClick={handleClose}
                >
                    <div
                        className="bg-slate-100 rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-2 right-2 z-10 p-2 bg-slate-700  rounded-full "
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>

                        {/* Content */}
                        <div className="p-6 pt-0">
                            {" "}
                            <div className="w-full  p-6">
                                <div className="space-y-6">
                                    <div className="space-x-2 flex">
                                        <input
                                            type="text"
                                            name="setMrdId"
                                            value={MrdId}
                                            onChange={(e) => setMrdId(e.target.value)}
                                            placeholder="UHID"
                                            className="w-full max-w-sm  px-4 border border-gray-300 rounded-lg  focus:ring-2 focus:ring-blue-500 focus:border-blue-500   transition-all duration-200 shadow-sm"
                                        />
                                        <button onClick={handleGetPatient} className="btn btn-accent">Enter</button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-1">
                                            <label className="block text-sm font-medium text-gray-700 ">
                                                Full Name
                                                <span className="text-red-500 text-lg">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="fullname"
                                                value={formData.fullname}
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
                                                value={formData.phone_number}
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
                                                value={formData.gender}
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
                                                value={formData.age}
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
                                                value={formData.dob}
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
                                                value={formData.marital_status}
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
                                                value={formData.occupation}
                                                onChange={handleChange}
                                                className="w-full max-w-sm py-1  px-4  border border-gray-300 rounded-lg  focus:ring-2 focus:ring-blue-500 focus:border-blue-500   transition-all duration-200 shadow-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-sm font-medium text-gray-700 ">
                                                Blood Group
                                            </label>
                                            <select
                                                name="blood_group"
                                                value={formData?.blood_group}
                                                onChange={handleChange}
                                                className="w-full py-2 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
                                            >
                                                <option value="">Select Blood Group</option>
                                                <option value="A+">A+</option>
                                                <option value="A-">A-</option>
                                                <option value="B+">B+</option>
                                                <option value="B-">B-</option>
                                                <option value="AB+">AB+</option>
                                                <option value="AB-">AB-</option>
                                                <option value="O+">O+</option>
                                                <option value="O-">O-</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-sm font-medium text-gray-700 ">
                                                State
                                            </label>
                                            <select
                                                name="state"
                                                value={formData.state}
                                                onChange={handleChange}
                                                className="w-full max-w-sm py-1 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                                            >
                                                <option >Select State</option>
                                                {stateData.states.map((data, idx) => (
                                                    <option value={data.state} key={idx}>
                                                        {data.state}
                                                    </option>
                                                ))}
                                            </select>

                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-sm font-medium text-gray-700 ">
                                                Dist
                                            </label>
                                            <input
                                                type="text"
                                                name="dist"
                                                value={formData.dist}
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
                                                value={formData.city_vill}
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
                                                value={formData.ps}
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
                                                value={formData.po}
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
                                                value={formData.pincode}
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
                                                value={formData.aadhar}
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
                                                value={formData.guardian_name}
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
                                                value={formData.religion}
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
                                                value={formData.guardian_phone}
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
                                                value={formData.referr_by}
                                                onChange={handleChange}
                                                className="w-full max-w-sm py-1  px-4  border border-gray-300 rounded-lg  focus:ring-2 focus:ring-blue-500 focus:border-blue-500   transition-all duration-200 shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleSubmit}
                                            disabled={mutation.isPending}
                                            className="px-6 py-2 bg-primary text-white rounded-lg  hover:bg-secondary disabled:opacity-50"
                                        >
                                            Submit {mutation.isPending && <Spinner />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div >
            )}
        </>
    );
};

export default PatientRegistration;
