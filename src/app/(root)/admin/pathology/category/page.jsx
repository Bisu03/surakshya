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

const PathologyCategory = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    pathology_category: "",
    referral_comission: "",
    doctor_comission: "",
    pathology_charge: "",
    isEditing: false,
    _id: null,
  });
  const [search, setSearch] = useState(""); // <-- Add search state

  const { data, isLoading, error } = useQuery({
    queryKey: ["pathologycategories"],
    queryFn: () => fetchData("/admin/pathology/category"),
  });

  const createMutation = useMutation({
    mutationFn: (newCategory) => createData("/admin/pathology/category", newCategory),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pathologycategories"] });
      SuccessHandling(data.message || "Category created successfully");
      setModalOpen(false);
      setFormData({
        pathology_category: "",
        referral_comission: "",
        doctor_comission: "",
        pathology_charge: "",
        isEditing: false,
        _id: null,
      });
    },
    onError: (error) => ErrorHandeling(error.message || "Failed to create category"),
  });

  const updateMutation = useMutation({
    mutationFn: (updatedCategory) => updateData("/admin/pathology/category", updatedCategory._id, updatedCategory),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pathologycategories"] });
      SuccessHandling(data.message || "Category updated successfully");
      setModalOpen(false);
      setFormData({
        pathology_category: "",
        referral_comission: "",
        doctor_comission: "",
        pathology_charge: "",
        isEditing: false,
        _id: null,
      });
    },
    onError: (error) => ErrorHandeling(error.message || "Failed to update category"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteData("/admin/pathology/category", id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pathologycategories"] });
      SuccessHandling(data.message || "Category deleted successfully");
    },
    onError: (error) => ErrorHandeling(error.message || "Failed to delete category"),
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.pathology_category.trim()) {
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
    setFormData({
      pathology_category: category.pathology_category || "",
      referral_comission: category.referral_comission || "",
      doctor_comission: category.doctor_comission || "",
      pathology_charge: category.pathology_charge || "",
      isEditing: true,
      _id: category._id,
    });
  };

  // Filtered data based on search
  const filteredData = data?.data?.filter((category) =>
    category.pathology_category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex flex-wrap w-full justify-between">
        <Tab tabs={TabLinks} category="Pathology" />
        <MiddleSection>
          <div className="w-full">
            <Heading heading="Pathology Categories">
              <FixedLayout
                btnname="Add Category"
                isOpen={isModalOpen}
                onOpen={() => setModalOpen(true)}
                onClose={() => {
                  setModalOpen(false);
                  setFormData({
                    pathology_category: "",
                    referral_comission: "",
                    doctor_comission: "",
                    pathology_charge: "",
                    isEditing: false,
                    _id: null,
                  });
                }}
              >
                <div className="w-full p-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category Name<span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="pathology_category"
                          value={formData.pathology_category}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pathology Charge
                        </label>
                        <input
                          type="text"
                          name="pathology_charge"
                          value={formData.pathology_charge}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Referral Commission
                        </label>
                        <input
                          type="text"
                          name="referral_comission"
                          value={formData.referral_comission}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Doctor Commission
                        </label>
                        <input
                          type="text"
                          name="doctor_comission"
                          value={formData.doctor_comission}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                        />
                      </div>
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

          {/* Search Input */}
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
                    <th className="px-4 py-3">Charge</th>
                    <th className="px-4 py-3">Referral Commission</th>
                    <th className="px-4 py-3">Doctor Commission</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading && (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        <Loading />
                      </td>
                    </tr>
                  )}
                  {error && (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-red-500">
                        Error loading categories: {error.message}
                      </td>
                    </tr>
                  )}
                  {filteredData?.length > 0 ? (
                    filteredData.map((category) => (
                      <tr key={category._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{category.pathology_category}</td>
                        <td className="px-4 py-3">₹{category.pathology_charge || "N/A"}</td>
                        <td className="px-4 py-3">₹{category.referral_comission || "N/A"}</td>
                        <td className="px-4 py-3">₹{category.doctor_comission || "N/A"}</td>

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
                      <td colSpan="6" className="text-center py-4 text-gray-500">
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

export default withAuth(PathologyCategory);