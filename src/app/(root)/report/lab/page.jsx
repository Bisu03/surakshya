"use client";
import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import { getDate } from "@/lib/currentDate";
import { fetchData } from "@/services/apiService";
import { ErrorHandeling } from "@/utils/errorHandling";
import React, { lazy, Suspense, useState, useRef, useMemo } from "react";
import { CSVLink } from "react-csv";
import { useReactToPrint } from "react-to-print";
import { formatDate } from "@/lib/formateDate";
import Spinner from "@/components/ui/Spinner";
import { withAuth } from "@/services/withAuth";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const LabReport = () => {
  const [startDate, setStartDate] = useState(getDate());
  const [endDate, setEndDate] = useState(getDate());
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const tableRef = useRef(null);
  const contentRef = useRef(null);
  const handlePrint = useReactToPrint({ contentRef });

  // CSV export: reflect new model fields
  const csvData = [
    [
      "UHID",
      "Bill No",
      "Patient Name",
      "Consultant",
      "Reporting Date",
      "Total Amount",
      "Discount",
      "Net Total",
      "Total Paid",
      "Due",
      "Payments",
    ],
    ...tableData.map((item) => {
      const paidInRange = (item.payments_in_range || []).reduce(
        (sum, p) => sum + (Number(p.amount) || 0),
        0
      );
      const dueInRange = (item.amount?.netTotal || 0) - paidInRange;
      return [
        item.mrd_id,
        item.bill_no,
        item.patient?.fullname || "",
        item.consultant?.drname || "",
        item.reporting_date,
        item.amount?.total || 0,
        item.amount?.discount || 0,
        item.amount?.netTotal || 0,
        paidInRange,
        dueInRange > 0 ? dueInRange : 0,
        item.payments && item.payments.length > 0
          ? item.payments
              .map(
                (p) =>
                  `${p.mode}: ₹${p.amount}${p.remark ? ` (${p.remark})` : ""}${
                    p.date ? ` (${formatDate(p.date)})` : ""
                  }`
              )
              .join("; ")
          : item.paidby || "N/A",
      ];
    }),
  ];

  const handleGetdetails = async () => {
    try {
      setLoading(true);
      const { data } = await fetchData(
        `/report/lab?startDate=${startDate}&endDate=${endDate}`
      );
      setTableData(data);
    } catch (error) {
      ErrorHandeling(error);
    } finally {
      setLoading(false);
    }
  };

  // Totals for new model, recalculate totalPaid and due from filtered payments
  const totals = useMemo(() => {
    return tableData.reduce(
      (acc, item) => {
        const paid = (item.payments_in_range || []).reduce(
          (sum, p) => sum + (Number(p.amount) || 0),
          0
        );
        const due = (item.amount?.netTotal || 0) - paid;
        return {
          totalTests: acc.totalTests + 1,
          totalAmount: acc.totalAmount + (item.amount?.total || 0),
          totalDiscount: acc.totalDiscount + (item.amount?.discount || 0),
          totalNet: acc.totalNet + (item.amount?.netTotal || 0),
          totalPaid: acc.totalPaid + paid,
          totalDue: acc.totalDue + (due > 0 ? due : 0),
        };
      },
      {
        totalTests: 0,
        totalAmount: 0,
        totalDiscount: 0,
        totalNet: 0,
        totalPaid: 0,
        totalDue: 0,
      }
    );
  }, [tableData]);

  // Calculate collections by payment method
  const paymentCollections = useMemo(() => {
    return tableData.reduce(
      (acc, item) => {
        (item.payments_in_range || []).forEach((payment) => {
          const mode = (payment.mode || "").toLowerCase();
          const amount = Number(payment.amount) || 0;
          // Combined methods (e.g. "Ayushman Bharat + Cash") are a single
          // amount with no split, so they are totalled on their own line
          // instead of being forced into a single-method bucket.
          if (mode.includes("+")) {
            acc.combined += amount;
          } else if (mode === "cash") {
            acc.cash += amount;
          } else if (mode === "upi") {
            acc.upi += amount;
          } else if (mode === "cashless") {
            acc.cashless += amount;
          } else if (mode === "sasthyasathi") {
            acc.sasthyasathi += amount;
          } else if (mode === "ayushman bharat") {
            acc.ayushmanBharat += amount;
          }
        });
        return acc;
      },
      { cash: 0, upi: 0, cashless: 0, sasthyasathi: 0, ayushmanBharat: 0, combined: 0 }
    );
  }, [tableData]);

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex flex-wrap w-full justify-between">
        <MiddleSection>
          <div className="w-full">
            <Heading heading="Lab Test Report"></Heading>

            {/* Date Filters and Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full md:w-auto">
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 justify-start md:justify-end">
                <button
                  className="btn btn-primary w-full sm:w-auto"
                  onClick={handleGetdetails}
                  disabled={loading || !startDate || !endDate}
                >
                  {loading ? <Spinner /> : "Search"}
                </button>

                <div className="flex flex-col sm:flex-row gap-2">
                  <CSVLink
                    data={csvData}
                    filename={`Lab_Report_${startDate}_to_${endDate}.csv`}
                    className="btn btn-success w-full sm:w-auto"
                    target="_blank"
                  >
                    Export Excel
                  </CSVLink>

                  <button
                    className="btn btn-error w-full sm:w-auto"
                    onClick={handlePrint}
                    disabled={tableData.length === 0}
                  >
                    Export PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Totals Section */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="stats shadow bg-info text-info-content">
                <div className="stat">
                  <div className="stat-title">Total Tests</div>
                  <div className="stat-value text-2xl md:text-3xl">
                    {totals.totalTests}
                  </div>
                </div>
              </div>
              <div className="stats shadow bg-blue-200 text-blue-900">
                <div className="stat">
                  <div className="stat-title">Total Amount</div>
                  <div className="stat-value text-2xl md:text-3xl">
                    ₹{totals.totalAmount.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="stats shadow bg-yellow-100 text-yellow-900">
                <div className="stat">
                  <div className="stat-title">Total Discount</div>
                  <div className="stat-value text-2xl md:text-3xl">
                    ₹{totals.totalDiscount.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="stats shadow bg-success text-success-content">
                <div className="stat">
                  <div className="stat-title">Total Paid</div>
                  <div className="stat-value text-2xl md:text-3xl">
                    ₹{totals.totalPaid.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="stats shadow bg-warning text-warning-content">
                <div className="stat">
                  <div className="stat-title">Total Due</div>
                  <div className="stat-value text-2xl md:text-3xl">
                    ₹{totals.totalDue.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Collections Box */}
            <div className="mb-6">
              <div className="stats shadow bg-gradient-to-r from-purple-50 to-purple-100 text-purple-900">
                <div className="stat">
                  <div className="stat-title">Collections by Payment Method</div>
                  <div className="flex flex-wrap gap-4">
                    <div>
                      <span className="font-semibold">Cash:</span> ₹
                      {paymentCollections.cash.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-semibold">UPI:</span> ₹
                      {paymentCollections.upi.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-semibold">Cashless:</span> ₹
                      {paymentCollections.cashless.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-semibold">Sasthyasathi:</span> ₹
                      {paymentCollections.sasthyasathi.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-semibold">Ayushman Bharat:</span> ₹
                      {paymentCollections.ayushmanBharat.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-semibold">Combined:</span> ₹
                      {paymentCollections.combined.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Table */}
            {tableData.length > 0 && (
              <div className="overflow-x-auto" ref={tableRef}>
                <table ref={contentRef} className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>UHID</th>
                      <th>Bill No</th>
                      <th>Patient Name</th>
                      <th>Consultant</th>
                      <th>Reporting Date</th>
                      <th>Total Amount</th>
                      <th>Discount</th>
                      <th>Net Total</th>
                      <th>Total Paid</th>
                      <th>Due</th>
                      <th>Payments</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((item, index) => {
                      const paid = (item.payments_in_range || []).reduce(
                        (sum, p) => sum + (Number(p.amount) || 0),
                        0
                      );
                      const due = (item.amount?.netTotal || 0) - paid;
                      return (
                        <tr key={index}>
                          <td>{item.mrd_id}</td>
                          <td>{item.bill_no}</td>
                          <td>{item.patient?.fullname || ""}</td>
                          <td>{item.consultant?.drname || ""}</td>
                          <td>{formatDate(item.reporting_date)}</td>
                          <td>₹{item.amount?.total || 0}</td>
                          <td>₹{item.amount?.discount || 0}</td>
                          <td>₹{item.amount?.netTotal || 0}</td>
                          <td>₹{paid}</td>
                          <td>₹{due > 0 ? due : 0}</td>
                          <td>
                            {item.payments && item.payments.length > 0 ? (
                              <div className="space-y-1">
                                {item.payments.map((p, idx) => {
                                  const inRange =
                                    item.payments_in_range &&
                                    item.payments_in_range.some(
                                      (pr) =>
                                        pr.amount === p.amount &&
                                        pr.mode === p.mode &&
                                        pr.date === p.date &&
                                        pr.remark === p.remark
                                    );
                                  return (
                                    <div
                                      key={idx}
                                      className={`text-xs ${
                                        inRange
                                          ? "font-bold text-blue-700"
                                          : "text-gray-700"
                                      }`}
                                    >
                                      <span className="font-semibold">
                                        {p.mode}
                                      </span>
                                      : ₹{p.amount}{" "}
                                      {p.remark && `(${p.remark})`}{" "}
                                      <span className="ml-1">
                                        [{formatDate(p.date)}]
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              item.paidby || "N/A"
                            )}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                due > 0 ? "badge-error" : "badge-success"
                              }`}
                            >
                              {due > 0 ? "Pending" : "Cleared"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {tableData.length === 0 && !loading && (
              <div className="text-center p-8 text-gray-500">
                No lab records found for the selected date range
              </div>
            )}
          </div>
        </MiddleSection>
      </div>
    </Suspense>
  );
};

export default withAuth(LabReport);
