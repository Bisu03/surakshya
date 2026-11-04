"use client";

import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import Tab from "@/components/Tab";
import Spinner from "@/components/ui/Spinner";
import { getDate } from "@/lib/currentDate";
import { deleteData, fetchData } from "@/services/apiService";
import { withAuth } from "@/services/withAuth";
import { ErrorHandeling } from "@/utils/errorHandling";
import { SuccessHandling } from "@/utils/successHandling";
import { TabLinks } from "@/utils/tablinks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { FaFileExcel, FaPrint } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { useReactToPrint } from "react-to-print";
import * as XLSX from "xlsx";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const MoneyReceiptRecord = () => {
  const queryClient = useQueryClient();
  const contentRef = useRef(null);
  const [startDate, setStartDate] = useState(getDate());
  const [endDate, setEndDate] = useState(getDate());
  const { data: session } = useSession();

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["moneyReceipts", startDate, endDate],
    queryFn: () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      return fetchData(`/moneyreceipt?${params.toString()}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteData("/moneyreceipt/", id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["moneyReceipts"] });
      SuccessHandling(data.message);
      refetch();
    },
    onError: (error) => {
      ErrorHandeling(error);
    },
  });

  const handleClearFilters = () => {
    setStartDate(getDate());
    setEndDate(getDate());
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      data?.data?.map((receipt) => ({
        "Receipt No": receipt?.rec_no,
        "UHID": receipt?.mrd_id,
        "Patient Name": receipt?.patient?.fullname,
        "Billing Date": receipt?.billing_date,
        "Billing Time": receipt?.billing_time,
        Amount: receipt?.amount,
        "Payment Method": receipt?.paidby,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Money Receipts");
    XLSX.writeFile(workbook, `Money_Receipts_${startDate}_${endDate}.xlsx`);
  };

  const handlePrint = useReactToPrint({ contentRef });

  const totalReceipts = data?.data?.length || 0;
  const totalAmount =
    data?.data?.reduce((acc, receipt) => acc + (receipt?.amount || 0), 0) || 0;

  return (
    <>
      <Suspense fallback={<Loading />}>
        <div className="flex flex-wrap w-full justify-between">
          <Tab tabs={TabLinks} category="IPD" />
          <MiddleSection>
            <div className="w-full">
              <Heading heading="Money Receipt Records">
                <div className="flex flex-wrap w-full justify-end items-center gap-2 sm:gap-4">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border p-2 rounded w-full sm:w-auto"
                  />
                  <span className="hidden sm:inline">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border p-2 rounded w-full sm:w-auto"
                    min={startDate}
                  />
                  <button
                    onClick={handleClearFilters}
                    className="bg-secondary px-4 py-2 rounded hover:bg-gray-300 w-full sm:w-auto"
                  >
                    Clear Filters
                  </button>
                </div>
              </Heading>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 print-hidden">
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <h3 className="text-sm font-semibold text-gray-600">
                    Total Receipts
                  </h3>
                  <p className="text-2xl font-bold text-primary">
                    {totalReceipts}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <h3 className="text-sm font-semibold text-gray-600">
                    Total Amount
                  </h3>
                  <p className="text-2xl font-bold text-primary">
                    ₹{totalAmount.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md flex items-center justify-center gap-2">
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
                    Export PDF/Print
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table ref={contentRef} className="w-full">
                  <thead>
                    <tr className="bg-secondary text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <th className="px-4 py-3">Receipt No</th>
                      <th className="px-4 py-3">UHID</th>
                      <th className="px-4 py-3">Patient Name</th>
                      <th className="px-4 py-3">Billing Date</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Payment Method</th>
                      <th className="px-4 py-3 print:hidden">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data?.data?.map((receipt) => (
                      <tr key={receipt?._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{receipt?.rec_no}</td>
                        <td className="px-4 py-3">{receipt?.mrd_id}</td>
                        <td className="px-4 py-3">
                          {receipt?.patient?.fullname}
                        </td>
                        <td className="px-4 py-3">
                          {receipt?.billing_date} {receipt?.billing_time}
                        </td>
                        <td className="px-4 py-3">₹{receipt?.amount}</td>
                        <td className="px-4 py-3">{receipt?.paidby}</td>
                        <td className="px-4 py-3 space-x-2 flex print:hidden">
                          <Link
                            href={`/moneyreceipt/print/${receipt?.rec_no}`}
                            className="btn btn-primary"
                          >
                            <FaPrint/>
                          </Link>
                          {session?.user?.role === "Admin" && (
                            <button
                              // onClick={() =>
                              //   deleteMutation.mutate(receipt?._id)
                              // }
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
            {isLoading && <Loading />}
          </MiddleSection>
        </div>
      </Suspense>
    </>
  );
};

export default withAuth(MoneyReceiptRecord);
