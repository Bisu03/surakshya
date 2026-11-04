"use client";

import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import Tab from "@/components/Tab";
import { getDate } from "@/lib/currentDate";
import { formatDate } from "@/lib/formateDate";
import { fetchData } from "@/services/apiService";
import { withAuth } from "@/services/withAuth";
import { ErrorHandeling } from "@/utils/errorHandling";
import { TabLinks } from "@/utils/tablinks";
import { useQuery } from "@tanstack/react-query";
import React, { lazy, Suspense, useMemo, useRef, useState } from "react";
import { FaFileExcel, FaPrint } from "react-icons/fa";
import AsyncSelect from "react-select/async";
import { useReactToPrint } from "react-to-print";
import * as XLSX from "xlsx";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const InventoryRecord = () => {
  const contentRef = useRef(null);
  const handlePrint = useReactToPrint({ contentRef });

  const [mode, setMode] = useState("all"); // "all" | "expiring"
  const [startDate, setStartDate] = useState(getDate());
  const [endDate, setEndDate] = useState(getDate());
  const [type, setType] = useState("");
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [expiringWithinDays, setExpiringWithinDays] = useState(30);

  const loadMedicines = async (inputValue) => {
    try {
      const response = await fetchData(
        `/admin/medicine?name=${encodeURIComponent(inputValue || "")}`
      );
      return (response.data || []).map((medicine) => ({
        value: medicine._id,
        label: medicine.name,
      }));
    } catch (error) {
      ErrorHandeling(error);
      return [];
    }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "inventoryRecord",
      mode,
      startDate,
      endDate,
      type,
      selectedMedicine?.value,
      expiringWithinDays,
    ],
    queryFn: () => {
      const params = new URLSearchParams();
      if (mode === "expiring") {
        params.append("expiringWithinDays", expiringWithinDays);
      } else {
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        if (type) params.append("type", type);
      }
      if (selectedMedicine?.value) params.append("medicine", selectedMedicine.value);
      return fetchData(`/inventory/stock?${params.toString()}`);
    },
  });

  const rows = data?.data || [];

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        if (row.type === "IN") acc.totalIn += Number(row.quantity) || 0;
        if (row.type === "OUT") acc.totalOut += Number(row.quantity) || 0;
        return acc;
      },
      { totalIn: 0, totalOut: 0 }
    );
  }, [rows]);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      rows.map((row) => ({
        Date: row.date,
        Medicine: row.medicine?.name,
        Unit: row.medicine?.unit_type,
        Type: row.type,
        Quantity: row.quantity,
        Reason: row.reason,
        Reference: row.reference,
        "Unit Cost": row.unit_cost,
        "Expiry Date": row.expiry_date,
        Remarks: row.remarks,
        "Recorded By": row.recorded_by,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Record");
    XLSX.writeFile(workbook, `Stock_Record_${startDate}_${endDate}.xlsx`);
  };

  const isExpiryPast = (dateStr) => dateStr && dateStr < getDate();
  const isExpirySoon = (dateStr) =>
    dateStr && !isExpiryPast(dateStr) && dateStr <= addDaysStr(getDate(), expiringWithinDays);

  return (
    <Suspense fallback={<Loading />}>
      <Tab tabs={TabLinks} category="Inventory" />
      <div className="flex flex-wrap w-full justify-between">
        <MiddleSection>
          <div className="w-full">
            <Heading heading="Stock Record">
              <div className="flex flex-wrap w-full justify-end items-center gap-2 sm:gap-4">
                <div className="flex rounded-lg border overflow-hidden">
                  <button
                    onClick={() => setMode("all")}
                    className={`px-4 py-2 text-sm ${
                      mode === "all" ? "bg-primary text-white" : "bg-white"
                    }`}
                  >
                    All Transactions
                  </button>
                  <button
                    onClick={() => setMode("expiring")}
                    className={`px-4 py-2 text-sm ${
                      mode === "expiring" ? "bg-primary text-white" : "bg-white"
                    }`}
                  >
                    Expiring Soon
                  </button>
                </div>
              </div>
            </Heading>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4 px-2 sm:px-0 mb-4">
              {mode === "all" ? (
                <>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border p-2 rounded"
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border p-2 rounded"
                  />
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="border p-2 rounded"
                  >
                    <option value="">All Types</option>
                    <option value="IN">Stock In</option>
                    <option value="OUT">Stock Out</option>
                  </select>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <label className="text-sm">Within</label>
                  <input
                    type="number"
                    min="1"
                    value={expiringWithinDays}
                    onChange={(e) => setExpiringWithinDays(e.target.value)}
                    className="border p-2 rounded w-20"
                  />
                  <label className="text-sm">days</label>
                </div>
              )}
              <div className="w-full sm:w-72">
                <AsyncSelect
                  cacheOptions
                  defaultOptions
                  isClearable
                  loadOptions={loadMedicines}
                  value={selectedMedicine}
                  onChange={setSelectedMedicine}
                  placeholder="Filter by medicine"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 print-hidden">
              {mode === "all" ? (
                <>
                  <div className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="text-sm font-semibold text-gray-600">
                      Total Quantity In
                    </h3>
                    <p className="text-2xl font-bold text-primary">{totals.totalIn}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="text-sm font-semibold text-gray-600">
                      Total Quantity Out
                    </h3>
                    <p className="text-2xl font-bold text-primary">{totals.totalOut}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="text-sm font-semibold text-gray-600">Net Change</h3>
                    <p className="text-2xl font-bold text-primary">
                      {totals.totalIn - totals.totalOut}
                    </p>
                  </div>
                </>
              ) : (
                <div className="bg-white p-4 rounded-lg shadow-md md:col-span-2">
                  <h3 className="text-sm font-semibold text-gray-600">
                    Stock received with upcoming/past expiry dates
                  </h3>
                  <p className="text-2xl font-bold text-primary">{rows.length} entries</p>
                  <p className="text-xs text-gray-500 mt-1">
                    This is stock as originally received — not a live remaining-quantity
                    count, since some of it may already have been dispensed since receipt.
                  </p>
                </div>
              )}
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
                  Print
                </button>
              </div>
            </div>

            {isLoading && <Loading />}
            {error && (
              <div className="text-center p-8 text-red-500">
                Error loading stock record: {error.message}
              </div>
            )}

            {!isLoading && rows.length > 0 && (
              <div className="overflow-x-auto">
                <table ref={contentRef} className="w-full">
                  <thead>
                    <tr className="bg-secondary text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Medicine</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Quantity</th>
                      <th className="px-4 py-3">Reason</th>
                      <th className="px-4 py-3">Reference</th>
                      <th className="px-4 py-3">Unit Cost</th>
                      <th className="px-4 py-3">Expiry Date</th>
                      <th className="px-4 py-3">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rows.map((row) => (
                      <tr key={row._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{formatDate(row.date)}</td>
                        <td className="px-4 py-3">
                          {row.medicine?.name}
                          {row.medicine?.unit_type ? ` (${row.medicine.unit_type})` : ""}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`badge ${
                              row.type === "IN" ? "badge-success" : "badge-warning"
                            }`}
                          >
                            {row.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">{row.quantity}</td>
                        <td className="px-4 py-3">{row.reason}</td>
                        <td className="px-4 py-3">{row.reference || "-"}</td>
                        <td className="px-4 py-3">{row.unit_cost ?? "-"}</td>
                        <td
                          className={`px-4 py-3 ${
                            isExpiryPast(row.expiry_date)
                              ? "text-red-600 font-semibold"
                              : isExpirySoon(row.expiry_date)
                                ? "text-amber-600 font-semibold"
                                : ""
                          }`}
                        >
                          {row.expiry_date ? formatDate(row.expiry_date) : "-"}
                        </td>
                        <td className="px-4 py-3">{row.recorded_by || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!isLoading && rows.length === 0 && (
              <div className="text-center p-8 text-gray-500">
                No stock records found for the selected filters
              </div>
            )}
          </div>
        </MiddleSection>
      </div>
    </Suspense>
  );
};

function addDaysStr(dateStr, days) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + Number(days || 0));
  return dt.toISOString().slice(0, 10);
}

export default withAuth(InventoryRecord);
