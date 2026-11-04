"use client";

import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import FixedLayout from "@/components/ui/FixedLayout";
import Spinner from "@/components/ui/Spinner";
import {
  createData,
  deleteData,
  fetchData,
  updateData,
} from "@/services/apiService";
import { formatDate } from "@/lib/formateDate";
import { withAuth } from "@/services/withAuth";
import { ErrorHandeling } from "@/utils/errorHandling";
import { SuccessHandling } from "@/utils/successHandling";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import Select from "react-select";
import { FaEdit, FaFileExcel, FaPlus, FaPrint, FaTrash } from "react-icons/fa";
import { getDate } from "@/lib/currentDate";
import { useReactToPrint } from "react-to-print";
import * as XLSX from "xlsx";
import { useSession } from "next-auth/react";
import { hasPermission } from "@/lib/permissions";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const AddExpense = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    categoryID: null,
    desc: "",
    expense: "",
    date: getDate(),
  });
  const [isModalOpen, setModalOpen] = useState(false);
  // Fetch expenses
  const [startDate, setStartDate] = useState(getDate());
  const [endDate, setEndDate] = useState(getDate());
  const contentRef = useRef(null);
  const { data: session } = useSession();
  const handlePrint = useReactToPrint({ contentRef });

  // Fetch expense categories
  const { data: categories } = useQuery({
    queryKey: ["expenseCategories"],
    queryFn: () => fetchData("/expense/category"),
  });

  const {
    data: expenses,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["expenses", startDate, endDate],
    queryFn: () =>
      fetchData(`/expense/create?start=${startDate}&end=${endDate}`),
  });

  useEffect(() => {
    refetch();
  }, [startDate, endDate]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (newExpense) => createData("/expense/create", newExpense),
    onSuccess: () => {
      queryClient.invalidateQueries(["expenses"]);
      refetch();
      SuccessHandling("Expense added successfully");
      setModalOpen(false);
      resetForm();
    },
    onError: (error) => ErrorHandeling(error),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (updatedExpense) =>
      updateData("/expense/create", updatedExpense._id, updatedExpense),
    onSuccess: () => {
      queryClient.invalidateQueries(["expenses"]);
      refetch();
      resetForm();
      SuccessHandling("Expense updated successfully");
      setModalOpen(false);
    },
    onError: (error) => ErrorHandeling(error),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteData("/expense/create", id),
    onSuccess: () => {
      queryClient.invalidateQueries(["expenses"]);
      refetch();
      SuccessHandling("Expense deleted successfully");
    },
    onError: (error) => ErrorHandeling(error),
  });

  const resetForm = () => {
    setFormData({
      categoryID: null,
      desc: "",
      expense: "",
      date: getDate(),
    });
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCategoryChange = (selectedOption) => {
    setFormData({ ...formData, categoryID: selectedOption.value });
  };

  const handleSubmit = () => {
    const payload = {
      ...formData,
      ...(formData._id && { _id: formData._id }),
    };

    if (formData._id) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (expense) => {
    setFormData({
      ...expense,
      categoryID: expense.categoryID?._id || expense.categoryID,
    });
    setModalOpen(true);
  };

  if (isLoading) return <Loading />;
  if (error) return ErrorHandeling(error);

  const categoryOptions = categories?.data?.map((category) => ({
    value: category._id,
    label: category.name,
  }));

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      expenses?.data?.map((expense) => ({
        Category: expense?.categoryID?.name,
        Description: expense?.desc,
        Amount: Number(expense?.expense) || 0,
        Date: expense?.date,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expense Records");
    XLSX.writeFile(workbook, `expense${startDate}_${endDate}.xlsx`);
  };

  const totalEntries = expenses?.data?.length || 0;
  const totalExpenseAmount =
    expenses?.data?.reduce((acc, exp) => acc + Number(exp?.expense || 0), 0) ||
    0;

  return (
    <>
      <Suspense fallback={<Loading />}>
        <div className="flex flex-wrap w-full justify-between">
          <MiddleSection>
            <div className="w-full">
              <Heading heading="Expense">
                <div className="flex flex-wrap w-full justify-end items-center gap-2 sm:gap-4">
                  <FixedLayout
                    btnname="Add Expense"
                    isOpen={isModalOpen}
                    onOpen={() => setModalOpen(true)}
                    onClose={() => {
                      setModalOpen(false);
                      resetForm();
                    }}
                  >
                    <div className="w-full p-6">
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                          <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Category<span className="text-red-500">*</span>
                            </label>
                            <Select
                              options={categoryOptions}
                              value={categoryOptions?.find(
                                (option) => option.value === formData.categoryID
                              )}
                              onChange={handleCategoryChange}
                              placeholder="Select Category"
                              className="react-select-container"
                              classNamePrefix="react-select"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <input
                              type="text"
                              name="desc"
                              value={formData.desc}
                              onChange={handleInputChange}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Amount
                            </label>
                            <input
                              type="number"
                              name="expense"
                              value={formData.expense}
                              onChange={handleInputChange}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Date
                            </label>
                            <input
                              type="date"
                              name="date"
                              value={formData.date}
                              onChange={handleInputChange}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={handleSubmit}
                            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-secondary"
                            disabled={
                              createMutation.isPending ||
                              updateMutation.isPending
                            }
                          >
                            {formData._id ? "Update" : "Submit"}
                            {(createMutation.isPending ||
                              updateMutation.isPending) && <Spinner />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </FixedLayout>

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
                </div>
              </Heading>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 print-hidden">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-sm font-semibold text-gray-600">
                  Total Entries
                </h3>
                <p className="text-2xl font-bold text-primary">
                  {totalEntries}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-sm font-semibold text-gray-600">
                  Total Expense Amount
                </h3>
                <p className="text-2xl font-bold text-primary">
                  ₹{totalExpenseAmount?.toLocaleString()}
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

            <div className="p-6">
              <div className="overflow-x-auto">
                <table ref={contentRef} className="w-full">
                  <thead>
                    <tr className="bg-secondary text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 print:hidden">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {expenses?.data?.map((expense) => (
                      <tr key={expense._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {expense?.categoryID?.name}
                        </td>
                        <td className="px-4 py-3">{expense?.desc}</td>
                        <td className="px-4 py-3">{expense?.expense}</td>
                        <td className="px-4 py-3">
                          {formatDate(expense?.date)}
                        </td>
                        {(hasPermission(session?.user, "expenses", "edit") ||
                          hasPermission(session?.user, "expenses", "delete")) && (
                          <td className="px-4 py-3 flex space-x-2 print:hidden">
                            {hasPermission(session?.user, "expenses", "edit") && (
                              <button
                                onClick={() => handleEdit(expense)}
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <FaEdit className="w-5 h-5" />
                              </button>
                            )}
                            {hasPermission(session?.user, "expenses", "delete") && (
                              <button
                                onClick={() => handleDelete(expense._id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <FaTrash className="w-5 h-5" />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {expenses?.data?.length === 0 && (
                  <p className="text-center text-gray-500 p-4">
                    No expenses found
                  </p>
                )}
              </div>
            </div>
          </MiddleSection>
        </div>
      </Suspense>
    </>
  );
};

export default withAuth(AddExpense);
