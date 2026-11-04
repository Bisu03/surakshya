"use client";

import DoctorForm from "@/components/component/Doctor";
import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import Tab from "@/components/Tab";
import Spinner from "@/components/ui/Spinner";
import { createData, fetchData, updateData } from "@/services/apiService";
import { withAuth } from "@/services/withAuth";
import { ErrorHandeling } from "@/utils/errorHandling";
import { SuccessHandling } from "@/utils/successHandling";
import { TabLinks } from "@/utils/tablinks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { debounce } from "lodash";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { FaPlus, FaPlusCircle } from "react-icons/fa";
import AsyncSelect from "react-select/async";
import Select from "react-select";
const MiddleSection = lazy(() => import("@/components/Middlesection"));

const descOptions = [
  { value: "OPD Consultation Fee", label: "OPD Consultation Fee" },
  { value: "IPD Consultation Fees", label: "IPD Consultation Fees" },
  {
    value: "Vaccination & Consulation Charge",
    label: "Vaccination & Consulation Charge",
  },
  { value: "Dressing Charge", label: "Dressing Charge" },
  { value: "Surgical Team Charge", label: "Surgical Team Charge" },
  { value: "Anesthesia Charge", label: "Anesthesia Charge" },
  { value: "Others", label: "Others" },
];

const ConsultantFee = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: session } = useSession();

  const [searchTerm, setSearchTerm] = useState("");
  const initialState = {
    mrd_id: "",
    billno: "",
    on: "",
    amount: "",
    fullname: "",
    address: "",
    guardian_name: "",
    referr_by: "SELF",
    date: "",
    desc: [],
  };

  const [formData, setFormData] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const submittingRef = useRef(false);

  const [consultant, setConsultant] = useState({});
  const [selectedDesc, setSelectedDesc] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGetPatient = async () => {
    setIsLoading(true);
    try {
      const response = await fetchData(`/patient/${searchTerm}`);
      setFormData({
        ...formData,
        mrd_id: response?.data?.mrd_id,
        fullname: response?.data?.fullname,
        patient: response?.data?._id,
        address: response?.data?.address,
        guardian_name: response?.data?.guardian_name,
      });
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      ErrorHandeling(error);
    }
  };

  const loadOptions = useCallback(
    debounce(async (inputValue) => {
      try {
        const response = await fetchData(`/doctor?drname=${inputValue}`);
        return response.data.map((doctor) => ({
          value: doctor,
          label: `${doctor.drname} (${doctor?.category})`,
        }));
      } catch (error) {
        ErrorHandeling(error);
        return [];
      }
    }, 300),
    []
  );

  const handleSubmit = async () => {
    // Synchronous re-entrancy guard: blocks F5 key-repeat / double-click bursts
    // from firing multiple POSTs and consuming multiple bill numbers.
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsLoading(true);
    try {
      const { data } = await createData("/consultantfee", {
        ...formData,
        desc: selectedDesc,
        consultant: consultant?.value?._id,
      });
      SuccessHandling("Voucher Added Succesfully");
      router.push(`/consultantfee/print/${data?.billno}`);
    } catch (error) {
      ErrorHandeling(error);
    } finally {
      submittingRef.current = false;
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "F5" || e.key === "f5" || e.keyCode === 116) {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleSubmit]);

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex flex-wrap w-full justify-between">
        <Tab tabs={TabLinks} category="Consultant Fee" />
        <MiddleSection>
          <div className="w-full p-2 md:p-4">
            <Heading heading="Consultant Fee">
              <div className="flex flex-col md:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Enter UHID"
                  className="p-2 border rounded w-full md:w-auto"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  onClick={handleGetPatient}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors w-full md:w-auto"
                >
                  Search {isLoading && <Spinner />}
                </button>
              </div>
            </Heading>

            {/* Patient Information Section */}
            <div className="w-full bg-white rounded-lg shadow-sm mb-4 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullname"
                    value={formData?.fullname}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 border-gray-500"
                  />
                </div>

                {/* Address */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData?.address}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 border-gray-500"
                  />
                </div>
                {/* Address */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Guardian name
                  </label>
                  <input
                    type="text"
                    name="guardian_name"
                    value={formData?.guardian_name}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 border-gray-500"
                  />
                </div>

                {/* Consultant Date & Time */}
                <div className="space-y-1 ">
                  <label className="block text-sm font-medium text-gray-700">
                    Date
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="date"
                    required
                    value={formData?.date}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 border-gray-500"
                  />
                </div>
                <div className="space-y-1 ">
                  <label className="block text-sm font-medium text-gray-700">
                    On
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="on"
                    value={formData?.on}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 border-gray-500"
                  />
                </div>

                {/* Consultant Select */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Consultant
                  </label>
                  <div className="w-full">
                    <AsyncSelect
                      cacheOptions
                      loadOptions={loadOptions}
                      value={consultant}
                      onChange={setConsultant}
                      defaultOptions
                      placeholder="Search consultant..."
                      className="w-full text-lg"
                      noOptionsMessage={({ inputValue }) =>
                        inputValue
                          ? "No consultants found"
                          : "Start typing to search"
                      }
                    />
                    <DoctorForm btn={<FaPlusCircle />} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Description (Multiple Select)
                  </label>
                  <div className="w-full">
                    <Select
                      isMulti
                      options={descOptions}
                      value={selectedDesc}
                      onChange={setSelectedDesc}
                      placeholder="Select descriptions..."
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Amount
                  </label>
                  <input
                    type="text"
                    name="amount"
                    value={formData?.amount}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 border-gray-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Referred by
                  </label>
                  <input
                    type="text"
                    name="referr_by"
                    value={formData?.referr_by}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 border-gray-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col md:flex-row gap-2 justify-end">
                <button
                  onClick={() => setFormData(initialState)}
                  className="w-full md:w-auto px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleSubmit}
                  className="w-full md:w-auto px-6 py-2 bg-primary hover:bg-secondary text-white rounded-lg 
                    transition-colors font-medium flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  <span>
                    Admit Patient{" "}
                    <kbd className="hidden md:inline-block ml-2 px-2 py-1 bg-white/20 rounded">
                      F5
                    </kbd>
                  </span>
                  {isLoading && <Spinner />}
                </button>
              </div>
            </div>
          </div>
        </MiddleSection>
      </div>
    </Suspense>
  );
};

export default withAuth(ConsultantFee);
