"use client";
import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import Tab from "@/components/Tab";
import Spinner from "@/components/ui/Spinner";
import { getCompactAge } from "@/lib/ageCount";
import { getDate } from "@/lib/currentDate";
import { formattedTime } from "@/lib/timeGenerate";
import { createData, fetchData, updateData } from "@/services/apiService";
import { withAuth } from "@/services/withAuth";
import { ErrorHandeling } from "@/utils/errorHandling";
import { SuccessHandling } from "@/utils/successHandling";
import { TabLinks } from "@/utils/tablinks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { debounce } from "lodash";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import React, { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa";
import AsyncSelect from "react-select/async";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const OpdUpdate = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { slug } = useParams();
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const initialState = {
    reg_id: "",
    mrd_id: "",
    fullname: "",
    phone_number: "",
    referr_by: "",
    gender: "",
    patient: "",
    dob: "",
    age: "",
    address: "",
    consultant: "",
    on_examin: "",
    pulse: "",
    spo2: "",
    admited_in: "OPD",
    jaundice: "",
    pallor: "",
    cvs: "",
    resp_system: "",
    gi_system: "",
    nervious_system: "",
    consultant_date: "",
    present_complain: "",
    medical_case: "",
    opd_fees: "",
    paidby: "",
    provisional_diagnosis: "",
    admited_by: session?.user?.username,
  };
  const [formData, setFormData] = useState(initialState);
  const [Times, setTimes] = useState(formattedTime());
  const [selectDob, setSelectDob] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [consultant, setConsultant] = useState({});
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      opd_fees: consultant?.value?.charge || 0,
    }));
  }, [consultant?.value]);

  const handleGetPatient = async () => {
    setIsLoading(true);
    try {
      const response = await fetchData(`/opd/${slug}`);
      setFormData({
        ...response.data,
        fullname: response?.data?.patient?.fullname,
        phone_number: response?.data?.patient?.phone_number,
        referr_by: response?.data?.patient?.referr_by,
        gender: response?.data?.patient?.gender,
        patient: response?.data?.patient?._id,
        dob: response?.data?.patient?.dob,
        age: response?.data?.patient?.age,
        address: response?.data?.patient?.address,
      });
      setSelectDob(response?.data?.patient?.dob);
      setConsultant({
        value: response?.data?.consultant,
        label: response?.data?.consultant?.drname,
      });
      setTimes(response?.data?.consultant_time);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      ErrorHandeling(error);
    }
  };
  useEffect(() => {
    handleGetPatient();
  }, [slug]);

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

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      age: getCompactAge(selectDob || ""),
      dob: selectDob,
    }));
  }, [selectDob]);

  const mutation = useMutation({
    mutationFn: (newItem) => updateData("/opd", slug, newItem),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["opdarecord"], slug }); // Refetch data after adding
      setFormData(initialState);
      SuccessHandling(data.message);
      router.push(`/opd/print/${slug}`);
    },
    onError: (error) => {
      ErrorHandeling(error);
    },
  });

  const handleSubmit = () => {
    mutation.mutate({
      ...formData,
      consultant: consultant.value._id,
      consultant_time: Times,
    });
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "F5") {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleSubmit]);

  return (
    <>
      <Suspense fallback={<Loading />}>
        <div className="flex flex-wrap w-full justify-between">
          <Tab tabs={TabLinks} category="OPD" />
          <MiddleSection>
            <div className="w-full p-2 md:p-4">
              <Heading heading="OPD Admission"></Heading>
              {isLoading && <Loading />}

              {/* Patient Info Section - Responsive Grid */}
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
                      value={formData.fullname}
                      onChange={handleChange}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 border-gray-500"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Phone Number<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 border-gray-500"
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Gender<span className="text-red-500">*</span>
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 border-gray-500"
                    >
                      <option>Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Age */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Age<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 border-gray-500"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="selectDob"
                      value={selectDob}
                      onChange={(e) => setSelectDob(e.target.value)}
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
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 border-gray-500"
                    />
                  </div>

                  {/* Consultant Date & Time */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Consultant Date & Time
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-col md:flex-row gap-2">
                      <input
                        type="date"
                        name="consultant_date"
                        value={formData?.consultant_date}
                        onChange={handleChange}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 border-gray-500"
                      />
                      <input
                        type="text"
                        name="Times"
                        value={Times}
                        onChange={(e) => setTimes(e.target.value)}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 border-gray-500"
                      />
                    </div>
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
                    </div>
                  </div>

                  {/* OPD Fees */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      OPD Fees
                    </label>
                    <input
                      type="text"
                      name="opd_fees"
                      value={formData?.opd_fees}
                      onChange={handleChange}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 border-gray-500"
                    />
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Payment Method
                    </label>
                    <select
                      name="paidby"
                      value={formData?.paidby}
                      onChange={handleChange}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 border-gray-500"
                    >
                      <option value="">Select</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="Cashless">Cashless</option>
                      <option value="Sasthyasathi">Sasthyasathi</option>
                      <option value="Ayushman Bharat">Ayushman Bharat</option>
                      <option value="Cash + Online">Cash + Online</option>
                      <option value="Ayushman Bharat + Cash">Ayushman Bharat + Cash</option>
                      <option value="Sasthyasathi + Cash">Sasthyasathi + Cash</option>
                      <option value="Ayushman Bharat + Sasthyasathi">Ayushman Bharat + Sasthyasathi</option>
                      <option value="Cancel">Cancel</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Medical Details Section */}
              <div className="w-full bg-white rounded-lg shadow-sm p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Height */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Height
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="hight"
                        value={formData?.hight}
                        onChange={handleChange}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 border-gray-500"
                        placeholder="Enter height"
                      />
                      <span className="absolute right-2 top-2.5 text-gray-500 text-sm">
                        cm
                      </span>
                    </div>
                  </div>

                  {/* Weight */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Weight
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="weight"
                        value={formData?.weight}
                        onChange={handleChange}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 border-gray-500"
                        placeholder="Enter weight"
                      />
                      <span className="absolute right-2 top-2.5 text-gray-500 text-sm">
                        kg
                      </span>
                    </div>
                  </div>

                  {/* BP */}

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Blood Pressure
                    </label>
                    <input
                      type="text"
                      name="bp"
                      value={formData?.bp}
                      onChange={handleChange}
                      className="w-full py-2 px-4 border  rounded-lg focus:ring-2 focus:ring-blue-500 border-gray-500 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      On Examination
                    </label>
                    <select
                      name="on_examin"
                      value={formData?.on_examin}
                      onChange={handleChange}
                      className="w-full py-2 px-4 border  rounded-lg focus:ring-2 focus:ring-blue-500 border-gray-500 focus:border-blue-500 bg-white cursor-pointer"
                    >
                      <option value="">Select </option>
                      <option value="Consus">Consus</option>
                      <option value="UnConsus">UnConsus</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Pulse
                    </label>
                    <input
                      type="text"
                      name="pulse"
                      value={formData?.pulse}
                      onChange={handleChange}
                      className="w-full py-2 px-4 border  rounded-lg focus:ring-2 focus:ring-blue-500 border-gray-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      SPO2
                    </label>
                    <input
                      type="text"
                      name="spo2"
                      value={formData?.spo2}
                      onChange={handleChange}
                      className="w-full py-2 px-4 border  rounded-lg focus:ring-2 focus:ring-blue-500 border-gray-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Jaundice
                    </label>
                    <input
                      type="text"
                      name="jaundice"
                      value={formData?.jaundice}
                      onChange={handleChange}
                      className="w-full py-2 px-4 border  rounded-lg focus:ring-2 focus:ring-blue-500 border-gray-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      CVS
                    </label>
                    <input
                      type="text"
                      name="cvs"
                      value={formData?.cvs}
                      onChange={handleChange}
                      className="w-full py-2 px-4 border  rounded-lg focus:ring-2 focus:ring-blue-500 border-gray-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Resp System
                    </label>
                    <input
                      type="text"
                      name="resp_system"
                      value={formData?.resp_system}
                      onChange={handleChange}
                      className="w-full py-2 px-4 border  rounded-lg focus:ring-2 focus:ring-blue-500 border-gray-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Pallor
                    </label>
                    <input
                      type="text"
                      name="pallor"
                      value={formData?.pallor}
                      onChange={handleChange}
                      className="w-full py-2 px-4 border  rounded-lg focus:ring-2 focus:ring-blue-500 border-gray-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      GI System
                    </label>
                    <input
                      type="text"
                      name="gi_system"
                      value={formData?.gi_system}
                      onChange={handleChange}
                      className="w-full py-2 px-4 border  rounded-lg focus:ring-2 focus:ring-blue-500 border-gray-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Nervious System
                    </label>
                    <input
                      type="text"
                      name="nervious_system"
                      value={formData?.nervious_system}
                      onChange={handleChange}
                      className="w-full py-2 px-4 border  rounded-lg focus:ring-2 focus:ring-blue-500 border-gray-500 focus:border-blue-500 transition-all"
                    />
                  </div>

                  {/* Admit Date & Time */}

                  {/* Present Complaint */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Present Complaint
                    </label>
                    <textarea
                      name="present_complain"
                      value={formData?.present_complain}
                      onChange={handleChange}
                      rows={3}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 border-gray-500"
                    />
                  </div>

                  {/* Provisional Diagnosis */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Provisional Diagnosis
                    </label>
                    <textarea
                      name="provisional_diagnosis"
                      value={formData?.provisional_diagnosis}
                      onChange={handleChange}
                      rows={3}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 border-gray-500"
                    />
                  </div>
                </div>

                {/* Update Button */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSubmit}
                    className="w-full md:w-auto px-6 py-2 bg-primary hover:bg-secondary text-white rounded-lg 
                                            transition-colors font-medium flex items-center justify-center gap-2"
                    disabled={mutation.isPending}
                  >
                    <span>
                      Update Patient <kbd className="kbd kbd-sm">F5</kbd>{" "}
                    </span>
                    {mutation.isPending && <Spinner />}
                  </button>
                </div>
              </div>
            </div>
          </MiddleSection>
        </div>
      </Suspense>
    </>
  );
};

export default withAuth(OpdUpdate);
