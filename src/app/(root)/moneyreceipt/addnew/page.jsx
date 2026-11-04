"use client";

import DoctorForm from "@/components/component/services/Consultant";
import MedicineForm from "@/components/component/services/Medicine";
import ServiceForm from "@/components/component/services/ServiceCharge";
import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import Tab from "@/components/Tab";
import PrintUi from "@/components/ui/PrintUi";
import Spinner from "@/components/ui/Spinner";
import { getDate } from "@/lib/currentDate";
import { formatDate } from "@/lib/formateDate";
import { amountToWords } from "@/lib/numberToWord";
import { createData, fetchData, updateData } from "@/services/apiService";
import { withAuth } from "@/services/withAuth";
import { ErrorHandeling } from "@/utils/errorHandling";
import { SuccessHandling } from "@/utils/successHandling";
import { TabLinks } from "@/utils/tablinks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, {
  lazy,
  Suspense,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import toast from "react-hot-toast";
import { useReactToPrint } from "react-to-print";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const MoneyReceipt = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const contentRef = useRef(null);
  const [AdmitType, setAdmitType] = useState("NEW");

  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    reg_id: "",
    mrd_id: "",
    paidby: "",
    billing: "",
    billing_date: "",
    billing_time: "",
    amount: "",
  });
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const submittingRef = useRef(false);
  const [ReceiptNo, setReceiptNo] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGetPatient = async () => {
    try {
      setLoading(true);
      const { data } = await fetchData(`/billing/${searchTerm}`);
      if (data) {
        setFormData({
          fullname: data?.patient?.fullname,
          age: data?.patient?.age,
          admit_date: data?.ipd?.admit_date,
          admit_time: data?.ipd?.admit_time,
          reg_id: data?.reg_id,
          mrd_id: data?.mrd_id,
          paidby: data?.paidby,
          billing: data?._id,
          patient: data?.patient?._id,
          billing_date: data?.billing_date,
          billing_time: data?.billing_time,
          amount: data?.amount?.netTotal,
        });
      }
      setLoading(false);
    } catch (error) {
      ErrorHandeling(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptDetails = async () => {
    try {
      setLoading(true);
      const { data } = await fetchData(`/moneyreceipt/${ReceiptNo}`);
      console.log(data);

      if (data) {
        setFormData({
          fullname: data?.patient?.fullname,
          age: data?.patient?.age,
          bill_no: data?.billing?.bill_no,
          admit_date: data?.admit_date,
          admit_time: data?.admit_time,
          reg_id: data?.reg_id,
          mrd_id: data?.mrd_id,
          paidby: data?.paidby,
          billing_date: data?.billing_date,
          billing_time: data?.billing_time,
          amount: data?.amount,
          isEditing: true,
        });
      }
      setLoading(false);
    } catch (error) {
      ErrorHandeling(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Synchronous re-entrancy guard: blocks F5 key-repeat / double-click bursts
    // from firing multiple POSTs and consuming multiple receipt numbers.
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsLoading(true);
    try {
      const { data } = await createData("/moneyreceipt", {
        ...formData,
      });
      SuccessHandling("Receipt Generate Succesfully");
      router.push(`/moneyreceipt/print/${data?.rec_no}`);
    } catch (error) {
      ErrorHandeling(error);
    } finally {
      submittingRef.current = false;
      setIsLoading(false);
    }
    // mutation.mutate({ ...formData, consultant: consultant.value._id });
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

  const mutation = useMutation({
    mutationFn: (newRecord) =>
      updateData("/moneyreceipt", ReceiptNo, newRecord),
    onSuccess: (data) => {
      queryClient.invalidateQueries(["moneyReceipts"]);
      SuccessHandling(data.message);
    },
    onError: (error) => ErrorHandeling(error),
  });

  const handleUpdate = () => {
    mutation.mutate({ ...formData });
  };

  return (
    <>
      <Suspense fallback={<Loading />}>
        <Tab tabs={TabLinks} category="IPD" />
        <div className="flex flex-wrap w-full justify-between">
          <MiddleSection>
            <div className="w-full space-y-8">
              <Heading heading="Money Receipt">
                <div className="flex gap-2">
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
                        placeholder="Enter REGID"
                        className="p-2 border rounded w-full md:w-48"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <button
                        onClick={handleGetPatient}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 w-full md:w-auto"
                        disabled={loading}
                      >
                        {loading ? <Spinner /> : "Search"}
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Enter Receipt No."
                        className="p-2 border rounded w-full md:w-48"
                        value={ReceiptNo}
                        onChange={(e) => setReceiptNo(e.target.value)}
                      />
                      <button
                        onClick={handleReceiptDetails}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 w-full md:w-auto"
                        disabled={loading}
                      >
                        {loading ? <Spinner /> : "Get"}
                      </button>
                    </>
                  )}
                </div>
              </Heading>

              {/* Patient Info Card */}
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body p-4 md:p-6">
                  <h1 className="card-title text-2xl truncate mb-4">
                    {formData?.fullname || "Patient Not Found"}
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
                      <div>{formData?.age || "-"}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-gray-500">Admit Date</div>
                      <div>
                        {formData?.admit_date
                          ? `${formatDate(formData?.admit_date)} ${
                              formData?.admit_time
                            }`
                          : "-"}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-gray-500">Discharge Date</div>
                      <div>
                        {formData?.billing_date
                          ? `${formatDate(formData?.billing_date)} ${
                              formData?.billing_time
                            }`
                          : "-"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {loading && <Loading />}

              <div className="card bg-base-100 shadow-sm">
                <div className="card-body p-4 md:p-6 space-y-6">
                  <div
                    onFocus={() => setCurrentSectionIndex(3)}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <div className="space-y-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Payment Method</span>
                        </label>
                        <select
                          name="paidby"
                          value={formData.paidby}
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
                            <span className="label-text">Billing Date</span>
                          </label>
                          <input
                            type="date"
                            name="billing_date"
                            value={formData?.billing_date}
                            onChange={handleChange}
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
                            value={formData?.billing_time}
                            onChange={handleChange}
                            className="input input-bordered"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Total Amount</span>
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={formData?.amount}
                      onChange={handleChange}
                      className="input input-bordered"
                    />
                  </div>

                  <div className="flex w-full justify-end">
                    <button
                      onClick={() => setServiceData(initialServiceState)}
                      className="btn btn-primary  mt-4 py-2 mr-2"
                    >
                      Clear
                    </button>
                    {formData?.isEditing ? (
                      <button
                        onClick={handleUpdate}
                        className="btn btn-primary  mt-4 py-2"
                      >
                        Update
                        {mutation?.isPending && <Spinner />}
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="btn btn-primary  mt-4 py-2"
                      >
                        Submit <kbd className="kbd kbd-sm">F5</kbd>{" "}
                        {isLoading && <Spinner />}
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

export default withAuth(MoneyReceipt);
