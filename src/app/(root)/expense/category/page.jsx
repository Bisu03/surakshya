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
import { withAuth } from "@/services/withAuth";
import { ErrorHandeling } from "@/utils/errorHandling";
import { SuccessHandling } from "@/utils/successHandling";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import React, { lazy, Suspense, useState } from "react";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const ExpenseCategory = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ name: "", id: null });
  const [isModalOpen, setModalOpen] = useState(false);
  const { data: session } = useSession();
  // Fetch expense categories
  const {
    data: categories,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["expenseCategories"],
    queryFn: () => fetchData("/expense/category"),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (newCategory) => createData("/expense/category", newCategory),
    onSuccess: () => {
      queryClient.invalidateQueries(["expenseCategories"]);
      refetch();
      SuccessHandling("Category created successfully");
      setModalOpen(false);
      setFormData({ name: "", id: null });
    },
    onError: (error) => ErrorHandeling(error),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (updatedCategory) =>
      updateData("/expense/category", updatedCategory.id, {
        name: updatedCategory.name,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["expenseCategories"]);
      refetch();
      SuccessHandling("Category updated successfully");
      setModalOpen(false);
      setFormData({ name: "", id: null });
    },
    onError: (error) => ErrorHandeling(error),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteData("/expense/category", id),
    onSuccess: () => {
      queryClient.invalidateQueries(["expenseCategories"]);
      refetch();
      SuccessHandling("Category deleted successfully");
    },
    onError: (error) => ErrorHandeling(error),
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) return;

    if (formData.id) {
      updateMutation.mutate({ id: formData.id, name: formData.name });
    } else {
      createMutation.mutate({ name: formData.name });
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (category) => {
    setFormData({ name: category.name, id: category._id });
    setModalOpen(true);
  };

  if (isLoading) return <Loading />;
  if (error) return ErrorHandeling(error);

  return (
    <>
      <Suspense fallback={<Loading />}>
        <div className="flex flex-wrap w-full justify-between">
          <MiddleSection>
            <div className="w-full">
              <Heading heading="Expense Category">
                <FixedLayout
                  btnname="Add Category"
                  isOpen={isModalOpen}
                  onOpen={() => setModalOpen(true)}
                  onClose={() => {
                    setModalOpen(false);
                    setFormData({ name: "", id: null });
                  }}
                >
                  <div className="w-full p-6">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category Name<span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={handleSubmit}
                          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-secondary"
                          disabled={
                            createMutation.isPending || updateMutation.isPending
                          }
                        >
                          {formData.id ? "Update" : "Submit"}
                          {(createMutation.isPending ||
                            updateMutation.isPending) && <Spinner />}
                        </button>
                      </div>
                    </div>
                  </div>
                </FixedLayout>
              </Heading>
            </div>

            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-secondary text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <th className="px-4 py-3">Category Name</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categories?.data?.map((category) => (
                      <tr key={category._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{category?.name}</td>
                        {session?.user?.role === "Admin" && (
                          <td className="px-4 py-3 flex space-x-2">
                            <button
                              onClick={() => handleEdit(category)}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <FaEdit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(category._id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <FaTrash className="w-5 h-5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {categories?.data?.length === 0 && (
                  <p className="text-center text-gray-500 p-4">
                    No categories found
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

export default withAuth(ExpenseCategory);
