"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchData, updateData } from "@/services/apiService";
import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import { withAuth } from "@/services/withAuth";
import { ErrorHandeling } from "@/utils/errorHandling";
import React, { lazy, Suspense, useState, useEffect, useRef } from "react";
import { FaTrash } from "react-icons/fa";
import { getDate } from "@/lib/currentDate";
import { formattedTime } from "@/lib/timeGenerate";
import { SuccessHandling } from "@/utils/successHandling";
import Spinner from "@/components/ui/Spinner";
import { useRouter, useParams } from "next/navigation";
import Tab from "@/components/Tab";
import { TabLinks } from "@/utils/tablinks";
import { getCompactAge } from "@/lib/ageCount";
import Select from "react-select";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/formateDate";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const UpdateLabrecord = () => {
  const queryClient = useQueryClient();
  const { slug } = useParams();
  const router = useRouter();
  const discountRef = useRef(null);
  const [loading, setLoading] = useState(false);

  /* ---------- STATE ---------- */
  const [ServiceData, setServiceData] = useState({
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
    total_paid: 0,
    due: 0,
  });

  const [Times] = useState(formattedTime());
  const [selectDob, setSelectDob] = useState("");
  const [consultant, setConsultant] = useState(null); // { value, label }
  const [ToggleTest, setToggleTest] = useState(true);
  const [discountPercent, setDiscountPercent] = useState(0);

  /* ---------- PAYMENT LOGIC ---------- */
  const [paymentInput, setPaymentInput] = useState({
    amount: "",
    mode: "",
    date: getDate(),
    remark: "",
  });

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentInput((prev) => ({ ...prev, [name]: value }));
  };

  const addPayment = () => {
    const amount = parseFloat(paymentInput.amount) || 0;
    if (!amount || !paymentInput.mode || !paymentInput.date) {
      toast.error("Please fill amount, mode & date");
      return;
    }

    const currentPaid = ServiceData.total_paid;
    const netTotal = ServiceData.amount.netTotal;
    const newTotalPaid = currentPaid + amount;

    if (newTotalPaid > netTotal) {
      toast.error(
        `Payment exceeds Net Total (₹${netTotal.toFixed(2)}). Max allowed: ₹${(
          netTotal - currentPaid
        ).toFixed(2)}`
      );
      return;
    }

    setServiceData((prev) => ({
      ...prev,
      payments: [...prev.payments, { ...paymentInput, amount }],
      total_paid: newTotalPaid,
      due: Math.max(0, netTotal - newTotalPaid),
    }));
    setPaymentInput({ amount: "", mode: "", date: getDate(), remark: "" });
  };

  const removePayment = (idx) => {
    setServiceData((prev) => {
      const removed = prev.payments[idx];
      const newPaid = prev.total_paid - (parseFloat(removed.amount) || 0);
      const netTotal = prev.amount.netTotal;
      return {
        ...prev,
        payments: prev.payments.filter((_, i) => i !== idx),
        total_paid: newPaid,
        due: Math.max(0, netTotal - newPaid),
      };
    });
  };

  /* ---------- RECALCULATE TOTALS ---------- */
  useEffect(() => {
    const round = (n) => Math.round(n * 100) / 100;

    setServiceData((prev) => {
      const total = round(prev.amount.total || 0);
      const discount = round(prev.amount.discount || 0);
      const netTotal = round(total - discount);
      const paid = prev.payments.reduce(
        (s, p) => s + (parseFloat(p.amount) || 0),
        0
      );
      const due = round(netTotal - paid);

      const finalPaid = Math.min(paid, netTotal);
      const finalDue = round(netTotal - finalPaid);

      return {
        ...prev,
        amount: { ...prev.amount, netTotal: netTotal >= 0 ? netTotal : 0 },
        total_paid: finalPaid,
        due: finalDue >= 0 ? finalDue : 0,
      };
    });
  }, [ServiceData.amount.total, ServiceData.amount.discount, ServiceData.payments]);

  /* ---------- DISCOUNT % SYNC ---------- */
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

  /* ---------- INPUT HANDLER ---------- */
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

  /* ---------- ALT+D SHORTCUT ---------- */
  useEffect(() => {
    const handler = (e) => {
      if (e.altKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        discountRef.current?.focus();
        discountRef.current?.select();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ---------- FETCH DOCTORS ---------- */
  const { data: doctorrecord } = useQuery({
    queryKey: ["doctorrecord"],
    queryFn: () => fetchData("/doctor"),
  });

  const doctorOptions = doctorrecord?.data?.map((d) => ({
    value: d,
    label: d.drname,
  })) || [];

  /* ---------- FETCH LAB RECORD ---------- */
  const handleDetailSearch = async () => {
    setLoading(true);
    try {
      const { data: prevData } = await fetchData(`/labtest/${slug}`);

      const patient = prevData?.patient || {};
      const dob = patient.dob || "";
      const calculatedAge = dob ? getCompactAge(dob) : patient.age || "";

      setServiceData({
        reg_id: prevData?.reg_id || "",
        fullname: patient?.fullname || "",
        phone_number: patient?.phone_number || "",
        referr_by: prevData?.referr_by || "",
        gender: patient?.gender || "",
        dob: dob,
        age: calculatedAge,
        address: patient?.address || "",
        consultant: prevData?.consultant || "",
        reporting_date: prevData?.reporting_date || getDate(),
        reporting_time: prevData?.reporting_time || formattedTime(),
        pathology_test_cart: prevData?.pathology_test_cart || { services: [] },
        radiology_test_cart: prevData?.radiology_test_cart || { services: [] },
        amount: {
          total: prevData?.amount?.total || 0,
          discount: prevData?.amount?.discount || 0,
          netTotal: prevData?.amount?.netTotal || 0,
        },
        payments: prevData?.payments || [],
        total_paid: prevData?.total_paid || 0,
        due: prevData?.due || 0,
        patient: patient._id || "",
      });

      setSelectDob(dob);

      if (prevData?.consultant) {
        setConsultant({
          value: prevData.consultant,
          label: prevData.consultant.drname,
        });
      }
    } catch (err) {
      ErrorHandeling(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) handleDetailSearch();
  }, [slug]);

  /* ---------- AGE FROM DOB ---------- */
  useEffect(() => {
    if (selectDob) {
      const age = getCompactAge(selectDob);
      setServiceData((prev) => ({ ...prev, age }));
    }
  }, [selectDob]);

  /* ---------- FETCH TESTS ---------- */
  const { data: categories } = useQuery({
    queryKey: ["pathologycategories"],
    queryFn: () => fetchData("/admin/pathology/category"),
  });

  const { data: radiologytest } = useQuery({
    queryKey: ["radiologytest"],
    queryFn: () => fetchData("/admin/radiology"),
  });

  /* ---------- UPDATE MUTATION ---------- */
  const mutation = useMutation({
    mutationFn: (payload) =>
      updateData("/labtest", slug, { ...payload, reporting_time: Times }),
    onSuccess: (data) => {
      queryClient.invalidateQueries(["labtestrecord"]);
      SuccessHandling(data.message);
      router.push(`/labtest/printreceipt/${slug}`);
    },
    onError: (err) => ErrorHandeling(err),
  });

  const handleSubmit = () => {
    if (!consultant?.value?._id) {
      toast.error("Please select a consultant");
      return;
    }

    if (ServiceData.total_paid > ServiceData.amount.netTotal) {
      toast.error("Total paid cannot exceed Net Total");
      return;
    }

    mutation.mutate({
      ...ServiceData,
      consultant: consultant.value._id,
      reporting_time: Times,
    });
  };

  /* ---------- CART OPERATIONS ---------- */
  const addToCart = (test, type) => {
    setServiceData((prev) => {
      const round = (n) => Math.round(n * 100) / 100;
      const charge =
        type === "pathology" ? Number(test.pathology_charge) : Number(test.test_charge);
      const newTotal = round(prev.amount.total + charge);
      const net = round(newTotal - prev.amount.discount);
      const due = round(net - prev.total_paid);

      if (type === "pathology") {
        return {
          ...prev,
          pathology_test_cart: { services: [...prev.pathology_test_cart.services, test] },
          amount: { ...prev.amount, total: newTotal, netTotal: net },
          due: due >= 0 ? due : 0,
        };
      } else {
        return {
          ...prev,
          radiology_test_cart: { services: [...prev.radiology_test_cart.services, test] },
          amount: { ...prev.amount, total: newTotal, netTotal: net },
          due: due >= 0 ? due : 0,
        };
      }
    });
  };

  const removeFromCart = (test, type) => {
    setServiceData((prev) => {
      const round = (n) => Math.round(n * 100) / 100;
      const charge =
        type === "pathology" ? Number(test.pathology_charge) : Number(test.test_charge);
      const newTotal = round(prev.amount.total - charge);
      const net = round(newTotal - prev.amount.discount);
      const due = round(net - prev.total_paid);

      if (type === "pathology") {
        return {
          ...prev,
          pathology_test_cart: {
            services: prev.pathology_test_cart.services.filter((s) => s._id !== test._id),
          },
          amount: { ...prev.amount, total: newTotal, netTotal: net },
          due: due >= 0 ? due : 0,
        };
      } else {
        return {
          ...prev,
          radiology_test_cart: {
            services: prev.radiology_test_cart.services.filter((s) => s._id !== test._id),
          },
          amount: { ...prev.amount, total: newTotal, netTotal: net },
          due: due >= 0 ? due : 0,
        };
      }
    });
  };

  /* ---------- RENDER ---------- */
  return (
    <Suspense fallback={<Loading />}>
      <div className="flex flex-wrap w-full justify-between">
        <Tab tabs={TabLinks} category="Labtest" />
        <MiddleSection>
          <div className="w-full">
            <Heading heading="Update Labtest" />
            {loading && <Loading />}

            {/* ==== PATIENT INFO (EDITABLE) ==== */}
            <div className="w-full bg-gray-100 p-2 md:p-4 rounded-lg shadow-sm mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Full Name */}
                <div>
                  <label className="label"><span className="label-text font-semibold">Full Name</span></label>
                  <input
                    type="text"
                    name="fullname"
                    value={ServiceData.fullname}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="label"><span className="label-text font-semibold">Phone</span></label>
                  <input
                    type="text"
                    name="phone_number"
                    value={ServiceData.phone_number}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="label"><span className="label-text font-semibold">Gender</span></label>
                  <select
                    name="gender"
                    value={ServiceData.gender}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* DOB */}
                <div>
                  <label className="label"><span className="label-text font-semibold">DOB</span></label>
                  <input
                    type="date"
                    value={selectDob}
                    onChange={(e) => setSelectDob(e.target.value)}
                    className="input input-bordered w-full"
                  />
                </div>

                {/* Age (auto-calculated) */}
                <div>
                  <label className="label"><span className="label-text font-semibold">Age</span></label>
                  <input
                    type="text"
                    value={ServiceData.age}
                    readOnly
                    className="input input-bordered w-full bg-gray-50"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="label"><span className="label-text font-semibold">Address</span></label>
                  <input
                    type="text"
                    name="address"
                    value={ServiceData.address}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                  />
                </div>

                {/* Referred By */}
                <div>
                  <label className="label"><span className="label-text font-semibold">Referred By</span></label>
                  <input
                    type="text"
                    name="referr_by"
                    value={ServiceData.referr_by}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                  />
                </div>

                {/* Consultant */}
                <div>
                  <label className="label"><span className="label-text font-semibold">Consultant</span></label>
                  <Select
                    options={doctorOptions}
                    value={consultant}
                    onChange={setConsultant}
                    placeholder="Select Consultant"
                    isSearchable
                    className="basic-select"
                    classNamePrefix="select"
                    styles={{
                      control: (b) => ({
                        ...b,
                        border: "1px solid #000",
                        borderRadius: "0.375rem",
                        minHeight: "42px",
                      }),
                      menu: (b) => ({ ...b, zIndex: 9999 }),
                    }}
                  />
                </div>

                {/* Reporting Date */}
                <div>
                  <label className="label"><span className="label-text font-semibold">Reporting Date</span></label>
                  <input
                    type="date"
                    name="reporting_date"
                    value={ServiceData.reporting_date}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                  />
                </div>
              </div>
            </div>

            {/* ==== TESTS & CART ==== */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AVAILABLE TESTS */}
              <div className="space-y-4">
                <div className="w-full flex justify-between">
                  <h2 className="text-xl font-semibold">Available Tests</h2>
                  <div className="flex space-x-2">
                    <button
                      className={`${ToggleTest ? "btn-error text-white" : "btn-secondary"} btn`}
                      onClick={() => setToggleTest(true)}
                    >
                      Pathology
                    </button>
                    <button
                      className={`${!ToggleTest ? "btn-error text-white" : "btn-secondary"} btn`}
                      onClick={() => setToggleTest(false)}
                    >
                      Radiology
                    </button>
                  </div>
                </div>

                {ToggleTest ? (
                  <Select
                    options={categories?.data || []}
                    getOptionLabel={(option) => `${option.pathology_category} - ₹${option.pathology_charge}`}
                    getOptionValue={(option) => option._id}
                    onChange={(option) => option && addToCart(option, "pathology")}
                    placeholder="Search pathology tests..."
                    isSearchable
                    className="basic-select"
                    classNamePrefix="select"
                    styles={{
                      control: (b) => ({
                        ...b,
                        border: "1px solid #000",
                        borderRadius: "0.375rem",
                        minHeight: "42px",
                      }),
                      menu: (b) => ({ ...b, zIndex: 9999 }),
                    }}
                    maxMenuHeight={200}
                  />
                ) : (
                  <Select
                    options={radiologytest?.data || []}
                    getOptionLabel={(option) => `${option.test_name} - ₹${option.test_charge}`}
                    getOptionValue={(option) => option._id}
                    onChange={(option) => option && addToCart(option, "radiology")}
                    placeholder="Search radiology tests..."
                    isSearchable
                    className="basic-select"
                    classNamePrefix="select"
                    styles={{
                      control: (b) => ({
                        ...b,
                        border: "1px solid #000",
                        borderRadius: "0.375rem",
                        minHeight: "42px",
                      }),
                      menu: (b) => ({ ...b, zIndex: 9999 }),
                    }}
                    maxMenuHeight={200}
                  />
                )}
              </div>

              {/* CART & PAYMENT */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Test Cart</h2>

                {/* Pathology */}
                {ServiceData.pathology_test_cart.services.map((t, i) => (
                  <div
                    key={t._id || i}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border rounded gap-2"
                  >
                    <p className="font-semibold flex-1">{t.pathology_category}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-500">
                        ₹{Number(t.pathology_charge)}
                      </p>
                      <button
                        onClick={() => removeFromCart(t, "pathology")}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Radiology */}
                {ServiceData.radiology_test_cart.services.map((t, i) => (
                  <div
                    key={t._id || i}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border rounded gap-2"
                  >
                    <p className="font-semibold flex-1">{t.test_name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-500">
                        ₹{Number(t.test_charge)}
                      </p>
                      <button
                        onClick={() => removeFromCart(t, "radiology")}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* TOTALS */}
                <div className="border-t pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-lg">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-bold">
                        ₹{ServiceData.amount.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Net Total:</span>
                      <span className="font-bold text-green-600">
                        ₹{ServiceData.amount.netTotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Paid:</span>
                      <span className="font-bold text-blue-600">
                        ₹{ServiceData.total_paid.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Due:</span>
                      <span className="font-bold text-red-600">
                        ₹{ServiceData.due.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* DISCOUNT */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Discount (Alt+D)</span>
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        ref={discountRef}
                        type="number"
                        name="amount.discount"
                        value={ServiceData.amount.discount}
                        onChange={handleChange}
                        className="input input-bordered"
                        min={0}
                        step="0.01"
                      />
                      <span className="mx-2">or</span>
                      <input
                        type="number"
                        value={discountPercent}
                        onChange={handleDiscountPercentChange}
                        className="input input-bordered w-20"
                        min={0}
                        max={100}
                        step="0.01"
                      />
                      <span>%</span>
                    </div>
                  </div>

                  {/* ADD PAYMENT */}
                  <div className="space-y-2">
                    <h3 className="font-semibold">Add Payment</h3>
                    <div className="grid grid-cols-4 gap-2">
                      <input
                        type="number"
                        name="amount"
                        value={paymentInput.amount}
                        onChange={handlePaymentInputChange}
                        placeholder="Amount"
                        className="input input-bordered"
                        min={0}
                        step="0.01"
                      />
                      <select
                        name="mode"
                        value={paymentInput.mode}
                        onChange={handlePaymentInputChange}
                        className="select select-bordered"
                      >
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
                      <input
                        type="date"
                        name="date"
                        value={paymentInput.date}
                        onChange={handlePaymentInputChange}
                        className="input input-bordered"
                      />
                      <input
                        type="text"
                        name="remark"
                        value={paymentInput.remark}
                        onChange={handlePaymentInputChange}
                        placeholder="Remark"
                        className="input input-bordered"
                      />
                    </div>
                    <button onClick={addPayment} className="btn btn-success mt-2">
                      Add Payment
                    </button>
                  </div>

                  {/* PAYMENT LIST */}
                  <div className="space-y-2">
                    <h3 className="font-semibold">Payments</h3>
                    {ServiceData.payments.length === 0 && (
                      <p className="text-gray-500">No payments added.</p>
                    )}
                    {ServiceData.payments.map((p, i) => (
                      <div
                        key={i}
                        className="flex gap-2 items-center border p-2 rounded"
                      >
                        <span>₹{p.amount}</span>
                        <span>{p.mode}</span>
                        <span>{formatDate(p.date)}</span>
                        <span>{p.remark || "-"}</span>
                        <button
                          onClick={() => removePayment(i)}
                          className="btn btn-xs btn-error"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* SUBMIT */}
                  <button
                    onClick={handleSubmit}
                    className="btn btn-primary w-full mt-4"
                    disabled={
                      mutation.isPending ||
                      ServiceData.total_paid > ServiceData.amount.netTotal
                    }
                  >
                    {mutation.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <Spinner /> Submitting...
                      </span>
                    ) : (
                      "Submit"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </MiddleSection>
      </div>
    </Suspense>
  );
};

export default withAuth(UpdateLabrecord);
