"use client";

import DoctorForm from "@/components/component/services/Consultant";
import MedicineForm from "@/components/component/services/Medicine";
import AccessoryForm from "@/components/component/services/Accessory";
import ServiceForm from "@/components/component/services/ServiceCharge";
import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import Tab from "@/components/Tab";
import Spinner from "@/components/ui/Spinner";
import { getDate } from "@/lib/currentDate";
import { formatDate } from "@/lib/formateDate";
import { formattedTime } from "@/lib/timeGenerate";
import { fetchData, updateData } from "@/services/apiService";
import { withAuth } from "@/services/withAuth";
import { ErrorHandeling } from "@/utils/errorHandling";
import { SuccessHandling } from "@/utils/successHandling";
import { TabLinks } from "@/utils/tablinks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import React, {
  lazy,
  Suspense,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import toast from "react-hot-toast";
import { normalizeMedicineCart } from "@/lib/money";
import { hasPermission } from "@/lib/permissions";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const IpdService = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  const [BillDetails, setBillDetails] = useState({
    billing_time: "",
    billing_date: getDate(),
  });

  const [currentSectionIndex, setCurrentSectionIndex] = useState(-1);
  const [DoctorCharge, setDoctorCharge] = useState({ items: [], total: 0 });
  const [ServiceCharges, setServiceCharges] = useState({ items: [], total: 0 });
  const [MedicineCharge, setMedicineCharge] = useState({ items: [], total: 0 });
  const [AccessoryCharge, setAccessoryCharge] = useState({ items: [], total: 0 });

  const [TotalAmount, setTotalAmount] = useState({
    amount: {
      total: 0,
      discount: 0,
      netTotal: 0,
      paid: 0, // Existing total paid (fixed)
      due: 0,
    },
    paidby: "",
    paid_amount: 0, // New payment being added
  });

  // Refs for focusing components
  const sections = useRef([]);
  const paymentRef = useRef(null);
  const doctorRef = useRef(null);
  const serviceRef = useRef(null);
  const medicineRef = useRef(null);
  const accessoryRef = useRef(null);

  const handleChangeBillDetails = (e) => {
    const { name, value } = e.target;
    setBillDetails((prev) => ({ ...prev, [name]: value }));
  };

  const calculateTotals = useCallback(() => {
    const roundToTwo = (num) => Math.round(num * 100) / 100;

    const total = roundToTwo(
      roundToTwo(DoctorCharge.total || 0) +
        roundToTwo(ServiceCharges.total || 0) +
        roundToTwo(MedicineCharge.total || 0) +
        roundToTwo(AccessoryCharge.total || 0)
    );

    const discount = roundToTwo(TotalAmount.amount.discount || 0);
    const netTotal = roundToTwo(total - discount);

    // Calculate total paid (existing + new payment)
    const totalPaid = roundToTwo(
      TotalAmount.amount.paid + TotalAmount.paid_amount
    );
    const due = roundToTwo(netTotal - totalPaid);

    setTotalAmount((prev) => ({
      ...prev,
      amount: {
        ...prev.amount,
        total,
        discount,
        netTotal: netTotal >= 0 ? netTotal : 0,
        due: due >= 0 ? due : 0,
      },
    }));
  }, [
    DoctorCharge,
    ServiceCharges,
    MedicineCharge,
    AccessoryCharge,
    TotalAmount.amount.discount,
    TotalAmount.amount.paid,
    TotalAmount.paid_amount,
  ]);

  useEffect(() => {
    calculateTotals();
  }, [calculateTotals]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const roundToTwo = (num) => Math.round(num * 100) / 100;

    if (name === "paidby") {
      setTotalAmount((prev) => ({ ...prev, paidby: value }));
      return;
    }

    if (name === "paid_amount") {
      const parsedValue = parseFloat(value) || 0;
      const roundedValue = roundToTwo(parsedValue);
      setTotalAmount((prev) => ({ ...prev, paid_amount: roundedValue }));
      return;
    }

    // Handle amount fields (only discount in this case)
    const parsedValue = parseFloat(value) || 0;
    const roundedValue = roundToTwo(parsedValue);
    setTotalAmount((prev) => ({
      ...prev,
      amount: { ...prev.amount, [name]: roundedValue },
    }));
  };

  const handleGetPatient = async () => {
    if (!searchTerm) return;
    try {
      setLoading(true);
      const { data } = await fetchData(`/billing/${searchTerm}`);
      if (data) {
        setFormData(data);
        setDoctorCharge(data?.consultant_cart || { items: [], total: 0 });
        setServiceCharges(data?.service_cart || { items: [], total: 0 });
        setMedicineCharge(normalizeMedicineCart(data?.medicine_cart));
        setAccessoryCharge(normalizeMedicineCart(data?.accessory_cart));
        setBillDetails({
          billing_date: data?.billing_date || getDate(),
          billing_time: data?.billing_time,
        });

        setTotalAmount({
          amount: {
            total: data?.amount?.total || 0,
            discount: data?.amount?.discount || 0,
            netTotal: data?.amount?.netTotal || 0,
            paid: data?.amount?.paid || 0, // Set existing paid amount
            due: data?.amount?.due || 0,
          },
          paidby: data?.paidby || "",
          paid_amount: 0, // Reset new payment amount
        });
      }
    } catch (error) {
      ErrorHandeling(error);
    } finally {
      setLoading(false);
    }
  };

  const mutationUpdateEstimate = useMutation({
    mutationFn: (newItem) => updateData("/billing", searchTerm, newItem),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ipdestimate", searchTerm] });
      router.push(`/ipd/estimateprint/${searchTerm}`);
      SuccessHandling(data.message);
    },
    onError: (error) => {
      ErrorHandeling(error);
    },
  });

  const mutationUpdateBilling = useMutation({
    mutationFn: (newItem) => updateData("/billing", searchTerm, newItem),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ipdbilling", searchTerm] });
      router.push(`/ipd/billprint/${searchTerm}`);
      SuccessHandling(data.message);
    },
    onError: (error) => {
      ErrorHandeling(error);
    },
  });

  const handleSubmitEstimate = useCallback(
    async (e) => {
      if (e) e.preventDefault();
      mutationUpdateEstimate.mutate({
        billing_date: BillDetails.billing_date,
        consultant_cart: DoctorCharge,
        service_cart: ServiceCharges,
        medicine_cart: MedicineCharge,
        accessory_cart: AccessoryCharge,
        amount: {
          ...TotalAmount.amount,
          paid: TotalAmount.amount.paid + TotalAmount.paid_amount, // Update total paid
        },
        paid_amount: TotalAmount.paid_amount,
        payment_date: getDate(),
        paidby: TotalAmount.paidby,
      });
    },
    [DoctorCharge, ServiceCharges, MedicineCharge, AccessoryCharge, TotalAmount]
  );

  const handleSubmitBill = useCallback(
    async (e) => {
      if (e) e.preventDefault();
      if (!TotalAmount.paidby) {
        toast.error("Please select a payment method");
        return;
      }
      if (window.confirm("Are you sure you want to save this bill?")) {
        mutationUpdateBilling.mutate({
          ...BillDetails,
          ipd: formData?.ipd,
          patient: formData?.patient,
          bill_no: formData?.bill_no,
          consultant_cart: DoctorCharge,
          service_cart: ServiceCharges,
          medicine_cart: MedicineCharge,
          accessory_cart: AccessoryCharge,
          amount: {
            ...TotalAmount.amount,
            paid: TotalAmount.amount.paid + TotalAmount.paid_amount, // Update total paid
          },
          paid_amount: TotalAmount.paid_amount,
          payment_date: getDate(),
          paidby: TotalAmount.paidby,
          isDone: true,
        });
      }
    },
    [
      TotalAmount,
      BillDetails,
      formData,
      DoctorCharge,
      ServiceCharges,
      MedicineCharge,
      AccessoryCharge,
      mutationUpdateBilling,
    ]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey) {
        switch (e.key) {
          case "1":
            e.preventDefault();
            doctorRef.current?.focus();
            break;
          case "2":
            e.preventDefault();
            doctorRef.current?.focus();
            break;
          case "3":
            e.preventDefault();
            serviceRef.current?.focus();
            break;
          case "4":
            e.preventDefault();
            medicineRef.current?.focus();
            break;
          default:
            break;
        }
      } else if (e.key === "F5") {
        e.preventDefault();
        handleSubmitEstimate();
      } else if (e.key === "F6") {
        e.preventDefault();
        handleSubmitBill();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSubmitEstimate, handleSubmitBill]);

  useEffect(() => {
    sections.current = [doctorRef, serviceRef, medicineRef, paymentRef];
  }, []);

  const handleKeyNavigation = useCallback((e) => {
    const activeElement = document.activeElement;
    const isInput = ["INPUT", "SELECT", "TEXTAREA"].includes(
      activeElement.tagName
    );

    if (isInput) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCurrentSectionIndex((prev) => {
        const next = prev >= sections.current.length - 1 ? 0 : prev + 1;
        sections.current[next]?.current?.focus();
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCurrentSectionIndex((prev) => {
        const next = prev <= 0 ? sections.current.length - 1 : prev - 1;
        sections.current[next]?.current?.focus();
        return next;
      });
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyNavigation);
    return () => window.removeEventListener("keydown", handleKeyNavigation);
  }, [handleKeyNavigation]);

  return (
    <>
      <Suspense fallback={<Loading />}>
        <Tab tabs={TabLinks} category="IPD" />
        <div className="flex flex-wrap w-full justify-between">
          <MiddleSection>
            <div className="w-full space-y-8">
              <Heading heading="Service">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter REGID"
                    className="border p-2 rounded w-full sm:w-auto"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button
                    onClick={handleGetPatient}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    disabled={loading}
                  >
                    {loading ? <Spinner /> : "Search"}
                  </button>
                </div>
              </Heading>

              {/* Patient Info Card */}
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body p-4 md:p-6">
                  <h1 className="card-title text-2xl truncate mb-4">
                    {formData?.patient?.fullname || "Patient Not Found"}
                    <span className="text-sm font-normal ml-2">
                      {formData?.mrd_id && `UHID: ${formData?.mrd_id}`}
                    </span>
                  </h1>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="text-gray-500">REGID</div>
                      <div className="font-mono">{formData?.reg_id || "-"}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-gray-500">Bill No.</div>
                      <div className="font-mono">
                        {formData?.bill_no || "-"}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-gray-500">Age</div>
                      <div>{formData?.patient?.age || "-"}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-gray-500">Admit Date</div>
                      <div>
                        {formData?.ipd?.admit_date
                          ? `${formatDate(formData?.ipd?.admit_date)} ${
                              formData?.ipd?.admit_time
                            }`
                          : "-"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {loading && <Loading />}

              {/* Service Sections */}
              <div className="space-y-8">
                <section
                  className="card bg-base-100 shadow-sm"
                  onFocus={() => setCurrentSectionIndex(0)}
                >
                  <div className="card-body p-4 md:p-6">
                    <h2 className="card-title text-lg mb-4 border-b pb-2">
                      Doctor Charges
                    </h2>
                    <DoctorForm
                      ref={doctorRef}
                      DoctorCharge={DoctorCharge}
                      setDoctorCharge={setDoctorCharge}
                    />
                  </div>
                </section>

                <section
                  className="card bg-base-100 shadow-sm"
                  onFocus={() => setCurrentSectionIndex(1)}
                >
                  <div className="card-body p-4 md:p-6">
                    <h2 className="card-title text-lg mb-4 border-b pb-2">
                      Service Charges
                    </h2>
                    <ServiceForm
                      ref={serviceRef}
                      ServiceCharges={ServiceCharges}
                      setServiceCharges={setServiceCharges}
                    />
                  </div>
                </section>

                <section
                  className="card bg-base-100 shadow-sm"
                  onFocus={() => setCurrentSectionIndex(2)}
                >
                  <div className="card-body p-4 md:p-6">
                    <h2 className="card-title text-lg mb-4 border-b pb-2">
                      Medicine &amp; Accessory Charges
                    </h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <MedicineForm
                        ref={medicineRef}
                        MedicineCharge={MedicineCharge}
                        setMedicineCharge={setMedicineCharge}
                      />
                      <AccessoryForm
                        ref={accessoryRef}
                        AccessoryCharge={AccessoryCharge}
                        setAccessoryCharge={setAccessoryCharge}
                      />
                    </div>
                  </div>
                </section>
              </div>

              {/* Payment Section */}
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body p-4 md:p-6 space-y-6">
                  <div
                    onFocus={() => setCurrentSectionIndex(3)}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <div className="space-y-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Discount</span>
                        </label>
                        <input
                          type="number"
                          ref={paymentRef}
                          name="discount"
                          value={TotalAmount?.amount?.discount}
                          onChange={handleChange}
                          className="input input-bordered"
                        />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Payment Method</span>
                        </label>
                        <select
                          name="paidby"
                          value={TotalAmount?.paidby}
                          onChange={handleChange}
                          className="select select-bordered w-full"
                        >
                          <option value="">Select Payment Method</option>
                          <option value="Cash">Cash</option>
                          <option value="Upi">UPI</option>
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

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Total Paid</span>
                          </label>
                          <input
                            type="number"
                            name="paid"
                            value={TotalAmount?.amount?.paid}
                            onChange={handleChange}
                            disabled={session?.user?.role != "Admin"}
                            className="input input-bordered bg-gray-100"
                          />
                        </div>
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Paid Amount</span>
                          </label>
                          <input
                            type="number"
                            name="paid_amount"
                            value={TotalAmount?.paid_amount}
                            onChange={handleChange}
                            className="input input-bordered"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Billing Date</span>
                          </label>
                          <input
                            type="date"
                            name="billing_date"
                            value={BillDetails?.billing_date}
                            onChange={handleChangeBillDetails}
                            className="input input-bordered"
                          />
                        </div>
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Billing Time</span>
                          </label>
                          <input
                            type="text"
                            name="billing_time"
                            value={BillDetails?.billing_time}
                            onChange={handleChangeBillDetails}
                            className="input input-bordered"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="divider"></div>

                  <div className="grid grid-cols-2 gap-4 text-lg">
                    <div className="flex justify-between items-center">
                      <span>Total:</span>
                      <span className="font-bold">
                        ₹{TotalAmount?.amount?.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Net Total:</span>
                      <span className="font-bold text-green-600">
                        ₹{TotalAmount?.amount?.netTotal?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Due:</span>
                      <span className="font-bold text-red-600">
                        ₹{TotalAmount?.amount?.due?.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 justify-end">
                    {hasPermission(session?.user, "ipd_billing", "finalize") && (
                      <button
                        onClick={handleSubmitBill}
                        className="btn btn-warning md:w-64"
                      >
                        <span>Save Bill </span>
                        <kbd className="kbd kbd-sm">F6</kbd>
                        {mutationUpdateBilling.isPending && <Spinner />}
                      </button>
                    )}
                    {hasPermission(session?.user, "ipd_billing", "edit") && (
                      <button
                        onClick={handleSubmitEstimate}
                        className="btn btn-primary md:w-64"
                      >
                        <span>Get Estimate </span>
                        <kbd className="kbd kbd-sm">F5</kbd>
                        {mutationUpdateEstimate.isPending && <Spinner />}
                      </button>
                    )}
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

export default withAuth(IpdService);
