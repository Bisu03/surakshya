"use client";

import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import Tab from "@/components/Tab";
import Spinner from "@/components/ui/Spinner";
import { getDate } from "@/lib/currentDate";
import { formatDate } from "@/lib/formateDate";
import { fetchData, updateData } from "@/services/apiService";
import { withAuth } from "@/services/withAuth";
import { ErrorHandeling } from "@/utils/errorHandling";
import { SuccessHandling } from "@/utils/successHandling";
import { TabLinks } from "@/utils/tablinks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import React, { lazy, Suspense, useState, useCallback } from "react";
import toast from "react-hot-toast";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const PatientAdvance = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  // Carts, discount and paidby are fetched from the existing bill and echoed
  // back unchanged on submit, so recording an advance never wipes real charges.
  const [carts, setCarts] = useState({
    consultant_cart: undefined,
    service_cart: undefined,
    medicine_cart: undefined,
  });
  const [discount, setDiscount] = useState(0);
  const [paidby, setPaidby] = useState("");

  // Historical advances (already on the bill) are read-only here; only newly
  // added advances in this session are deletable and counted as the new payment.
  const [historicalAdvances, setHistoricalAdvances] = useState([]);
  const [sessionAdvances, setSessionAdvances] = useState([]);
  const [newAdvance, setNewAdvance] = useState({
    date: getDate(),
    amount: "",
    method: "",
  });

  const advances = [...historicalAdvances, ...sessionAdvances];
  const advancesTotal = advances.reduce(
    (sum, a) => sum + (Number(a.amount) || 0),
    0
  );
  const newAdvanceAmount = sessionAdvances.reduce(
    (sum, a) => sum + (Number(a.amount) || 0),
    0
  );

  const handleGetPatient = async () => {
    if (!searchTerm) return;
    try {
      setLoading(true);
      const { data } = await fetchData(`/billing/${searchTerm}`);
      if (data) {
        setFormData(data);
        setHistoricalAdvances(data.advances || []);
        setSessionAdvances([]);
        setCarts({
          consultant_cart: data?.consultant_cart,
          service_cart: data?.service_cart,
          medicine_cart: data?.medicine_cart,
        });
        setDiscount(data?.amount?.discount || 0);
        setPaidby(data?.paidby || "");
      }
    } catch (error) {
      ErrorHandeling(error);
    } finally {
      setLoading(false);
    }
  };

  const addAdvance = () => {
    if (!newAdvance.amount || !newAdvance.method) {
      toast.error("Please fill all fields");
      return;
    }

    const advance = {
      ...newAdvance,
      amount: parseFloat(newAdvance.amount),
      date: newAdvance.date || getDate(),
    };

    setSessionAdvances((prev) => [...prev, advance]);
    setNewAdvance({ date: getDate(), amount: "", method: "" });
  };

  const deleteAdvance = (index) => {
    setSessionAdvances((prev) => prev.filter((_, i) => i !== index));
  };

  const mutationUpdateEstimate = useMutation({
    mutationFn: (newItem) => updateData("/billing", searchTerm, newItem),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ipdestimate", searchTerm] });
      router.push(`/ipd/printadvance/${searchTerm}`);
      SuccessHandling(data.message);
    },
    onError: (error) => {
      ErrorHandeling(error);
    },
  });

  const handleSubmitEstimate = useCallback(
    async (e) => {
      if (e) e.preventDefault();
      if (newAdvanceAmount <= 0) {
        toast.error("Add at least one new advance before submitting");
        return;
      }
      mutationUpdateEstimate.mutate({
        advances,
        consultant_cart: carts.consultant_cart,
        service_cart: carts.service_cart,
        medicine_cart: carts.medicine_cart,
        amount: { discount },
        paid_amount: newAdvanceAmount,
        paidby,
        payment_date: getDate(),
      });
    },
    [advances, carts, discount, paidby, newAdvanceAmount, mutationUpdateEstimate]
  );

  return (
    <Suspense fallback={<Loading />}>
      <Tab tabs={TabLinks} category="IPD" />
      <div className="flex flex-wrap w-full justify-between">
        <MiddleSection>
          <div className="w-full space-y-8">
            <Heading heading="Patient Advance Management">
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

            {formData?.patient && (
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body p-4 md:p-6">
                  <h1 className="card-title text-2xl truncate mb-4">
                    {formData?.patient?.fullname}
                    <span className="text-sm font-normal ml-2">
                      {formData?.mrd_id && `UHID: ${formData?.mrd_id}`}
                    </span>
                    <span className="text-sm font-normal ml-2">
                      {formData?.reg_id && `REGID: ${formData?.reg_id}`}
                    </span>
                  </h1>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="text-gray-500">Total Advance</div>
                      <div className="font-bold text-green-600">
                        ₹{advancesTotal}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="card bg-base-100 shadow-sm">
              <div className="card-body p-4 md:p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="date"
                    value={newAdvance.date}
                    onChange={(e) =>
                      setNewAdvance((p) => ({ ...p, date: e.target.value }))
                    }
                    className="input input-bordered"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={newAdvance.amount}
                    onChange={(e) =>
                      setNewAdvance((p) => ({ ...p, amount: e.target.value }))
                    }
                    className="input input-bordered"
                  />
                  <select
                    value={newAdvance.method}
                    onChange={(e) =>
                      setNewAdvance((p) => ({ ...p, method: e.target.value }))
                    }
                    className="select select-bordered"
                  >
                    <option value="">Payment Method</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
                <button
                  onClick={addAdvance}
                  className="btn btn-primary w-full md:w-auto"
                >
                  Add Advance
                </button>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm">
              <div className="card-body p-4 md:p-6">
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr className="bg-gray-100">
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historicalAdvances.map((advance, index) => (
                        <tr key={`historical-${index}`}>
                          <td>{formatDate(advance.date)}</td>
                          <td>₹{advance?.amount}</td>
                          <td>{advance?.method}</td>
                          <td>
                            <span className="badge badge-ghost badge-sm">
                              Recorded
                            </span>
                          </td>
                          <td>-</td>
                        </tr>
                      ))}
                      {sessionAdvances.map((advance, index) => (
                        <tr key={`session-${index}`}>
                          <td>{formatDate(advance.date)}</td>
                          <td>₹{advance?.amount}</td>
                          <td>{advance?.method}</td>
                          <td>
                            <span className="badge badge-info badge-sm">
                              New
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => deleteAdvance(index)}
                              className="btn btn-error btn-sm"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {advances.length === 0 && (
                        <tr>
                          <td colSpan="5" className="text-center py-4">
                            No advances recorded
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end mt-6 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">New Advance:</span>
                    <span className="text-xl text-green-600">
                      ₹{newAdvanceAmount}
                    </span>
                  </div>
                  <button
                    onClick={handleSubmitEstimate}
                    className="btn btn-success"
                    disabled={newAdvanceAmount <= 0}
                  >
                    {mutationUpdateEstimate.isPending ? (
                      <Spinner />
                    ) : (
                      "Submit Advances & Print"
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

export default withAuth(PatientAdvance);
