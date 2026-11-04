"use client";

import React, { lazy, Suspense, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createData, deleteData, fetchData, updateData } from "@/services/apiService";
import { SuccessHandling } from "@/utils/successHandling";
import { ErrorHandeling } from "@/utils/errorHandling";
import Loading from "@/components/Loading";
import Heading from "@/components/Heading";
import { withAuth } from "@/services/withAuth";
import FixedLayout from "@/components/ui/FixedLayout";
import Tab from "@/components/Tab";
import { TabLinks } from "@/utils/tablinks";
import Spinner from "@/components/ui/Spinner";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const emptyForm = { name: "", isEditing: false, _id: null };

const MedicineCategory = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["medicineCategories"],
    queryFn: () => fetchData("/admin/medicine/category"),
  });

  const createMutation = useMutation({
    mutationFn: (newCategory) => createData("/admin/medicine/category", newCategory),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["medicineCategories"] });
      SuccessHandling(data.message || "Category created successfully");
      setModalOpen(false);
      setFormData(emptyForm);
    },
    onError: (error) => ErrorHandeling(error),
  });

  const updateMutation = useMutation({
    mutationFn: (updatedCategory) =>
      updateData("/admin/medicine/category", updatedCategory._id, updatedCategory),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["medicineCategories"] });
      SuccessHandling(data.message || "Category updated successfully");
      setModalOpen(false);
      setFormData(emptyForm);
    },
    onError: (error) => ErrorHandeling(error),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteData("/admin/medicine/category", id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["medicineCategories"] });
      SuccessHandling(data.message || "Category deleted successfully");
    },
    onError: (error) => ErrorHandeling(error),
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      ErrorHandeling("Category name is required");
      return;
    }
    if (formData.isEditing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (category) => {
    setModalOpen(true);
    setFormData({ name: category.name || "", isEditing: true, _id: category._id });
  };

  const filteredData = data?.data?.filter((category) =>
    category.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex flex-wrap w-full justify-between">
        <Tab tabs={TabLinks} category="Inventory" />
        <MiddleSection>
          <div className="w-full">
            <Heading heading="Medicine Categories">
              <FixedLayout
                btnname="Add Category"
                isOpen={isModalOpen}
                onOpen={() => setModalOpen(true)}
                onClose={() => {
                  setModalOpen(false);
                  setFormData(emptyForm);
                }}
              >
                <div className="w-full p-6">
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category Name<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                        required
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={handleSubmit}
                        disabled={createMutation.isPending || updateMutation.isPending}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {formData.isEditing ? "Update" : "Submit"}
                        {(createMutation.isPending || updateMutation.isPending) && <Spinner />}
                      </button>
                    </div>
                  </div>
                </div>
              </FixedLayout>
            </Heading>
          </div>

          <div className="px-6 pb-2 flex justify-end">
            <input
              type="text"
              placeholder="Search Category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm w-full max-w-xs"
            />
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
                  {isLoading && (
                    <tr>
                      <td colSpan="2" className="text-center py-4">
                        <Loading />
                      </td>
                    </tr>
                  )}
                  {error && (
                    <tr>
                      <td colSpan="2" className="text-center py-4 text-red-500">
                        Error loading categories: {error.message}
                      </td>
                    </tr>
                  )}
                  {filteredData?.length > 0 ? (
                    filteredData.map((category) => (
                      <tr key={category._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{category.name}</td>
                        <td className="px-4 py-3 flex space-x-3">
                          <button
                            onClick={() => handleEdit(category)}
                            className="text-neutral hover:text-black focus:outline-none p-1"
                          >
                            <FaEdit className="h-6 w-6" />
                          </button>
                          <button
                            onClick={() => handleDelete(category._id)}
                            className="text-error hover:text-black focus:outline-none p-1"
                          >
                            <FaTrash className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="text-center py-4 text-gray-500">
                        No categories found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </MiddleSection>
      </div>
    </Suspense>
  );
};

export default withAuth(MedicineCategory);
