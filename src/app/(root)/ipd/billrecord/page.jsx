"use client";
import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import Tab from "@/components/Tab";
import Spinner from "@/components/ui/Spinner";
import { getDate } from "@/lib/currentDate";
import { formatDate } from "@/lib/formateDate";
import { deleteData, fetchData } from "@/services/apiService";
import { withAuth } from "@/services/withAuth";
import { ErrorHandeling } from "@/utils/errorHandling";
import { SuccessHandling } from "@/utils/successHandling";
import { TabLinks } from "@/utils/tablinks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { FaEdit, FaFileExcel, FaPrint } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { useReactToPrint } from "react-to-print";
import * as XLSX from "xlsx";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const IpdBillRecord = () => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const contentRef = useRef(null);

  const [billNo, setBillNo] = useState("");
  const [startDate, setStartDate] = useState(getDate());
  const [endDate, setEndDate] = useState(getDate());
  const [selectedPaidBy, setSelectedPaidBy] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [billNo, startDate, endDate, selectedPaidBy]); // Add selectedPaidBy to dependencies

  // Update API call
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["billingrecord"],
    queryFn: () =>
      fetchData(
        `/billing?search=${debouncedSearch}&billNo=${billNo}&startDate=${startDate}&endDate=${endDate}&paidby=${selectedPaidBy}`
      ),
  });

  useEffect(() => {
    refetch();
  }, [debouncedSearch, startDate, endDate, selectedPaidBy]);

  const deleteMutation = useMutation({
    mutationFn: ({ id, ipd_id }) =>
      deleteData(`/billing`, `${id}?ipd=${ipd_id} `),

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["billingrecord"] });
      SuccessHandling(data.message);
      refetch();
    },
    onError: (error) => {
      ErrorHandeling(error);
      console.error("Error deleting bill:", error);
    },
  });

  const handleDelete = (id, ipd_id) => {
    deleteMutation.mutate({ id, ipd_id });
  };

  // Calculate totals
  const totalBills = data?.data?.length || 0;
  const totalAmount =
    data?.data?.reduce((acc, bill) => acc + (bill?.amount?.total || 0), 0) || 0;
  const totalDiscount =
    data?.data?.reduce((acc, bill) => acc + (bill?.amount?.discount || 0), 0) ||
    0;
  const totalPayable =
    data?.data?.reduce((acc, bill) => acc + (bill?.amount?.netTotal || 0), 0) ||
    0;
  const totalPaid =
    data?.data?.reduce(
      (acc, bill) =>
        acc + ((bill?.amount?.netTotal || 0) - (bill?.amount?.due || 0)),
      0
    ) || 0;
  const totalDue =
    data?.data?.reduce((acc, bill) => acc + (bill?.amount?.due || 0), 0) || 0;

  const handlePrint = useReactToPrint({ contentRef });
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      data.data.map((bill) => ({
        "Bill No": bill.bill_no,
        "Patient Name": bill.patient?.fullname,
        "UHID": bill.mrd_id,
        "REGID": bill.reg_id,
        "Billing Date": bill.billing_date,
        "Total Amount": bill.amount.total,
        Discount: bill.amount.discount,
        "Payable Amount": bill.amount.netTotal,
        "Amount Due": bill.amount.due,
        "Paid ": bill.amount.paid,
        "Paid By": bill.paidby,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Billing Records");
    XLSX.writeFile(workbook, `Billing_Records_${startDate}_${endDate}.xlsx`);
  };

  return (
    <>
      <Suspense fallback={<Loading />}>
        <div className="flex flex-wrap w-full justify-between">
          <Tab tabs={TabLinks} category="IPD" />
          <MiddleSection>
            <div className="w-full">
              <Heading heading="Billing Records">
                <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
                  {/* Existing filters */}
                  <input
                    className="py-2 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    type="text"
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                    placeholder="Bill Number"
                  />

                  {/* Payment method filter */}
                  <select
                    className="py-2 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    value={selectedPaidBy}
                    onChange={(e) => setSelectedPaidBy(e.target.value)}
                  >
                    <option value="">All Payment Methods</option>
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
                    <option value="Due">Due</option>
                  </select>

                  {/* Date filters */}
                  <div className="flex space-x-2">
                    <input
                      type="date"
                      className="border rounded-lg px-4 py-2"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <input
                      type="date"
                      className="border rounded-lg px-4 py-2"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </Heading>
              {isLoading && <Loading />}

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4 print-hidden">
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <h3 className="text-sm font-semibold text-gray-600">
                    Total Bills
                  </h3>
                  <p className="text-2xl font-bold text-primary">
                    {totalBills}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <h3 className="text-sm font-semibold text-gray-600">
                    Total Amount
                  </h3>
                  <p className="text-2xl font-bold text-primary">
                    ₹{totalAmount.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <h3 className="text-sm font-semibold text-gray-600">
                    Total Discount
                  </h3>
                  <p className="text-2xl font-bold text-primary">
                    ₹{totalDiscount.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <h3 className="text-sm font-semibold text-gray-600">
                    Total Payable
                  </h3>
                  <p className="text-2xl font-bold text-primary">
                    ₹{totalPayable.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <h3 className="text-sm font-semibold text-gray-600">
                    Total Paid
                  </h3>
                  <p className="text-2xl font-bold text-primary">
                    ₹{totalPaid.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <h3 className="text-sm font-semibold text-gray-600">
                    Total Due
                  </h3>
                  <p className="text-2xl font-bold text-primary">
                    ₹{totalDue.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Add export buttons */}
              <div className="flex w-full justify-end gap-2 mb-4 print-hidden">
                <button
                  onClick={exportToExcel}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <FaFileExcel className="text-xl" />
                  Export Excel
                </button>
                <button
                  onClick={handlePrint}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <FaPrint className="text-xl" />
                  Print Report
                </button>
              </div>

              <div className="overflow-x-auto">
                <table ref={contentRef} className="w-full">
                  <thead>
                    <tr className="bg-secondary text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <th className="px-4 py-3">Bill No</th>
                      <th className="px-4 py-3">Patient Name</th>
                      <th className="px-4 py-3">UHID</th>
                      <th className="px-4 py-3">REGID</th>
                      <th className="px-4 py-3">Billing Date</th>
                      <th className="px-4 py-3">Total Amount</th>
                      <th className="px-4 py-3">Discount</th>
                      <th className="px-4 py-3">Payable Amount</th>
                      <th className="px-4 py-3">Amount Due</th>
                      <th className="px-4 py-3">Amount Paid</th>
                      <th className="px-4 py-3">Paid By</th>
                      <th className="px-4 py-3">Billing Statue</th>
                      <th className="px-4 py-3 print:hidden">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data?.data?.map((bill) => (
                      <tr key={bill._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{bill?.bill_no}</td>
                        <td className="px-4 py-3">{bill?.patient?.fullname}</td>
                        <td className="px-4 py-3">{bill?.mrd_id}</td>
                        <td className="px-4 py-3">{bill?.reg_id}</td>
                        <td className="px-4 py-3">
                          {formatDate(bill?.billing_date)}
                        </td>
                        <td className="px-4 py-3">
                          ₹{bill?.amount?.total?.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          ₹{bill?.amount?.discount?.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          ₹{bill?.amount?.netTotal?.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          ₹{bill?.amount?.due?.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">₹{bill.amount.paid || 0}</td>
                        <td className="px-4 py-3">{bill?.paidby}</td>
                        <td className="px-4 py-3">
                          {bill?.isDone ? (
                            <span className="text-green-600">Done</span>
                          ) : (
                            <span className="text-red-600">Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-3 space-x-2 flex print:hidden">
                          {bill?.isDone ? (
                            <Link
                              href={`/ipd/billprint/${bill.reg_id}`}
                              className="btn btn-primary"
                            >
                              <FaPrint />
                            </Link>
                          ) : (
                            <Link
                              href={`/ipd/estimateprint/${bill.reg_id}`}
                              className="btn btn-primary"
                            >
                              <FaPrint />
                            </Link>
                          )}
                          {session?.user?.role === "Admin" && (
                            <button
                              onClick={() => handleDelete(bill._id, bill.ipd)}
                              className="btn btn-error"
                            >
                              <MdDelete />
                              {deleteMutation?.isPending && <Spinner />}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </MiddleSection>
        </div>
      </Suspense>
    </>
  );
};

export default withAuth(IpdBillRecord);
