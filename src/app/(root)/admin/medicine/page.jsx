"use client";

import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import Tab from "@/components/Tab";
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
import { TabLinks } from "@/utils/tablinks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { lazy, Suspense, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import Select from "react-select";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const emptyForm = {
  name: "",
  mrp: "",
  unit_type: "",
  category: null,
};

const MedicineRecords = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(emptyForm);
  const [isModalOpen, setModalOpen] = useState(false);
  // Add pagination and search states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  // Updated query to include pagination and search parameters
  const {
    data: medicine,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["medicilelist", page, limit, searchTerm],
    queryFn: () =>
      fetchData(
        `/admin/medicine?page=${page}&limit=${limit}&name=${searchTerm}`
      ),
  });

  // Fetch medicine categories
  const { data: categories } = useQuery({
    queryKey: ["medicineCategories"],
    queryFn: () => fetchData("/admin/medicine/category"),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (newService) => createData("/admin/medicine", newService),
    onSuccess: () => {
      queryClient.invalidateQueries(["medicilelist"]);
      SuccessHandling("Medicine created successfully");
      setModalOpen(false);
      setFormData(emptyForm);
      refetch();
    },
    onError: (error) => ErrorHandeling(error),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (newdata) =>
      updateData("/admin/medicine", newdata._id, newdata),
    onSuccess: (data) => {
      queryClient.invalidateQueries(["medicilelist"]);
      setModalOpen(false);
      SuccessHandling(data?.message);
      setFormData(emptyForm);
      refetch();
    },
    onError: (error) => ErrorHandeling(error),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteData("/admin/medicine", id),
    onSuccess: (data) => {
      queryClient.invalidateQueries(["medicilelist"]);
      SuccessHandling(data?.message);
      refetch();
    },
    onError: (error) => ErrorHandeling(error),
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCategoryChange = (selectedOption) => {
    setFormData({ ...formData, category: selectedOption?.value || null });
  };

  const handleUpdate = () => {
    updateMutation.mutate(formData);
  };

  const handleSubmit = () => {
    createMutation.mutate(formData);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this medicine?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      ...item,
      category: item.category?._id || item.category || null,
      isEditing: true,
    });
    setModalOpen(true);
  };

  const categoryOptions = categories?.data?.map((category) => ({
    value: category._id,
    label: category.name,
  }));

  // Search handler
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page when searching
  };

  // Pagination handlers
  const goToPreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const goToNextPage = () => {
    if (page < medicine?.pagination?.totalPages) setPage(page + 1);
  };

  return (
    <>
      <Suspense fallback={<Loading />}>
        <div className="flex flex-wrap w-full justify-between">
          <Tab tabs={TabLinks} category="Inventory" />
          <MiddleSection>
            <div className="w-full">
              <Heading heading="Medicine Record">
                <FixedLayout
                  btnname="Add Medicine"
                  isOpen={isModalOpen}
                  onOpen={() => setModalOpen(true)}
                  onClose={() => {
                    setModalOpen(false);
                    setFormData(emptyForm);
                  }}
                >
                  <div className="w-full p-6">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Medicine Name<span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Medicine Charge
                          </label>
                          <input
                            type="text"
                            name="mrp"
                            value={formData.mrp}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Medicine Unit Type
                          </label>
                          <input
                            type="text"
                            name="unit_type"
                            value={formData.unit_type}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                          </label>
                          <Select
                            options={categoryOptions}
                            value={categoryOptions?.find(
                              (option) => option.value === formData.category
                            ) || null}
                            onChange={handleCategoryChange}
                            placeholder="Select Category"
                            isClearable
                            className="react-select-container"
                            classNamePrefix="react-select"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        {formData.isEditing ? (
                          <button
                            onClick={handleUpdate}
                            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-secondary"
                          >
                            Update {updateMutation.isPending && <Spinner />}
                          </button>
                        ) : (
                          <button
                            onClick={handleSubmit}
                            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-secondary"
                          >
                            Submit {createMutation.isPending && <Spinner />}
                          </button>
                        )}
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
                      <th className="px-4 py-3">Medicine Name</th>
                      <th className="px-4 py-3">Charge</th>
                      <th className="px-4 py-3">Unit Type</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Current Stock</th>
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
                    {medicine?.data?.map((med) => (
                      <tr key={med._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{med?.name}</td>
                        <td className="px-4 py-3">{med?.mrp}</td>
                        <td className="px-4 py-3">{med?.unit_type}</td>
                        <td className="px-4 py-3">{med?.category?.name || "-"}</td>
                        <td className="px-4 py-3">{med?.current_stock ?? 0}</td>
                        <td className="px-4 py-3 flex space-x-2">
                          <button
                            onClick={() => handleEdit(med)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <FaEdit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(med._id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FaTrash className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {medicine?.pagination && (
              <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600">
                  Showing{" "}
                  <span className="font-medium">{(page - 1) * limit + 1}</span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(page * limit, medicine.pagination.total)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">
                    {medicine.pagination.total}
                  </span>{" "}
                  entries
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={goToPreviousPage}
                    disabled={page === 1}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      page === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    Previous
                  </button>
                  <div className="flex items-center px-4 py-2 text-sm text-gray-700">
                    Page {page} of {medicine.pagination.totalPages}
                  </div>
                  <button
                    onClick={goToNextPage}
                    disabled={page === medicine.pagination.totalPages}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      page === medicine.pagination.totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </MiddleSection>
        </div>
      </Suspense>
    </>
  );
};

export default withAuth(MedicineRecords);
