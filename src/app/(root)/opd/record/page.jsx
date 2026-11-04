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
import { FaEdit, FaFileExcel, FaPrint } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { useReactToPrint } from "react-to-print";
import * as XLSX from "xlsx";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const OpdRecord = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: session } = useSession();
  const contentRef = useRef(null);
  const [startDate, setStartDate] = useState(getDate());
  const [endDate, setEndDate] = useState(getDate());
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedPaidBy, setSelectedPaidBy] = useState("");

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: [
      "opdarecord",
      debouncedSearchTerm,
      startDate,
      endDate,
      selectedPaidBy,
    ], // Add payment filter to query key
    queryFn: () => {
      const params = new URLSearchParams({
        search: debouncedSearchTerm,
        paidby: selectedPaidBy, // Add payment filter to API call
      });

      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      return fetchData(`/opd?${params.toString()}`);
    },
  });

  useEffect(() => {
    refetch();
  }, [debouncedSearchTerm, startDate, endDate, selectedPaidBy]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setStartDate(getDate());
    setEndDate(getDate());
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteData("/opd", id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["opdarecord"] }); // Refetch data after adding
      SuccessHandling(data.message);
      refetch();
    },
    onError: (error) => {
      ErrorHandeling(error);
    },
  });

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      deleteMutation.mutate(id);
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      data?.data?.map((patient) => ({
        "UHID": patient?.mrd_id,
        "Patient Name": patient?.patient?.fullname,
        Phone: patient?.patient?.phone_number,
        Age: patient?.patient?.age,
        Date: patient?.consultant_date,
        Time: patient?.consultant_time,
        Consultant: patient?.consultant?.drname,
        Fees: patient?.opd_fees,
        "Payment Mode": patient?.paidby,
        "E & OE": patient?.admited_by,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "OPD Records");
    XLSX.writeFile(workbook, `OPD_Records_${startDate}_${endDate}.xlsx`);
  };

  const handlePrint = useReactToPrint({ contentRef });

  const totalPatients = data?.data?.length || 0;
  const totalFees =
    data?.data?.reduce(
      (acc, patient) => acc + Number(patient?.opd_fees || 0),
      0
    ) || 0;

  return (
    <>
      <Suspense fallback={<Loading />}>
        <div className="flex flex-wrap w-full justify-between">
          <Tab tabs={TabLinks} category="OPD" />
          <MiddleSection>
            <div className="w-full">
              <Heading heading="OPD Record">
                <div className="flex flex-wrap w-full justify-end items-center gap-2 sm:gap-4">
                  <input
                    className="w-full sm:w-auto max-w-xs py-2 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name"
                  />
                  {/* Payment Method Filter */}
                  <select
                    className="w-full sm:w-auto py-2 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    Total Patients
                  </h3>
                  <p className="text-2xl font-bold text-primary">
                    {totalPatients}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <h3 className="text-sm font-semibold text-gray-600">
                    Total Fees
                  </h3>
                  <p className="text-2xl font-bold text-primary">
                    ₹{totalFees.toLocaleString()}
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
                      <th className="px-4 py-3">UHID</th>
                      <th className="px-4 py-3">Full Name</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Age</th>
                      <th className="px-4 py-3">Admit Date & Time </th>
                      <th className="px-4 py-3">Consultant</th>
                      <th className="px-4 py-3">Fees Paid</th>
                      <th className="px-4 py-3"> Paid By</th>
                      <th className="px-4 py-3">E & OE</th>
                      <th className="px-4 py-3 print:hidden">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data?.data?.map((patient) => (
                      <tr key={patient._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{patient?.mrd_id}</td>
                        <td className="px-4 py-3">
                          {patient?.patient?.fullname}
                        </td>
                        <td className="px-4 py-3">
                          {patient?.patient?.phone_number}
                        </td>
                        <td className="px-4 py-3">{patient?.patient?.age}</td>
                        <td className="px-4 py-3">
                          {patient?.consultant_date}/{patient?.consultant_time}
                        </td>
                        <td className="px-4 py-3">
                          {patient?.consultant?.drname}
                        </td>
                        <td className="px-4 py-3">{patient?.opd_fees}</td>
                        <td className="px-4 py-3">{patient?.paidby}</td>
                        <td className="px-4 py-3">{patient?.admited_by}</td>
                        <td className="px-4 py-3 space-x-2 flex print:hidden">
                          <Link
                            href={`/opd/print/${patient._id}`}
                            className="btn btn-primary "
                          >
                            {" "}
                            <FaPrint />
                          </Link>
                          {session?.user?.role === "Admin" && (
                            <Link
                              href={`/opd/update/${patient._id}`}
                              className="btn btn-secondary "
                            >
                              {" "}
                              <FaEdit />{" "}
                            </Link>
                          )}
                          {session?.user?.role === "Admin" && (
                            <button
                              onClick={() => handleDelete(patient._id)}
                              className="btn btn-error "
                            >
                              {" "}
                              <MdDelete />{" "}
                              {deleteMutation?.isPending && <Spinner />}{" "}
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

export default withAuth(OpdRecord);
