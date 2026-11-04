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
import Select from 'react-select'; 

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const PathologyRecords = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    pathology_category: "",
    pathology_testname: "",
    unit: "",
    ref_value: "",
  });
  const [isModalOpen, setModalOpen] = useState(false);

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["pathologycategories"],
    queryFn: () => fetchData("/admin/pathology/category"),
  });

  const categoryOptions =
    categories?.data?.map((category) => ({
      value: category._id,
      label: category.pathology_category,
    })) || [];

  // Fetch services
  const {
    data: services,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["pathologyservices"],
    queryFn: () => fetchData("/admin/pathology/record"),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (newService) =>
      createData("/admin/pathology/record", newService),
    onSuccess: () => {
      queryClient.invalidateQueries(["pathologyservices"]);
      SuccessHandling("Service created successfully");
      setModalOpen(false);
      setFormData({
        pathology_category: "",
        pathology_testname: "",
        unit: "",
        ref_value: "",
      });
    },
    onError: (error) => ErrorHandeling(error),
  });

  // Delete mutation
  const updateMutation = useMutation({
    mutationFn: (newdata) =>
      updateData("/admin/pathology/record", newdata._id, newdata),
    onSuccess: (data) => {
      queryClient.invalidateQueries(["pathologyservices"]);
      SuccessHandling(data.message);
      setModalOpen(false);
      setFormData({
        pathology_category: "",
        pathology_testname: "",
        unit: "",
        ref_value: "",
      });
    },
    onError: (error) => ErrorHandeling(error),
  });
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteData("/admin/pathology/record", id),
    onSuccess: () => {
      queryClient.invalidateQueries(["pathologyservices"]);
      SuccessHandling("Test deleted successfully");
    },
    onError: (error) => ErrorHandeling(error),
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = () => {
    if (!formData.pathology_category || !formData.pathology_testname) {
      ErrorHandeling({ message: "Category and Test Name are required" });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      ...item,
      pathology_category: item?.pathology_category?._id,
      isEditing: true,
    });
    setModalOpen(true);
  };

  const handleUpdate = () => {
    updateMutation.mutate(formData);
  };

  return (
    <>
      <Suspense fallback={<Loading />}>
        <div className="flex flex-wrap w-full justify-between">
          <MiddleSection>
            <div className="w-full">
              <Heading heading="Pathology Services">
                <FixedLayout
                  btnname="Add Test"
                  isOpen={isModalOpen}
                  onOpen={() => setModalOpen(true)}
                  onClose={() => setModalOpen(false)}
                >
                  <div className="w-full p-6">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category Name<span className="text-red-500">*</span>
                          </label>
                          <Select
                            options={categoryOptions}
                            value={categoryOptions.find(
                              (option) =>
                                option.value === formData.pathology_category
                            )}
                            onChange={(selectedOption) =>
                              setFormData({
                                ...formData,
                                pathology_category: selectedOption.value,
                              })
                            }
                            isSearchable
                            placeholder="Select Category"
                            className="react-select-container"
                            classNamePrefix="react-select"
                            noOptionsMessage={() => "No categories found"}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pathology Test
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="pathology_testname"
                            value={formData.pathology_testname}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pathology Unit
                          </label>
                          <input
                            type="text"
                            name="unit"
                            value={formData.unit}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reference Value
                          </label>
                          <input
                            type="text"
                            name="ref_value"
                            value={formData.ref_value}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        {formData.isEditing ? (
                          <button
                            onClick={handleUpdate}
                            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-secondary"
                          >
                            Update {updateMutation.isPending && <Spinner />}{" "}
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
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Test Name</th>
                      <th className="px-4 py-3">Unit</th>
                      <th className="px-4 py-3">Reference Value</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoading && (
                      <tr>
                        <td colSpan="5" className="text-center py-4">
                          <Loading />
                        </td>
                      </tr>
                    )}
                    {services?.data?.map((service) => (
                      <tr key={service._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {service.pathology_category?.pathology_category}
                        </td>
                        <td className="px-4 py-3">
                          {service.pathology_testname}
                        </td>
                        <td className="px-4 py-3">{service.unit}</td>
                        <td className="px-4 py-3">{service.ref_value}</td>
                        <td className="px-4 py-3 flex space-x-2">
                          <button
                            onClick={() => handleEdit(service)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <FaEdit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(service._id)}
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
          </MiddleSection>
        </div>
      </Suspense>
    </>
  );
};

export default withAuth(PathologyRecords);
