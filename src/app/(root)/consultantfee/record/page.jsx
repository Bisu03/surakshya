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
import { FaEdit, FaFileExcel, FaPrint, FaTrash } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { useReactToPrint } from "react-to-print";
import * as XLSX from "xlsx";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const ConsultantFeeRecord = () => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const contentRef = useRef(null);
  const [startDate, setStartDate] = useState(getDate());
  const [endDate, setEndDate] = useState(getDate());
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(handler);
  }, [search, startDate, endDate]);

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["consultantfeerecord"],
    queryFn: () =>
      fetchData(
        `/consultantfee?search=${debouncedSearch}&startDate=${startDate}&endDate=${endDate}`
      ),
  });

  useEffect(() => {
    refetch();
  }, [debouncedSearch, startDate, endDate]);

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteData(`/consultantfee`, id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["consultantfeerecord"] });
      refetch();
      SuccessHandling(data.message);
    },
    onError: (error) => ErrorHandeling(error),
  });

  const handleDelete = (id) => {
    if (
      window.confirm("Are you sure you want to delete this discharge record?")
    ) {
      deleteMutation.mutate(id);
    }
  };

  const totalBills = data?.data?.length || 0;
  const totalAmount =
    data?.data?.reduce((acc, fee) => acc + Number(fee?.amount || 0), 0) || 0;

  const handlePrint = useReactToPrint({ contentRef });

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      data.data.map((fee) => ({
        "Consultant Name": fee.consultant?.drname,
        "Patient Name": fee.fullname,
        Amount: fee.amount,
        Referr: fee.referr_by,
        Date: formatDate(fee.date),
        Description: fee.desc?.join(", "),
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Consultant Fees");
    XLSX.writeFile(workbook, `Consultant_Fees_${startDate}_${endDate}.xlsx`);
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex flex-wrap w-full justify-between">
        <Tab tabs={TabLinks} category="Consultant Fee" />
        <MiddleSection>
          <div className="w-full">
            <Heading heading="Consultant Fee Records">
              <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
                <input
                  className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by  Name "
                />
                <div className="flex space-x-2">
                  <input
                    type="date"
                    className="border rounded-lg p-2"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <input
                    type="date"
                    className="border rounded-lg p-2"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </Heading>

            {isLoading && <Loading />}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 print-hidden">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-sm font-semibold text-gray-600">
                  Total Bills
                </h3>
                <p className="text-2xl font-bold text-primary">{totalBills}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-sm font-semibold text-gray-600">
                  Total Amount
                </h3>
                <p className="text-2xl font-bold text-primary">
                  ₹{totalAmount.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mb-4 print-hidden">
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
                  <tr className="bg-secondary text-left text-xs font-semibold text-gray-600 uppercase">
                    <th className="p-3">Bill No</th>
                    <th className="p-3">Consultant</th>
                    <th className="p-3">Patient Name</th>
                    <th className="p-3">Referred</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 print:hidden">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.data?.map((fee) => (
                    <tr key={fee._id} className="hover:bg-gray-50">
                      <td className="p-3">{fee?.billno}</td>
                      <td className="p-3">{fee?.consultant?.drname}</td>
                      <td className="p-3">{fee?.fullname}</td>
                      <td className="p-3">{fee?.referr_by}</td>
                      <td className="p-3">₹{Number(fee?.amount).toFixed(2)}</td>
                      <td className="p-3">{formatDate(fee?.date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap flex space-x-2 print:hidden">
                        <Link
                          href={`/consultantfee/print/${fee.billno}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FaPrint />
                        </Link>
                        <button
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleDelete(fee._id)}
                        >
                          <FaTrash />
                        </button>
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
  );
};

export default withAuth(ConsultantFeeRecord);
