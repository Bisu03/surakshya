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

const ExpenseReport = () => {
  const [startDate, setStartDate] = useState(getDate());
  const [endDate, setEndDate] = useState(getDate());
  const [tableData, setTableData] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [loading, setLoading] = useState(false);
  const tableRef = useRef(null);
  const contentRef = useRef(null);
  const handlePrint = useReactToPrint({ contentRef });

  const csvData = [
    ["Date", "Category", "Description", "Amount"],
    ...tableData.map((item) => [
      item.date,
      item.categoryID?.name || "Uncategorized",
      item.desc,
      Number(item.expense) || 0,
    ]),
  ];

  const handleGetdetails = async () => {
    try {
      setLoading(true);
      const { data, categoryBreakdown } = await fetchData(
        `/report/expense?startDate=${startDate}&endDate=${endDate}`
      );
      setTableData(data || []);
      setCategoryBreakdown(categoryBreakdown || []);
    } catch (error) {
      ErrorHandeling(error);
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    return tableData.reduce(
      (acc, item) => ({
        totalEntries: acc.totalEntries + 1,
        totalExpenseAmount: acc.totalExpenseAmount + (Number(item.expense) || 0),
      }),
      { totalEntries: 0, totalExpenseAmount: 0 }
    );
  }, [tableData]);

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex flex-wrap w-full justify-between">
        <MiddleSection>
          <div className="w-full">
            <Heading heading="Expense Report"></Heading>

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
                    filename={`Expense_Report_${startDate}_to_${endDate}.csv`}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="stats shadow bg-info text-info-content">
                <div className="stat">
                  <div className="stat-title">Total Entries</div>
                  <div className="stat-value text-2xl md:text-3xl">
                    {totals.totalEntries}
                  </div>
                </div>
              </div>

              <div className="stats shadow bg-primary text-primary-content">
                <div className="stat">
                  <div className="stat-title">Total Expense Amount</div>
                  <div className="stat-value text-2xl md:text-3xl">
                    ₹{totals.totalExpenseAmount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            {categoryBreakdown.length > 0 && (
              <div className="mb-6">
                <div className="stats shadow bg-gradient-to-r from-purple-50 to-purple-100 text-purple-900">
                  <div className="stat">
                    <div className="stat-title">Expense by Category</div>
                    <div className="flex flex-wrap gap-4">
                      {categoryBreakdown.map((category) => (
                        <div key={String(category.categoryId)}>
                          <span className="font-semibold">
                            {category.name}:
                          </span>{" "}
                          ₹{Number(category.total || 0).toLocaleString()} (
                          {category.count})
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Data Table */}
            {tableData.length > 0 && (
              <div className="overflow-x-auto" ref={tableRef}>
                <table ref={contentRef} className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((item, index) => (
                      <tr key={item._id || index}>
                        <td>{formatDate(item.date)}</td>
                        <td>{item.categoryID?.name || "Uncategorized"}</td>
                        <td>{item.desc}</td>
                        <td>₹{Number(item.expense) || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold">
                      <td colSpan={3}>Total</td>
                      <td>₹{totals.totalExpenseAmount.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {tableData.length === 0 && !loading && (
              <div className="text-center p-8 text-gray-500">
                No expense records found for the selected date range
              </div>
            )}
          </div>
        </MiddleSection>
      </div>
    </Suspense>
  );
};

export default withAuth(ExpenseReport);
