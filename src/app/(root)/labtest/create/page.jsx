"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createData, fetchData, updateData } from "@/services/apiService";
import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import { withAuth } from "@/services/withAuth";
import { ErrorHandeling } from "@/utils/errorHandling";
import React, { lazy, Suspense, useState, useEffect, useRef, useCallback } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { getDate } from "@/lib/currentDate";
import { formattedTime } from "@/lib/timeGenerate";
import { SuccessHandling } from "@/utils/successHandling";
import Spinner from "@/components/ui/Spinner";
import { useRouter } from "next/navigation";
import Tab from "@/components/Tab";
import { TabLinks } from "@/utils/tablinks";
import { getCompactAge } from "@/lib/ageCount";
import AsyncSelect from "react-select/async";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import DoctorForm from "@/components/component/Doctor";
import { debounce } from "lodash";
import Select from "react-select";
import { formatDate } from "@/lib/formateDate";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const CreateLabtest = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: session } = useSession();

  const [searchTerm, setSearchTerm] = useState("");
  const [ToggleTest, setToggleTest] = useState(true);
  const [consultant, setConsultant] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const submittingRef = useRef(false);
  const [AdmitType, setAdmitType] = useState("NEW");
  const [Billdata, setBilldata] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [Times, setTimes] = useState(formattedTime());
  const [selectDob, setSelectDob] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const discountRef = useRef(null);

  const initialServiceState = {
    mrd_id: "",
    reg_id: "",
    fullname: "",
    phone_number: "",
    referr_by: "",
    gender: "",
    patient: "",
    dob: "",
    age: "",
    address: "",
    consultant: "",
    reporting_date: getDate(),
    reporting_time: "",
    pathology_test_cart: { services: [] },
    radiology_test_cart: { services: [] },
    amount: { total: 0, discount: 0, netTotal: 0 },
    payments: [],
    advances: [],
    admited_by: session?.user?.username,
    total_paid: 0,
    due: 0,
    isEditing: false,
  };

  const [ServiceData, setServiceData] = useState(initialServiceState);

  /* ------------------------------------------------------------------ */
  /*  KEYBOARD SHORTCUTS                                                */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.altKey && e.key === "1") {
        e.preventDefault(); setToggleTest(true);
      } else if (e.altKey && e.key === "2") {
        e.preventDefault(); setToggleTest(false);
      } else if (e.key === "F5") {
        e.preventDefault(); handleSubmit();
      } else if (e.key === "F6") {
        e.preventDefault(); handleUpdate();
      } else if (e.altKey && e.key.toLowerCase() === "d") {
        e.preventDefault(); discountRef.current?.focus(); discountRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [ServiceData, ToggleTest]);

  /* ------------------------------------------------------------------ */
  /*  AGE CALCULATION                                                   */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    setServiceData((prev) => ({
      ...prev,
      age: getCompactAge(selectDob || ""),
      dob: selectDob,
    }));
  }, [selectDob]);

  /* ------------------------------------------------------------------ */
  /*  PAYMENT LOGIC – NEVER EXCEED NET TOTAL                            */
  /* ------------------------------------------------------------------ */
  const [paymentInput, setPaymentInput] = useState({
    amount: "", mode: "", date: getDate(), remark: ""
  });

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentInput((prev) => ({ ...prev, [name]: value }));
  };

  const addPayment = () => {
    const amount = parseFloat(paymentInput.amount) || 0;
    if (!amount || !paymentInput.mode || !paymentInput.date) {
      toast.error("Fill amount, mode & date");
      return;
    }

    const currentPaid = ServiceData.total_paid;
    const netTotal = ServiceData.amount.netTotal;
    const newTotal = currentPaid + amount;

    if (newTotal > netTotal) {
      toast.error(
        `Cannot exceed Net Total (₹${netTotal.toFixed(2)}). Max: ₹${(netTotal - currentPaid).toFixed(2)}`
      );
      return;
    }

    setServiceData((prev) => ({
      ...prev,
      payments: [...prev.payments, { ...paymentInput, amount }],
      total_paid: newTotal,
      due: Math.max(0, netTotal - newTotal),
    }));
    setPaymentInput({ amount: "", mode: "", date: getDate(), remark: "" });
  };

  const removePayment = (idx) => {
    setServiceData((prev) => {
      const removed = prev.payments[idx];
      const newPaid = prev.total_paid - (parseFloat(removed.amount) || 0);
      return {
        ...prev,
        payments: prev.payments.filter((_, i) => i !== idx),
        total_paid: newPaid,
        due: Math.max(0, prev.amount.netTotal - newPaid),
      };
    });
  };

  /* ------------------------------------------------------------------ */
  /*  RECALCULATE TOTALS (WITH CLAMPING)                                */
  /* ------------------------------------------------------------------ */
  const calculateTotals = () => {
    setServiceData((prev) => {
      const round = (n) => Math.round(n * 100) / 100;
      const total = round(prev.amount.total || 0);
      const discount = round(prev.amount.discount || 0);
      const netTotal = round(total - discount);
      const paid = prev.payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);

      // Clamp paid to netTotal
      const finalPaid = Math.min(paid, netTotal);
      const finalDue = round(netTotal - finalPaid);

      return {
        ...prev,
        amount: { ...prev.amount, netTotal: netTotal >= 0 ? netTotal : 0 },
        total_paid: finalPaid,
        due: finalDue >= 0 ? finalDue : 0,
      };
    });
  };

  useEffect(() => {
    calculateTotals();
  }, [ServiceData.amount.total, ServiceData.amount.discount, ServiceData.payments]);

  /* ------------------------------------------------------------------ */
  /*  DISCOUNT % SYNC                                                   */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const total = ServiceData.amount.total || 0;
    const discount = ServiceData.amount.discount || 0;
    setDiscountPercent(total > 0 ? Math.round((discount / total) * 100) : 0);
  }, [ServiceData.amount.total, ServiceData.amount.discount]);

  const handleDiscountPercentChange = (e) => {
    const percent = parseFloat(e.target.value) || 0;
    setDiscountPercent(percent);
    const total = ServiceData.amount.total || 0;
    const discount = Math.round((total * percent) / 100);
    setServiceData((prev) => ({
      ...prev,
      amount: { ...prev.amount, discount },
    }));
  };

  /* ------------------------------------------------------------------ */
  /*  INPUT HANDLER                                                     */
  /* ------------------------------------------------------------------ */
  const handleChange = (e) => {
    const { name, value } = e.target;
    const round = (n) => Math.round(n * 100) / 100;

    if (name.startsWith("amount.")) {
      const field = name.split(".")[1];
      const parsed = parseFloat(value) || 0;
      const rounded = round(parsed);

      if (field === "discount" && rounded > ServiceData.amount.total) {
        toast.error("Discount cannot exceed total");
        return;
      }

      setServiceData((prev) => ({
        ...prev,
        amount: { ...prev.amount, [field]: rounded },
      }));

      if (field === "discount") {
        const total = ServiceData.amount.total || 0;
        setDiscountPercent(total > 0 ? Math.round((rounded / total) * 100) : 0);
      }
    } else {
      setServiceData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  /* ------------------------------------------------------------------ */
  /*  SEARCH BY PRS                                                  */
  /* ------------------------------------------------------------------ */
  const handlemrdIdSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoadingSearch(true);
    try {
      const { data: prevData } = await fetchData(`/patient/${searchTerm}`);
      setServiceData({
        ...initialServiceState,
        fullname: prevData?.fullname || "",
        mrd_id: prevData?.mrd_id || "",
        phone_number: prevData?.phone_number || "",
        referr_by: prevData?.referr_by || "",
        gender: prevData?.gender || "",
        age: prevData?.age || "",
        address: prevData?.address || "",
      });
      setSelectDob(prevData?.dob || "");
    } catch (error) {
      ErrorHandeling(error);
    } finally {
      setLoadingSearch(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  DOCTOR SEARCH                                                     */
  /* ------------------------------------------------------------------ */
  const loadOptions = useCallback(
    debounce(async (inputValue) => {
      try {
        const response = await fetchData(`/doctor?drname=${inputValue}`);
        return response.data.map((doctor) => ({
          value: doctor,
          label: `${doctor.drname} (${doctor?.drinfo || ""})`,
        }));
      } catch (error) {
        ErrorHandeling(error);
        return [];
      }
    }, 300),
    []
  );

  /* ------------------------------------------------------------------ */
  /*  FETCH CATEGORIES & RADIOLOGY                                      */
  /* ------------------------------------------------------------------ */
  const { data: categories } = useQuery({
    queryKey: ["pathologycategories"],
    queryFn: () => fetchData("/admin/pathology/category"),
  });

  const { data: radiologytest } = useQuery({
    queryKey: ["radiologytest"],
    queryFn: () => fetchData("/admin/radiology"),
  });

  /* ------------------------------------------------------------------ */
  /*  FETCH EXISTING BILL (UPDATE MODE)                                 */
  /* ------------------------------------------------------------------ */
  const handleDetailSearch = async () => {
    if (!Billdata.trim()) return;
    setLoadingSearch(true);
    try {
      const { data: prevData } = await fetchData(`/labtest/${Billdata}`);
      setServiceData({
        ...initialServiceState,
        fullname: prevData?.patient?.fullname || "",
        patient: prevData?.patient?._id || "",
        reg_id: prevData?.reg_id || "",
        mrd_id: prevData?.patient?.mrd_id || "",
        phone_number: prevData?.patient?.phone_number || "",
        gender: prevData?.patient?.gender || "",
        age: prevData?.patient?.age || "",
        address: prevData?.patient?.address || "",
        reporting_date: prevData?.reporting_date || getDate(),
        pathology_test_cart: prevData?.pathology_test_cart || { services: [] },
        radiology_test_cart: prevData?.radiology_test_cart || { services: [] },
        amount: prevData?.amount || { total: 0, discount: 0, netTotal: 0 },
        payments: prevData?.payments || [],
        referr_by: prevData?.referr_by || "",
        total_paid: prevData?.total_paid || 0,
        due: prevData?.due || 0,
        isEditing: true,
      });
      setSelectDob(prevData?.patient?.dob || "");
      setConsultant({
        value: prevData?.consultant,
        label: prevData?.consultant?.drname,
      });
    } catch (error) {
      ErrorHandeling(error);
    } finally {
      setLoadingSearch(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  SUBMIT / UPDATE                                                   */
  /* ------------------------------------------------------------------ */
  const handleSubmit = async () => {
    if (ServiceData.isEditing) {
      toast.error("Use Update mode");
      return;
    }
    if (!consultant?.value?._id) {
      toast.error("Select consultant");
      return;
    }
    if (ServiceData.total_paid > ServiceData.amount.netTotal) {
      toast.error("Total paid exceeds Net Total");
      return;
    }

    // Synchronous re-entrancy guard: blocks F5 key-repeat / double-click bursts
    // from firing multiple POSTs and consuming multiple bill numbers.
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsLoading(true);
    try {
      const { data } = await createData("/labtest", {
        ...ServiceData,
        consultant: consultant.value._id,
        payments: ServiceData.payments,
        total_paid: ServiceData.total_paid,
        due: ServiceData.due,
      });
      SuccessHandling("Lab test created");
      router.push(`/labtest/printreceipt/${data?.bill_no}`);
    } catch (error) {
      ErrorHandeling(error);
    } finally {
      submittingRef.current = false;
      setIsLoading(false);
    }
  };

  const mutation = useMutation({
    mutationFn: (payload) =>
      updateData("/labtest", Billdata, { ...payload, reporting_time: Times }),
    onSuccess: () => {
      queryClient.invalidateQueries(["labtestrecord"]);
      SuccessHandling("Updated successfully");
      router.push(`/labtest/printreceipt/${Billdata}`);
    },
    onError: (error) => ErrorHandeling(error),
  });

  const handleUpdate = () => {
    if (!consultant?.value?._id) {
      toast.error("Select consultant");
      return;
    }
    if (ServiceData.total_paid > ServiceData.amount.netTotal) {
      toast.error("Total paid exceeds Net Total");
      return;
    }

    mutation.mutate({
      ...ServiceData,
      consultant: consultant.value._id,
      payments: ServiceData.payments,
      total_paid: ServiceData.total_paid,
      due: ServiceData.due,
    });
  };

  /* ------------------------------------------------------------------ */
  /*  CART OPERATIONS                                                   */
  /* ------------------------------------------------------------------ */
  const addToCart = (test, type) => {
    setServiceData((prev) => {
      const round = (n) => Math.round(n * 100) / 100;
      const charge = type === "pathology" ? Number(test.pathology_charge) : Number(test.test_charge);
      const newTotal = round(prev.amount.total + charge);
      const net = round(newTotal - prev.amount.discount);

      if (type === "pathology") {
        return {
          ...prev,
          pathology_test_cart: { services: [...prev.pathology_test_cart.services, test] },
          amount: { ...prev.amount, total: newTotal, netTotal: net },
        };
      } else {
        return {
          ...prev,
          radiology_test_cart: { services: [...prev.radiology_test_cart.services, test] },
          amount: { ...prev.amount, total: newTotal, netTotal: net },
        };
      }
    });
  };

  const removeFromCart = (test, type) => {
    setServiceData((prev) => {
      const round = (n) => Math.round(n * 100) / 100;
      const charge = type === "pathology" ? Number(test.pathology_charge) : Number(test.test_charge);
      const newTotal = round(prev.amount.total - charge);
      const net = round(newTotal - prev.amount.discount);

      if (type === "pathology") {
        return {
          ...prev,
          pathology_test_cart: {
            services: prev.pathology_test_cart.services.filter((s) => s._id !== test._id),
          },
          amount: { ...prev.amount, total: newTotal, netTotal: net },
        };
      } else {
        return {
          ...prev,
          radiology_test_cart: {
            services: prev.radiology_test_cart.services.filter((s) => s._id !== test._id),
          },
          amount: { ...prev.amount, total: newTotal, netTotal: net },
        };
      }
    });
  };

  /* ------------------------------------------------------------------ */
  /*  RENDER                                                            */
  /* ------------------------------------------------------------------ */
  return (
    <Suspense fallback={<Loading />}>
      <div className="flex flex-wrap w-full justify-between">
        <Tab tabs={TabLinks} category="Labtest" />
        <MiddleSection>
          <div className="w-full space-y-8">
            <Heading heading="Lab Admission">
              <div className="flex flex-col md:flex-row gap-2">
                <select
                  className="p-2 border rounded w-full md:w-auto"
                  value={AdmitType}
                  onChange={(e) => setAdmitType(e.target.value)}
                >
                  <option value="NEW">New</option>
                  <option value="UPDATE">Update</option>
                </select>

                {AdmitType === "NEW" ? (
                  <>
                    <input
                      type="text"
                      placeholder="Enter UHID"
                      className="p-2 border rounded w-full md:w-48"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button
                      onClick={handlemrdIdSearch}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 w-full md:w-auto"
                      disabled={loadingSearch}
                    >
                      {loadingSearch ? <Spinner /> : "Search"}
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Enter Bill No."
                      className="p-2 border rounded w-full md:w-48"
                      value={Billdata}
                      onChange={(e) => setBilldata(e.target.value)}
                    />
                    <button
                      onClick={handleDetailSearch}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 w-full md:w-auto"
                      disabled={loadingSearch}
                    >
                      {loadingSearch ? <Spinner /> : "Get"}
                    </button>
                  </>
                )}
              </div>
            </Heading>

            {/* Patient Info */}
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body p-4 md:p-6">
                <h1 className="card-title text-2xl truncate mb-4">
                  {ServiceData?.fullname || "Patient Not Found"}
                  <span className="text-sm font-normal ml-2">
                    {ServiceData?.mrd_id && `UHID: ${ServiceData?.mrd_id}`}
                  </span>
                </h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* All your input fields – unchanged */}
                  <div className="form-control">
                    <label className="label"><span className="label-text">Full Name<span className="text-red-500">*</span></span></label>
                    <input type="text" name="fullname" value={ServiceData?.fullname} onChange={handleChange} className="input input-bordered" />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Phone Number<span className="text-red-500">*</span></span></label>
                    <input type="text" name="phone_number" value={ServiceData?.phone_number} onChange={handleChange} className="input input-bordered" />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Gender<span className="text-red-500">*</span></span></label>
                    <select name="gender" value={ServiceData?.gender} onChange={handleChange} className="select select-bordered w-full">
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Age<span className="text-red-500">*</span></span></label>
                    <input type="text" name="age" value={ServiceData?.age} onChange={handleChange} className="input input-bordered" />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Date of Birth</span></label>
                    <input type="date" value={selectDob} onChange={(e) => setSelectDob(e.target.value)} className="input input-bordered" />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Address</span></label>
                    <input type="text" name="address" value={ServiceData?.address} onChange={handleChange} className="input input-bordered" />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">REGID <span className="text-red-500">(OPD: leave blank)</span></span></label>
                    <input type="text" name="reg_id" value={ServiceData?.reg_id} onChange={handleChange} className="input input-bordered" />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Consultant</span></label>
                    <div className="flex items-center space-x-2">
                      <AsyncSelect
                        cacheOptions loadOptions={loadOptions} value={consultant} onChange={setConsultant}
                        defaultOptions placeholder="Search consultant..." className="w-full text-lg"
                        noOptionsMessage={({ inputValue }) => inputValue ? "No consultants" : "Type to search"}
                      />
                      <DoctorForm btn={<FaPlus />} />
                    </div>
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Referred By</span></label>
                    <input type="text" name="referr_by" value={ServiceData?.referr_by} onChange={handleChange} className="input input-bordered" />
                  </div>
                </div>
              </div>
            </div>

            {/* Tests & Cart */}
            <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <h2 className="text-xl font-semibold">Available Tests</h2>
                  <div className="flex gap-2">
                    <button className={`${ToggleTest ? "bg-red-500" : "bg-gray-400"} text-white px-4 py-2 rounded`} onClick={() => setToggleTest(true)}>
                      Pathology (Alt+1)
                    </button>
                    <button className={`${!ToggleTest ? "bg-red-500" : "bg-gray-400"} text-white px-4 py-2 rounded`} onClick={() => setToggleTest(false)}>
                      Radiology (Alt+2)
                    </button>
                  </div>
                </div>

                {ToggleTest ? (
                  <Select
                    options={categories?.data}
                    getOptionLabel={(o) => `${o.pathology_category} - ₹${o.pathology_charge}`}
                    getOptionValue={(o) => o._id}
                    onChange={(opt) => opt && addToCart(opt, "pathology")}
                    isSearchable placeholder="Search pathology..."
                    className="basic-single" classNamePrefix="select"
                    styles={{ control: (b) => ({ ...b, minHeight: 42, fontSize: 14 }) }}
                  />
                ) : (
                  <Select
                    options={radiologytest?.data}
                    getOptionLabel={(o) => `${o.test_name} - ₹${o.test_charge}`}
                    getOptionValue={(o) => o._id}
                    onChange={(opt) => opt && addToCart(opt, "radiology")}
                    isSearchable placeholder="Search radiology..."
                    className="basic-single" classNamePrefix="select"
                    styles={{ control: (b) => ({ ...b, minHeight: 42, fontSize: 14 }) }}
                  />
                )}
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Test Cart</h2>
                <div className="space-y-2">
                  {ServiceData.pathology_test_cart.services.map((t, i) => (
                    <div key={i} className="flex justify-between items-center p-3 border rounded">
                      <p className="font-semibold">{t.pathology_category}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-500">₹{Number(t.pathology_charge)}</p>
                        <button onClick={() => removeFromCart(t, "pathology")} className="px-2 py-1 bg-red-500 text-white rounded">
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {ServiceData.radiology_test_cart.services.map((t, i) => (
                    <div key={i} className="flex justify-between items-center p-3 border rounded">
                      <p className="font-semibold">{t.test_name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-500">₹{Number(t.test_charge)}</p>
                        <button onClick={() => removeFromCart(t, "radiology")} className="px-2 py-1 bg-red-500 text-white rounded">
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Payment Section */}
                <div className="card bg-base-100 shadow-sm">
                  <div className="card-body p-4 space-y-6">
                    <div className="form-control">
                      <label className="label"><span className="label-text">Discount (Alt+D)</span></label>
                      <div className="flex gap-2 items-center">
                        <input ref={discountRef} type="number" name="amount.discount" value={ServiceData.amount.discount} onChange={handleChange} className="input input-bordered" min={0} step="0.01" />
                        <span className="mx-2">or</span>
                        <input type="number" value={discountPercent} onChange={handleDiscountPercentChange} className="input input-bordered w-20" min={0} max={100} step="0.01" />
                        <span>%</span>
                      </div>
                    </div>

                    <div className="divider"></div>

                    <div className="space-y-2">
                      <h3 className="font-semibold">Add Payment</h3>
                      <div className="grid grid-cols-4 gap-2">
                        <input type="number" name="amount" value={paymentInput.amount} onChange={handlePaymentInputChange} placeholder="Amount" className="input input-bordered" min={0} step="0.01" />
                        <select name="mode" value={paymentInput.mode} onChange={handlePaymentInputChange} className="select select-bordered">
                          <option value="">Mode</option>
                          <option value="Cash">Cash</option>
                          <option value="Upi">UPI</option>
                          <option value="Card">Card</option>
                          <option value="Cashless">Cashless</option>
                          <option value="Sasthyasathi">Sasthyasathi</option>
                          <option value="Ayushman Bharat">Ayushman Bharat</option>
                          <option value="Cash + Online">Cash + Online</option>
                          <option value="Ayushman Bharat + Cash">Ayushman Bharat + Cash</option>
                          <option value="Sasthyasathi + Cash">Sasthyasathi + Cash</option>
                          <option value="Ayushman Bharat + Sasthyasathi">Ayushman Bharat + Sasthyasathi</option>
                        </select>
                        <input type="date" name="date" value={paymentInput.date} onChange={handlePaymentInputChange} className="input input-bordered" />
                        <input type="text" name="remark" value={paymentInput.remark} onChange={handlePaymentInputChange} placeholder="Remark" className="input input-bordered" />
                      </div>
                      <button onClick={addPayment} className="btn btn-success mt-2">Add Payment</button>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-semibold">Payments</h3>
                      {ServiceData.payments.length === 0 ? (
                        <p className="text-gray-500">No payments added.</p>
                      ) : (
                        ServiceData.payments.map((p, i) => (
                          <div key={i} className="flex gap-2 items-center border p-2 rounded">
                            <span>₹{p.amount}</span>
                            <span>{p.mode}</span>
                            <span>{formatDate(p.date)}</span>
                            <span>{p.remark || "-"}</span>
                            <button onClick={() => removePayment(i)} className="btn btn-xs btn-error">Remove</button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="divider"></div>

                    <div className="grid grid-cols-2 gap-4 text-lg">
                      <div className="flex justify-between"><span>Total:</span><span className="font-bold">₹{ServiceData.amount.total.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Net Total:</span><span className="font-bold text-green-600">₹{ServiceData.amount.netTotal.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Total Paid:</span><span className="font-bold text-blue-600">₹{ServiceData.total_paid.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Due:</span><span className="font-bold text-red-600">₹{ServiceData.due.toFixed(2)}</span></div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 justify-end">
                      <button onClick={() => setServiceData(initialServiceState)} className="btn btn-primary md:w-64">Clear</button>
                      {ServiceData.isEditing ? (
                        <button onClick={handleUpdate} className="btn btn-warning md:w-64" disabled={mutation.isPending || ServiceData.total_paid > ServiceData.amount.netTotal}>
                          Update F6 {mutation.isPending && <Spinner />}
                        </button>
                      ) : (
                        <button onClick={handleSubmit} className="btn btn-primary md:w-64" disabled={isLoading || ServiceData.total_paid > ServiceData.amount.netTotal}>
                          Submit F5 {isLoading && <Spinner />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </MiddleSection>
      </div>
    </Suspense>
  );
};

export default withAuth(CreateLabtest);
