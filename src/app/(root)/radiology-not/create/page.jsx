"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createData, fetchData } from "@/services/apiService";
import PatientDropdown from "@/components/component/PatientDropdown";
import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import { withAuth } from "@/services/withAuth";
import { ErrorHandeling } from "@/utils/errorHandling";
import React, { lazy, Suspense, useState, useEffect } from "react";
import { FaTrash } from "react-icons/fa";
import PatientRegistration from "@/components/component/PatientRegistration";
import { getDate } from "@/lib/currentDate";
import { formattedTime } from "@/lib/timeGenerate";
import { SuccessHandling } from "@/utils/successHandling";
import Spinner from "@/components/ui/Spinner";
import { useRouter } from "next/navigation";
import Tab from "@/components/Tab";
import { TabLinks } from "@/utils/tablinks";
import { getCompactAge } from "@/lib/ageCount";
import Select from "react-select";
import { useSession } from "next-auth/react";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const CreatePathology = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: session } = useSession();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchTest, setSearchTest] = useState("");
  const [PatientSearch, setPatientSearch] = useState({ fullname: "" });
  const [consultant, setConsultant] = useState({});
  const [ServiceData, setServiceData] = useState({
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
    paydby: "",
    reporting_date: getDate(),
    test_cart: {
      services: [],
    },
    amount: {
      total: 0,
      discount: 0,
      paid: 0,
      due: 0,
      netTotal: 0
    },
    admited_by: session?.user?.username
  });
  const [Times, setTimes] = useState(formattedTime());
  const [selectDob, setSelectDob] = useState("");

  useEffect(() => {
    setServiceData(prev => ({
      ...prev,
      age: getCompactAge(selectDob || ""),
      dob: selectDob
    }));
  }, [selectDob]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('amount.')) {
      const field = name.split('.')[1];
      setServiceData(prev => {
        const updatedAmount = {
          ...prev.amount,
          [field]: Math.max(parseFloat(value) || 0, 0)
        };

        // Recalculate values
        updatedAmount.netTotal = updatedAmount.total - updatedAmount.discount;
        updatedAmount.due = Math.max(updatedAmount.netTotal - updatedAmount.paid, 0);

        // Ensure paid doesn't exceed netTotal
        if (field === 'paid') {
          updatedAmount.paid = Math.min(updatedAmount.paid, updatedAmount.netTotal);
        }

        // Ensure discount doesn't exceed total
        if (field === 'discount') {
          updatedAmount.discount = Math.min(updatedAmount.discount, updatedAmount.total);
        }

        return {
          ...prev,
          amount: updatedAmount
        };
      });
    } else {
      setServiceData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };


  const handlemrdIdSearch = async () => {
    try {
      const { data: prevData } = await fetchData(`/patient/${searchTerm}`);

      setServiceData({
        ...ServiceData,
        fullname: prevData?.fullname,
        patient: prevData?._id,
        mrd_id: prevData?.mrd_id,
        phone_number: prevData?.phone_number,
        referr_by: prevData?.referr_by,
        gender: prevData?.gender,
        age: prevData?.age,
        address: prevData?.address,
      });
      setSelectDob(prevData?.dob);
    } catch (error) {
      ErrorHandeling(error);
    }
  };

  const { data: doctorrecord } = useQuery({
    queryKey: ["doctorrecord"], // Unique query key
    queryFn: () => fetchData("/doctor"), // Function to fetch data
  });

  const doctorOptions = doctorrecord?.data?.map((doctor) => ({
    value: doctor,
    label: doctor.drname,
  }));

  // Fetch categories and tests
  const { data: categories } = useQuery({
    queryKey: ["pathologycategories"],
    queryFn: () => fetchData("/admin/pathology/category"),
  });

  const { data: pathologytests } = useQuery({
    queryKey: ["pathologyservices"],
    queryFn: () => fetchData("/admin/pathology/record"),
  });

  const mutation = useMutation({
    mutationFn: (newRecord) =>
      createData("/pathology", {
        ...newRecord,
        reporting_time: Times,
        amount: {
          ...newRecord.amount,
          netTotal: newRecord.amount.total - newRecord.amount.discount
        }
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries(["pathologyrecords"]);
      SuccessHandling(data.message);
      router.push(`/pathology/printreceipt/${data?.data?.bill_no}`);
    },
    onError: (error) => ErrorHandeling(error),
  });

  const handleSubmit = () => {
    if (!ServiceData.paydby) {
      return ErrorHandeling({ message: "Please select payment method" });
    }
    mutation.mutate({ ...ServiceData, consultant: consultant.value._id });
  };

  const addToCart = (test) => {
    setServiceData(prev => {
      const newTotal = prev.amount.total + Number(test.pathology_charge);
      const newNetTotal = newTotal - prev.amount.discount;
      const newDue = Math.max(newNetTotal - prev.amount.paid, 0);

      const relatedTests = pathologytests.data
        .filter((pt) => pt.pathology_category?._id === test._id)
        .map((pt) => ({ ...pt, reading_unit: "" }));

      return {
        ...prev,
        test_cart: {
          services: [...prev.test_cart.services, { ...test, related_tests: relatedTests }]
        },
        amount: {
          ...prev.amount,
          total: newTotal,
          netTotal: newNetTotal,
          due: newDue
        }
      };
    });
  };

  const removeFromCart = (test) => {
    setServiceData(prev => {
      const updatedServices = prev.test_cart.services.filter(
        service => service._id !== test._id
      );
      const newTotal = prev.amount.total - Number(test.pathology_charge);
      const newNetTotal = newTotal - prev.amount.discount;
      const newDue = Math.max(newNetTotal - prev.amount.paid, 0);

      return {
        ...prev,
        test_cart: {
          services: updatedServices
        },
        amount: {
          ...prev.amount,
          total: newTotal,
          netTotal: newNetTotal,
          due: newDue
        }
      };
    });
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex flex-wrap w-full justify-between">
        <Tab tabs={TabLinks} category="Pathology Patient" />
        <MiddleSection>
          <div className="w-full">
            <Heading heading="Pathology Admission">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter UHID"
                  className="p-2 border rounded"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  onClick={handlemrdIdSearch}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Search
                </button>
              </div>
            </Heading>
            <div className="w-full bg-gray-100 p-2 md:p-4 rounded-lg shadow-sm mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name<span className="text-red-500 text-lg">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullname"
                    value={ServiceData.fullname}
                    onChange={handleChange}
                    className="w-full max-w-sm py-1 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Number<span className="text-red-500 text-lg">*</span>
                  </label>
                  <input
                    type="text"
                    name="phone_number"
                    value={ServiceData.phone_number}
                    onChange={handleChange}
                    className="w-full max-w-sm py-1 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Gender<span className="text-red-500 text-lg">*</span>
                  </label>
                  <select
                    name="gender"
                    value={ServiceData.gender}
                    onChange={handleChange}
                    className="w-full max-w-sm py-1 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Age<span className="text-red-500 text-lg">*</span>
                  </label>
                  <input
                    type="text"
                    name="age"
                    value={ServiceData.age}
                    onChange={handleChange}
                    className="w-full max-w-sm py-1 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Date of Birth
                  </label>
                  <input
                    type="date"

                    name="selectDob"
                    value={selectDob}
                    onChange={(e) => setSelectDob(e.target.value)}
                    className="w-full max-w-sm py-1 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={ServiceData.address}
                    onChange={handleChange}
                    className="w-full max-w-sm py-1 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Reporting Date
                  </label>
                  <input
                    type="date"
                    disabled
                    name="reporting_date"
                    value={ServiceData.reporting_date}
                    onChange={handleChange}
                    className="w-full max-w-sm py-1 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Reporting Time
                  </label>
                  <input
                    type="text"
                    name="Times"
                    disabled
                    value={Times}
                    onChange={(e) => setTimes(e.target.value)}
                    className="w-full max-w-sm py-1 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Consultant
                  </label>
                  <div className="flex items-center space-x-2">
                    <Select
                      options={doctorOptions}
                      value={consultant}
                      name="consultant"
                      onChange={(selectedOption) =>
                        setConsultant(selectedOption)
                      }
                      isClearable
                      placeholder="Select Doctor"
                      className="w-full max-w-sm text-lg"
                    />{" "}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Referred By
                  </label>
                  <input
                    type="text"
                    name="referr_by"
                    value={ServiceData.referr_by}
                    onChange={handleChange}
                    className="w-full max-w-sm py-1 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                  />
                </div>

              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Available Tests</h2>
              <input
                type="text"
                placeholder="Search tests..."
                className="w-full p-2 border border-black rounded"
                value={searchTest}
                onChange={(e) => setSearchTest(e.target.value)}
              />
              {categories?.data
                ?.filter((test) =>
                  test.pathology_category.toLowerCase().includes(searchTest.toLowerCase())
                )
                .map((test) => (
                  <div
                    key={test._id}
                    className="flex justify-between items-center p-3 border border-black rounded"
                  >
                    <p className="font-semibold">{test.pathology_category}</p>
                    <p className="text-sm font-bold text-gray-500">
                      ₹{Number(test.pathology_charge)}
                    </p>
                    <button
                      onClick={() => addToCart(test)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Add
                    </button>
                  </div>
                ))}
            </div>


            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Test Cart</h2>
              {ServiceData.test_cart.services.map((test, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 border rounded"
                >
                  <p className="font-semibold">{test.pathology_category}</p>
                  <p className="text-sm font-bold text-gray-500">
                    ₹{Number(test.pathology_charge)}
                  </p>
                  <button
                    onClick={() => removeFromCart(test)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}

              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between">
                  <span className="font-semibold">Total:</span>
                  <span>₹{ServiceData.amount.total}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Discount Amount
                    </label>
                    <input
                      type="number"
                      name="amount.discount"
                      value={ServiceData.amount.discount}
                      onChange={handleChange}
                      className="w-full p-2 border rounded"
                      min="0"
                      max={ServiceData.amount.total}
                      step="0.01"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Paid Amount
                    </label>
                    <input
                      type="number"
                      name="amount.paid"
                      value={ServiceData.amount.paid}
                      onChange={handleChange}
                      className="w-full p-2 border rounded"
                      min="0"
                      max={ServiceData.amount.netTotal}
                      step="0.01"
                    />
                  </div>

                </div>
                <div className="grid grid-cols-2 gap-4">

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Due Amount
                    </label>
                    <input
                      type="number"
                      value={ServiceData.amount.due}
                      readOnly
                      className="w-full p-2 border rounded bg-gray-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Payment Method<span className="text-red-500">*</span>
                    </label>
                    <select
                      name="paydby"
                      value={ServiceData.paydby}
                      onChange={handleChange}
                      className="w-full p-2 border rounded"
                      required
                    >
                      <option value="">Select</option>
                      <option value="Cash">Cash</option>
                      <option value="Upi">Upi</option>
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



                <div className="flex justify-between font-semibold">
                  <span>Net Total:</span>
                  <span>₹{ServiceData.amount.netTotal}</span>
                </div>

                <button
                  onClick={handleSubmit}
                  className="btn btn-primary w-full mt-4"
                  disabled={mutation.isPending || !ServiceData.paydby}
                >
                  {mutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner /> Submitting...
                    </span>
                  ) : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </MiddleSection>
      </div >
    </Suspense >
  );
};

export default withAuth(CreatePathology);
