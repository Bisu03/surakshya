"use client";

import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import Tab from "@/components/Tab";
import FixedLayout from "@/components/ui/FixedLayout";
import Spinner from "@/components/ui/Spinner";
import { createData, deleteData, fetchData, updateData } from "@/services/apiService";
import { withAuth } from "@/services/withAuth";
import { ErrorHandeling } from "@/utils/errorHandling";
import { SuccessHandling } from "@/utils/successHandling";
import { TabLinks } from "@/utils/tablinks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { lazy, Suspense, useEffect, useReducer, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";

const MiddleSection = lazy(() => import("@/components/Middlesection"));
const Services = () => {
  const queryClient = useQueryClient();
  const [ServiceInfor, setServiceInfor] = useState({});
  const [isModalOpen, setModalOpen] = useState(false);

  const handleChange = (e) => {
    setServiceInfor({ ...ServiceInfor, [e.target.name]: e.target.value });
  };

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["servicerecord"], // Unique query key
    queryFn: () => fetchData("/admin/service"), // Function to fetch data
  });

  const handleSubmit = async () => {
    try {
      const { data } = await createData("/admin/service", ServiceInfor);
      SuccessHandling(data?.data?.message);
      setModalOpen(false);
      refetch();
    } catch (error) {
      ErrorHandeling(error);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteData("/admin/service", id),
    onSuccess: () => {
      queryClient.invalidateQueries(["servicerecord"]);
      SuccessHandling("Service deleted successfully");
      refetch();
    },
    onError: (error) => ErrorHandeling(error),
  });

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (item) => {
    setServiceInfor({ ...item, isEditing: true });
    setModalOpen(true);
  };

  const mutationUpdate = useMutation({
    mutationFn: (newItem) =>
      updateData("/admin/service", newItem?._id, newItem),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["servicerecord"] }); // Refetch data after adding
      setServiceInfor({});
      refetch();
      SuccessHandling(data.message);
      setModalOpen(false);
    },
    onError: (error) => {
      ErrorHandeling(error);
      setModalOpen(false);
    },
  });

  const handleUpdate = async () => {
    mutationUpdate.mutate(ServiceInfor);
  };

  return (
    <>
      <Suspense fallback={<Loading />}>
        <div className="flex flex-wrap w-full justify-between">
          <Tab tabs={TabLinks} category="Services" />
          <MiddleSection>
            <div className="w-full">
              <Heading heading="Service List  ">
                <FixedLayout
                  btnname="Add Service"
                  isOpen={isModalOpen}
                  onOpen={() => setModalOpen(true)}
                  onClose={() => setModalOpen(false)}
                >
                  <div className="w-full  p-6">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Service Name
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="servicename"
                            value={ServiceInfor.servicename}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                   transition-all duration-200 shadow-sm"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Unit Type
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="unittype"
                            value={ServiceInfor?.unittype}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                   transition-all duration-200 shadow-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Unit Charge
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="unitcharge"
                            value={ServiceInfor?.unitcharge}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                   transition-all duration-200 shadow-sm"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        {ServiceInfor?.isEditing ? (
                          <button
                            onClick={handleUpdate}
                            className="px-6 py-2 bg-primary text-white rounded-lg
                 hover:bg-secondary "
                          >
                            Update {mutationUpdate.isPending && <Spinner />}
                          </button>
                        ) : (
                          <button
                            onClick={handleSubmit}
                            className="px-6 py-2 bg-primary text-white rounded-lg
                 hover:bg-secondary "
                          >
                            Submit
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
                      <th className="px-4 py-3">Service Name</th>
                      <th className="px-4 py-3">Unit Type</th>
                      <th className="px-4 py-3 ">Unit Charge</th>
                      <th className="px-4 py-3 ">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data?.data?.map((service) => (
                      <tr key={service._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{service?.servicename}</td>
                        <td className="px-4 py-3">{service?.unittype}</td>
                        <td className="px-4 py-3">{service?.unitcharge}</td>
                        <td className="w-full flex space-x-3">
                          <button
                            onClick={() => handleEdit(service)}
                            className="text-neutral hover:text-black focus:outline-none p-1"
                          >
                            <FaEdit className="h-6 w-6" />
                          </button>

                          <button
                            onClick={() => handleDelete(service?._id)}
                            className="text-error hover:text-black focus:outline-none p-1"
                            aria-label={`Delete ${service?.username}`}
                          >
                            <FaTrash className="h-4 w-4" />
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

export default withAuth(Services);
