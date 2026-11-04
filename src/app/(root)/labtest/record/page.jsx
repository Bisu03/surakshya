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
import { MdDelete, MdEdit } from "react-icons/md";
import { useReactToPrint } from "react-to-print";
import * as XLSX from "xlsx";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const PathologyRecord = () => {
  const queryClient = useQueryClient();
  const contentRef = useRef(null);
  const { data: session } = useSession();
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchName, setSearchName] = useState("");
  const [fromDate, setFromDate] = useState(getDate());
  const [toDate, setToDate] = useState(getDate());
  const [selectedPaidBy, setSelectedPaidBy] = useState("");
  const [expandedRow, setExpandedRow] = useState(null); // Track single expanded row

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchName);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchName, selectedPaidBy]);

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["labtestrecord"],
    queryFn: () =>
      fetchData(
        `/labtest?search=${debouncedSearch}&startDate=${fromDate}&endDate=${toDate}&paidby=${selectedPaidBy}`
      ),
    onSuccess: (data) => {
      setTotalPages(data?.pagination?.totalPages || 1);
    },
  });

  useEffect(() => {
    refetch();
  }, [debouncedSearch, fromDate, toDate, selectedPaidBy]);

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteData("/labtest", id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["labtestrecord"] });
      SuccessHandling("Record Deleted");
      refetch();
    },
    onError: (error) => {
      ErrorHandeling(error);
      console.error("Error adding data:", error);
    },
  });

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      deleteMutation.mutate(id);
    }
  };

  const handlePrint = useReactToPrint({ contentRef });

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      data.data.map((patient) => ({
        "UHID": patient.mrd_id,
        "Bill No": patient.bill_no,
        "Patient Name": patient.patient.fullname,
        "Reporting Date": patient.reporting_date,
        Consultant: patient?.consultant?.drname,
        "Referred By": patient?.referr_by,
        "Total Amount": patient.amount.total,
        Discount: patient.amount.discount,
        "Payable Amount": patient.amount.netTotal,
        "Due Amount": patient.due,
        "Total Paid": patient.total_paid,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Patients");
    XLSX.writeFile(workbook, `${fromDate}-${toDate}-LabTest_Records.xlsx`);
  };

  const toggleRow = (id) => {
    setExpandedRow((prev) => (prev === id ? null : id)); // Toggle the clicked row, close others
  };

  const totalPatients = data?.data?.length || 0;
  const totalAmount =
    data?.data?.reduce(
      (acc, patient) => acc + (patient?.amount?.total || 0),
      0
    ) || 0;
  const totalDiscount =
    data?.data?.reduce(
      (acc, patient) => acc + (patient?.amount?.discount || 0),
      0
    ) || 0;
  const totalPayable =
    data?.data?.reduce(
      (acc, patient) => acc + (patient?.amount?.netTotal || 0),
      0
    ) || 0;
  const totalDue =
    data?.data?.reduce(
      (acc, patient) => acc + (patient?.due || 0),
      0
    ) || 0;

  const totalPaid =
    data?.data?.reduce(
      (acc, patient) => acc + Number(patient?.total_paid || 0),
      0
    ) || 0;

  // Calculate payment method totals
  const upiPaid =
    data?.data?.reduce(
      (acc, patient) =>
        acc +
        (Array.isArray(patient.payments)
          ? patient.payments
              .filter((p) => p.mode?.toLowerCase() === "upi")
              .reduce((sum, p) => sum + Number(p.amount || 0), 0)
          : 0),
      0
    ) || 0;

  const cashPaid =
    data?.data?.reduce(
      (acc, patient) =>
        acc +
        (Array.isArray(patient.payments)
          ? patient.payments
              .filter((p) => p.mode?.toLowerCase() === "cash")
              .reduce((sum, p) => sum + Number(p.amount || 0), 0)
          : 0),
      0
    ) || 0;

  return (
    <>
      <Suspense fallback={<Loading />}>
        <div className="flex flex-wrap w-full justify-between">
          <Tab tabs={TabLinks} category="Labtest" />
          <MiddleSection>
            <div className="w-full">

              <Heading heading="Lab Test Record">
                <div className="flex flex-wrap items-center gap-4 bg-gray-50 p-4 rounded-lg mb-2">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4 w-full">
                    <input
                      className="py-2 px-4 border rounded-lg focus:ring-2 focus:ring-blue-500 w-full md:w-64"
                      type="text"
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      placeholder="Search by name or bill no."
                    />
                    <select
                      className="py-2 px-4 border rounded-lg focus:ring-2 focus:ring-blue-500 w-full md:w-48"
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
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <input
                        className="border p-2 rounded w-full md:w-32"
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                      />
                      <span className="hidden md:inline">to</span>
                      <input
                        className="border p-2 rounded w-full md:w-32"
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </Heading>

              <div className="mb-4">
                {/* calculation section */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 shadow">
                  <div className="flex flex-col items-center px-2">
                    <span className="text-xs font-semibold text-gray-600">
                      Total Patients
                    </span>
                    <span className="text-lg font-bold text-blue-700">
                      {totalPatients}
                    </span>
                  </div>
                  <div className="flex flex-col items-center px-2">
                    <span className="text-xs font-semibold text-gray-600">
                      Total Amount
                    </span>
                    <span className="text-lg font-bold text-blue-700">
                      ₹{totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col items-center px-2">
                    <span className="text-xs font-semibold text-gray-600">
                      Total Discount
                    </span>
                    <span className="text-lg font-bold text-blue-700">
                      ₹{totalDiscount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col items-center px-2">
                    <span className="text-xs font-semibold text-gray-600">
                      Total Payable
                    </span>
                    <span className="text-lg font-bold text-blue-700">
                      ₹{totalPayable.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col items-center px-2">
                    <span className="text-xs font-semibold text-gray-600">
                      Total Due
                    </span>
                    <span className="text-lg font-bold text-blue-700">
                      ₹{totalDue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col items-center px-2">
                    <span className="text-xs font-semibold text-gray-600">
                      Total Paid
                    </span>
                    <span className="text-lg font-bold text-blue-700">
                      ₹{totalPaid.toLocaleString()}
                    </span>
                  </div>
                  {/* --- UPI, Cash, Paid summary box moved here --- */}
                  <div className="flex flex-col items-center px-2">
                    <span className="text-xs font-semibold text-gray-600">
                      Total UPI Paid
                    </span>
                    <span className="text-lg font-bold text-blue-700">
                      ₹{upiPaid.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col items-center px-2">
                    <span className="text-xs font-semibold text-gray-600">
                      Total Cash Paid
                    </span>
                    <span className="text-lg font-bold text-blue-700">
                      ₹{cashPaid.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mb-4 print:hidden">
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

              {isLoading && <Loading />}

              <div className="overflow-x-auto">
                <table ref={contentRef} className="w-full">
                  <thead>
                    <tr className="bg-secondary text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <th className="px-4 py-3">UHID</th>
                      <th className="px-4 py-3">Bill No</th>
                      <th className="px-4 py-3">Full Name</th>
                      <th className="px-4 py-3">Reporting Date/Time</th>
                      <th className="px-4 py-3">Consultant</th>
                      <th className="px-4 py-3">Referred By</th>
                      <th className="px-4 py-3">Total Amount</th>
                      <th className="px-4 py-3">Discount</th>
                      <th className="px-4 py-3">Payable</th>
                      <th className="px-4 py-3">Due</th>
                      <th className="px-4 py-3">Total Paid</th>
                      <th className="px-4 py-3">UPI Paid</th>
                      <th className="px-4 py-3">Cash Paid</th>
                      <th className="px-4 py-3 print:hidden">E&OE</th>
                      <th className="px-4 py-3 print:hidden">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data?.data?.map((patient) => {
                      // Calculate UPI and Cash paid for this patient
                      const upi = Array.isArray(patient.payments)
                        ? patient.payments
                            .filter((p) => p.mode?.toLowerCase() === "upi")
                            .reduce((sum, p) => sum + Number(p.amount || 0), 0)
                        : 0;
                      const cash = Array.isArray(patient.payments)
                        ? patient.payments
                            .filter((p) => p.mode?.toLowerCase() === "cash")
                            .reduce((sum, p) => sum + Number(p.amount || 0), 0)
                        : 0;

                      return (
                        <React.Fragment key={patient._id}>
                          <tr
                            className={`cursor-pointer ${
                              expandedRow === patient._id
                                ? "bg-blue-100 hover:bg-blue-200"
                                : "hover:bg-gray-50"
                            }`}
                            onClick={() => toggleRow(patient._id)}
                          >
                            <td className="px-4 py-3">{patient?.mrd_id}</td>
                            <td className="px-4 py-3">{patient?.bill_no}</td>
                            <td className="px-4 py-3">
                              <Link href={`/labtest/printreceipt/${patient?.bill_no}`}>
                                {patient?.patient?.fullname}
                              </Link>
                            </td>
                            <td className="px-4 py-3">
                              {patient?.reporting_date}/ {patient?.reporting_time}
                            </td>
                            <td className="px-4 py-3">
                              {patient?.consultant?.drname}
                            </td>
                            <td className="px-4 py-3">{patient?.referr_by}</td>
                            <td className="px-4 py-3">
                              {patient?.amount?.total}/-
                            </td>
                            <td className="px-4 py-3">
                              {patient?.amount?.discount}/-
                            </td>
                            <td className="px-4 py-3">
                              {patient?.amount?.netTotal}/-
                            </td>
                            <td className="px-4 py-3">{patient?.due}/-</td>
                            <td className="px-4 py-3">{patient?.total_paid}/-</td>
                            <td className="px-4 py-3">{upi}/-</td>
                            <td className="px-4 py-3">{cash}/-</td>
                            <td className="px-4 py-3 print:hidden">
                              {patient?.admited_by}
                            </td>
                            <td className="px-4 py-3 space-x-2 flex print:hidden">
                              <Link
                                href={`/labtest/update/${patient.bill_no}`}
                                className="btn btn-warning"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MdEdit />
                              </Link>
                              <Link
                                href={`/labtest/printreceipt/${patient.bill_no}`}
                                className="btn btn-primary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FaPrint />
                              </Link>
                              {session?.user?.role === "Admin" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(patient._id);
                                  }}
                                  className="btn btn-error"
                                >
                                  <MdDelete />
                                  {deleteMutation?.isPending && <Spinner />}
                                </button>
                              )}
                            </td>
                          </tr>
                          {expandedRow === patient._id && (
                            <tr className="bg-gray-100">
                              <td colSpan="15" className="px-4 py-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-semibold text-gray-700">
                                      Pathology Tests
                                    </h4>
                                    {patient?.pathology_test_cart?.services?.length >
                                    0 ? (
                                      <ul className="list-disc pl-5">
                                        {patient.pathology_test_cart.services.map(
                                          (test, index) => (
                                            <li key={index} className="text-sm">
                                              {test.pathology_category}: ₹
                                              {test.pathology_charge}
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    ) : (
                                      <p className="text-sm text-gray-500">
                                        No pathology tests
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-700">
                                      Radiology Tests
                                    </h4>
                                    {patient?.radiology_test_cart?.services?.length >
                                    0 ? (
                                      <ul className="list-disc pl-5">
                                        {patient.radiology_test_cart.services.map(
                                          (test, index) => (
                                            <li key={index} className="text-sm">
                                              {test.test_name}: ₹{test.test_charge}
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    ) : (
                                      <p className="text-sm text-gray-500">
                                        No radiology tests
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                  {/* ...existing summary row... */}
                  <tbody className="bg-gray-100 font-semibold text-gray-700 text-sm">
                    <tr>
                      <td>Total Patients:</td>
                      <td>{totalPatients}</td>
                      <td>Total Amount:</td>
                      <td>₹{totalAmount.toLocaleString()}</td>
                      <td>Total Discount:</td>
                      <td>₹{totalDiscount.toLocaleString()}</td>
                      <td>Total Payable:</td>
                      <td>₹{totalPayable.toLocaleString()}</td>
                      <td>Total Due:</td>
                      <td>₹{totalDue.toLocaleString()}</td>
                      <td>Total Paid:</td>
                      <td>₹{totalPaid.toLocaleString()}</td>
                      <td>UPI: ₹{upiPaid.toLocaleString()}</td>
                      <td>Cash: ₹{cashPaid.toLocaleString()}</td>
                    </tr>
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

export default withAuth(PathologyRecord);
