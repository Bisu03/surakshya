"use client";

import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import { getDate } from "@/lib/currentDate";
import { fetchData } from "@/services/apiService";
import { ErrorHandeling } from "@/utils/errorHandling";
import axios from "axios";
import React, { lazy, Suspense, useState, useRef, useCallback, useMemo } from "react";
import AsyncSelect from "react-select/async";
import { CSVLink } from "react-csv";
import { formatDate } from "@/lib/formateDate";
import { withAuth } from "@/services/withAuth";
import { debounce } from "lodash";
import { useReactToPrint } from "react-to-print";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const LabSummary = () => {
  const [startDate, setStartDate] = useState(getDate());
  const [endDate, setEndDate] = useState(getDate());
  const [consultant, setConsultant] = useState(null);
  const [localData, setLocalData] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkRemarks, setBulkRemarks] = useState("");
  const tableRef = useRef(null);

  // Commission rate (safe)
  const rawCommission = consultant?.value?.comission ?? "0";
  const COMMISSION_RATE = parseFloat(rawCommission) / 100 || 0;

  /* Helper: Get Patient Name Safely */
  const getPatientName = (item) => {
    return (
      item.fullname ||
      item.patientName ||
      item.patient_name ||
      item.name ||
      item.patient?.fullname ||
      item.patient?.name ||
      item.patient?.patientName ||
      item.patient_fullname ||
      "Unknown Patient"
    );
  };

  /* Helper: Get MRD Safely */
  const getMRD = (item) => {
    return item.mrdId || item.mrd || item.patient?.mrdId || item.patient?.mrd || "-";
  };

  /* Doctor Search */
  const loadOptions = useCallback(
    debounce(async (inputValue) => {
      if (!inputValue.trim()) return [];
      try {
        const { data } = await fetchData(`/doctor?drname=${inputValue}`);
        return data.map((doc) => ({
          value: doc,
          label: `${doc.drname} (${doc.drinfo || "No Info"})`,
        }));
      } catch (err) {
        ErrorHandeling(err);
        return [];
      }
    }, 300),
    []
  );

  /* Fetch Data */
  const handleGetdetails = async () => {
    if (!consultant?.value?.drname) {
      alert("Please select a consultant");
      return;
    }
    try {
      const { data } = await fetchData(
        `/doctorsummary/lab?drname=${consultant.value.drname}&startDate=${startDate}&endDate=${endDate}`
      );
      setLocalData(data || []);
      setSelectedIds([]);
      setBulkRemarks("");
    } catch (err) {
      ErrorHandeling(err);
      setLocalData([]);
    }
  };

  /* Bulk Selection */
  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const clearSelection = () => {
    setSelectedIds([]);
    setBulkRemarks("");
  };

  /* Bulk Mark as Paid */
  const handleBulkMarkPaid = async () => {
    if (selectedIds.length === 0) return;
    try {
      await axios.put(`/api/v1/doctorsummary/lab`, {
        ids: selectedIds,
        is_paid: true,
        remarks: bulkRemarks.trim() ? bulkRemarks.trim() : undefined, // Only send if not empty
      });
      alert(`${selectedIds.length} commission(s) marked as paid`);
      clearSelection();
      handleGetdetails();
    } catch (err) {
      ErrorHandeling(err);
    }
  };

  /* Update Single Remark */
  const updateRemark = async (id, remark) => {
    try {
      const response = await axios.put(`/api/v1/doctorsummary/lab`, {
        ids: [id],
        remarks: remark.trim() || "",  // Send empty string if blank, not undefined
      });
      if (response.data.success) {
        console.log("Remark updated successfully:", remark);
      }
    } catch (err) {
      ErrorHandeling(err);
    }
  };

  const handleRemarkChange = (id, value) => {
    setLocalData((prev) =>
      prev.map((item) =>
        item._id === id
          ? { ...item, doctor_commission: { ...item.doctor_commission, remarks: value } }
          : item
      )
    );
  };

  const handleRemarkBlur = (id) => {
    const item = localData.find((i) => i._id === id);
    if (item) {
      const remarkValue = item.doctor_commission?.remarks || "";
      updateRemark(id, remarkValue);
    }
  };

  /* Print */
  const handlePrint = useReactToPrint({
    contentRef: tableRef,
    documentTitle: `${consultant?.value?.drname || "Lab"}_Summary_${formatDate(startDate)}_to_${formatDate(endDate)}`,
  });

  /* Filters */
  const filteredData = useMemo(() => {
    if (filter === "paid") return localData.filter((i) => i.doctor_commission?.is_paid);
    if (filter === "due") return localData.filter((i) => !i.doctor_commission?.is_paid);
    return localData;
  }, [localData, filter]);

  const paidCount = localData.filter((i) => i.doctor_commission?.is_paid).length;
  const dueCount = localData.filter((i) => !i.doctor_commission?.is_paid).length;

  /* Summary Calculation */
  const summary = useMemo(() => {
    return localData.reduce(
      (acc, item) => {
        const paid = Number(item.totalPaid) || 0;
        const comm = paid * COMMISSION_RATE;
        const isPaid = item.doctor_commission?.is_paid;

        return {
          totalAmount: acc.totalAmount + (Number(item.totalAmount) || 0),
          totalDiscount: acc.totalDiscount + (Number(item.discount) || 0),
          totalPaid: acc.totalPaid + paid,
          totalDue: acc.totalDue + (Number(item.due) || 0),
          totalCommEarned: acc.totalCommEarned + comm,
          totalCommPaid: acc.totalCommPaid + (isPaid ? comm : 0),
          totalCommDue: acc.totalCommDue + (!isPaid ? comm : 0),
          patientCount: acc.patientCount + 1,
          testCount:
            acc.testCount +
            (item.pathologyTests?.length || 0) +
            (item.radiologyTests?.length || 0),
        };
      },
      {
        totalAmount: 0,
        totalDiscount: 0,
        totalPaid: 0,
        totalDue: 0,
        totalCommEarned: 0,
        totalCommPaid: 0,
        totalCommDue: 0,
        patientCount: 0,
        testCount: 0,
      }
    );
  }, [localData, COMMISSION_RATE]);

  const fmt = (n) => Math.round(Number(n) || 0).toLocaleString();
  const fmt2 = (n) => Number(n || 0).toFixed(2);

  const csvData = [
    {
      "": "SUMMARY",
      Patient: `Patients: ${summary.patientCount} | Tests: ${summary.testCount}`,
      "Total Amount": fmt(summary.totalAmount),
      Discount: fmt(summary.totalDiscount),
      "Total Paid": fmt(summary.totalPaid),
      "Comm Earned": fmt2(summary.totalCommEarned),
      "Comm Paid": fmt2(summary.totalCommPaid),
      "Comm Due": fmt2(summary.totalCommDue),
      Due: fmt(summary.totalDue),
    },
    ...localData.map((item) => {
      const comm = Number(item.totalPaid) * COMMISSION_RATE;
      return {
        "#": "",
        Patient: getPatientName(item),
        "UHID": getMRD(item),
        Date: formatDate(item.reportingDate),
        Total: fmt(item.totalAmount),
        Disc: fmt(item.discount),
        Paid: fmt(item.totalPaid),
        Comm: fmt2(comm),
        Status: item.doctor_commission?.is_paid ? "Paid" : "Due",
        Remarks: item.doctor_commission?.remarks || "-",
        Due: fmt(item.due),
      };
    }),
  ];

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex flex-wrap w-full justify-between">
        <MiddleSection>
          <div className="w-full">
            <Heading heading="Lab Summary" />

            {/* Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <AsyncSelect
                  cacheOptions
                  loadOptions={loadOptions}
                  value={consultant}
                  onChange={setConsultant}
                  defaultOptions
                  placeholder="Search consultant..."
                  className="w-full text-lg"
                  isClearable
                />
                {consultant && (
                  <p className="mt-1 text-sm text-gray-600">
                    Commission: <strong>{rawCommission}%</strong> on paid amount
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input type="date" className="input input-bordered" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <input type="date" className="input input-bordered" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>

              <div className="flex gap-2 justify-end flex-wrap">
                <button className="btn btn-primary" onClick={handleGetdetails} disabled={!consultant}>
                  Search
                </button>
                <CSVLink data={csvData} filename={`Lab_Summary_${consultant?.value?.drname || "All"}_${formatDate(startDate)}_to_${formatDate(endDate)}.csv`} className="btn btn-success">
                  Export Excel
                </CSVLink>
                <button className="btn btn-error" onClick={handlePrint} disabled={!localData.length}>
                  Print
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            {localData.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
                <div className="card bg-base-100 shadow p-4 text-center">
                  <div className="text-xs text-gray-600">Total Amount</div>
                  <div className="text-xl font-bold">₹{fmt(summary.totalAmount)}</div>
                </div>
                <div className="card bg-base-100 shadow p-4 text-center">
                  <div className="text-xs text-gray-600">Discount</div>
                  <div className="text-xl">₹{fmt(summary.totalDiscount)}</div>
                </div>
                <div className="card bg-base-100 shadow p-4 text-center">
                  <div className="text-xs text-gray-600">Total Paid</div>
                  <div className="text-xl font-bold text-blue-600">₹{fmt(summary.totalPaid)}</div>
                </div>
                <div className="card bg-base-100 shadow p-4 text-center">
                  <div className="text-xs text-success">Comm Paid</div>
                  <div className="text-xl font-bold text-success">₹{fmt2(summary.totalCommPaid)}</div>
                </div>
                <div className="card bg-base-100 shadow p-4 text-center">
                  <div className="text-xs text-error">Comm Due</div>
                  <div className="text-xl font-bold text-error">₹{fmt2(summary.totalCommDue)}</div>
                </div>
                <div className="card bg-base-100 shadow p-4 text-center">
                  <div className="text-xs text-gray-600">Patient Due</div>
                  <div className="text-xl font-bold text-error">₹{fmt(summary.totalDue)}</div>
                </div>
                <div className="card bg-base-100 shadow p-4 text-center">
                  <div className="text-xs text-gray-600">Patients / Tests</div>
                  <div className="text-xl">{summary.patientCount} / {summary.testCount}</div>
                </div>
              </div>
            )}

            {/* Filter Buttons */}
            {localData.length > 0 && (
              <div className="flex gap-3 mb-4 flex-wrap">
                <button className={`btn ${filter === "all" ? "btn-active" : ""}`} onClick={() => setFilter("all")}>
                  All ({localData.length})
                </button>
                <button className={`btn ${filter === "paid" ? "btn-active" : ""}`} onClick={() => setFilter("paid")}>
                  Paid ({paidCount})
                </button>
                <button className={`btn ${filter === "due" ? "btn-active" : ""}`} onClick={() => setFilter("due")}>
                  Due ({dueCount})
                </button>
              </div>
            )}

            {/* Table */}
            {filteredData.length > 0 && (
              <div ref={tableRef} className="mb-10">
                <div className="text-center mb-6 print:block hidden">
                  <h1 className="text-2xl font-bold">{consultant?.value?.drname}</h1>
                  <p>Lab Summary | {formatDate(startDate)} to {formatDate(endDate)}</p>
                  <p className="font-medium">Commission: {rawCommission}% on Total Paid</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full text-sm">
                    <thead className="bg-base-200">
                      <tr>
                        <th className="print:hidden">
                          <input
                            type="checkbox"
                            checked={selectedIds.length === filteredData.length && filteredData.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedIds(filteredData.map((i) => i._id));
                              else clearSelection();
                            }}
                          />
                        </th>
                        <th>#</th>
                        <th>Patient</th>
                        <th>UHID</th>
                        <th>Date</th>
                        <th className="text-right">Total</th>
                        <th className="text-right">Disc</th>
                        <th className="text-right">Paid</th>
                        <th className="text-right">Comm</th>
                        <th>Status</th>
                        <th>Remarks</th>
                        <th className="text-right">Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((item, idx) => {
                        const comm = Number(item.totalPaid) * COMMISSION_RATE;
                        const isPaid = item.doctor_commission?.is_paid;
                        const remark = item.doctor_commission?.remarks || "";

                        return (
                          <tr key={item._id} className="hover">
                            <td className="print:hidden">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(item._id)}
                                onChange={() => toggleSelect(item._id)}
                              />
                            </td>
                            <td>{idx + 1}</td>
                            <td className="font-medium">{getPatientName(item)}</td>
                            <td>{getMRD(item)}</td>
                            <td>{formatDate(item.reportingDate)}</td>
                            <td className="text-right">{fmt(item.totalAmount)}</td>
                            <td className="text-right">{fmt(item.discount)}</td>
                            <td className="text-right font-bold text-blue-600">{fmt(item.totalPaid)}</td>
                            <td className="text-right text-success font-medium">{fmt2(comm)}</td>
                            <td>
                              <span className={`badge ${isPaid ? "badge-success" : "badge-error"}`}>
                                {isPaid ? "Paid" : "Due"}
                              </span>
                            </td>
                            <td>
                              <input
                                type="text"
                                className="input input-xs input-bordered w-full max-w-xs"
                                value={remark}
                                onChange={(e) => handleRemarkChange(item._id, e.target.value)}
                                onBlur={() => handleRemarkBlur(item._id)}
                                placeholder="Remark (optional)"
                              />
                            </td>
                            <td className={`text-right font-bold ${item.due > 0 ? "text-error" : ""}`}>
                              {fmt(item.due)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Bulk Action */}
                {selectedIds.length > 0 && (
                  <div className="mt-6 p-4 bg-base-200 rounded-lg print:hidden">
                    <h3 className="font-bold mb-3">
                      Selected: {selectedIds.length} record(s)
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <textarea
                        className="textarea textarea-bordered flex-1"
                        rows={2}
                        placeholder="Optional remark for all selected (will overwrite existing)"
                        value={bulkRemarks}
                        onChange={(e) => setBulkRemarks(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button className="btn btn-success" onClick={handleBulkMarkPaid}>
                          Mark Selected as Paid
                        </button>
                        <button className="btn btn-outline" onClick={clearSelection}>
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {localData.length === 0 && consultant && (
              <div className="text-center py-16 text-gray-500">No records found.</div>
            )}
          </div>
        </MiddleSection>
      </div>
    </Suspense>
  );
};

export default withAuth(LabSummary);
