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
import { FaFileExcel, FaFileMedical, FaPrint } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { MdEdit } from "react-icons/md";
import { hasPermission } from "@/lib/permissions";
import { useReactToPrint } from "react-to-print";
import * as XLSX from "xlsx";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const IpdRecord = () => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const contentRef = useRef(null);
  const [startDate, setStartDate] = useState(getDate());
  const [endDate, setEndDate] = useState(getDate());
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("date"); // Default to date range search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: [
      "ipdarecord",
      debouncedSearchTerm,
      startDate,
      endDate,
      searchType,
    ],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchType === "name" && debouncedSearchTerm) {
        params.append("fullname", debouncedSearchTerm);
      } else if (searchType === "regId" && debouncedSearchTerm) {
        params.append("regid", debouncedSearchTerm);
      } else if (searchType === "date") {
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
      }
      return fetchData(`/ipd?${params.toString()}`);
    },
  });

  const handleClearFilters = () => {
    setStartDate(getDate());
    setEndDate(getDate());
    setSearchTerm("");
    setSearchType("date"); // Default to date search on clear
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteData("/ipd", id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ipdarecord"] });
      SuccessHandling(data.message);
      refetch();
    },
    onError: (error) => {
      ErrorHandeling(error);
      console.error("Error deleting data:", error);
    },
  });

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      deleteMutation.mutate(id);
    }
  };

  const records = Array.isArray(data?.data)
    ? data?.data
    : data?.data
    ? [data?.data]
    : [];
  const totalPatients = records.length;
  const totalAdmissionCharge = records?.reduce(
    (acc, patient) => acc + Number(patient?.admission_charge || 0),
    0
  );

  const handlePrint = useReactToPrint({ contentRef });
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      data.data.map((patient) => ({
        "UHID": patient.mrd_id,
        "REGID": patient.reg_id,
        "Patient Name": patient.patient?.fullname,
        Phone: patient.patient?.phone_number,
        "Admit Date": formatDate(patient.admit_date),
        "Admit Time": patient.admit_time,
        Consultant: patient.consultant?.drname,
        "Admit Type": patient.admit_type,
        "Referred By": patient.referr_by,
        "Admission Charge": patient.admission_charge,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "IPD Records");
    XLSX.writeFile(workbook, `IPD_Records_${startDate}_${endDate}.xlsx`);
  };

  return (
    <>
      <Suspense fallback={<Loading />}>
        <div className="flex flex-wrap w-full justify-between">
          <Tab tabs={TabLinks} category="IPD" />
          <MiddleSection>
            <div className="w-full">
              <Heading heading="IPD Record">
                <div className="flex flex-wrap w-full justify-end items-center gap-2 sm:gap-4">
                  {/* Search Type Dropdown */}
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="border p-2 rounded w-full sm:w-40"
                  >
                    <option value="date">Search by Date</option>
                    <option value="name">Search by Name</option>
                    <option value="regId">Search by REGID</option>
                  </select>

                  {/* Search Input or Date Filters */}
                  {searchType === "date" ? (
                    <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
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
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder={`Search by ${
                        searchType === "name" ? "name" : "REGID"
                      }...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="border p-2 rounded w-full sm:w-64"
                    />
                  )}

                  {/* Clear Filters Button */}
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
                    Total Admission Charges
                  </h3>
                  <p className="text-2xl font-bold text-primary">
                    ₹{totalAdmissionCharge.toLocaleString()}
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
                    Print Report
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table ref={contentRef} className="w-full">
                  <thead>
                    <tr className="bg-secondary text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <th className="px-4 py-3">UHID</th>
                      <th className="px-4 py-3">REGID</th>
                      <th className="px-4 py-3">Full Name</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Admit Date & Time</th>
                      <th className="px-4 py-3">Consultant</th>
                      <th className="px-4 py-3">Admit Type</th>
                      <th className="px-4 py-3">Referred By</th>
                      <th className="px-4 py-3 print-hidden">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data?.data?.map((patient) => (
                      <tr key={patient._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{patient?.mrd_id}</td>
                        <td className="px-4 py-3">{patient?.reg_id}</td>
                        <td className="px-4 py-3">
                          {patient?.patient?.fullname}
                        </td>
                        <td className="px-4 py-3">
                          {patient?.patient?.phone_number}
                        </td>
                        <td className="px-4 py-3">
                          {formatDate(patient?.admit_date)}/
                          {patient?.admit_time}
                        </td>
                        <td className="px-4 py-3">
                          {patient?.consultant?.drname}
                        </td>
                        <td className="px-4 py-3">{patient?.admit_type}</td>
                        <td className="px-4 py-3">{patient?.referr_by}</td>
                        <td className="px-4 py-3 space-x-2 flex print-hidden">
                           <Link
                            href={`/ipd/print/${patient.reg_id}`}
                            className="btn btn-primary"
                          >
                            <FaPrint />
                           </Link>
                           {hasPermission(session?.user, "discharge", "view") && (
                             <Link
                               href={`/discharge/print/${patient.reg_id}`}
                               className="btn btn-neutral"
                               aria-label={`Print discharge summary for ${patient.reg_id}`}
                               title="Print discharge summary"
                             >
                               <FaFileMedical />
                             </Link>
                           )}
                           {hasPermission(session?.user, "ipd", "edit") && (
                             <Link
                               href={`/ipd/update/${patient._id}`}
                               className="btn btn-secondary"
                               aria-label={`Edit IPD ${patient.reg_id}`}
                             >
                               <MdEdit />
                             </Link>
                           )}
                           {hasPermission(session?.user, "ipd", "delete") && (
                            <button
                              onClick={() => handleDelete(patient._id)}
                              className="btn btn-error"
                            >
                              <MdDelete />{" "}
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

export default withAuth(IpdRecord);
