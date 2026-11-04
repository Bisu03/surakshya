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
import React, { lazy, Suspense, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const radiologyRecords = () => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        test_name: "",
        test_charge: "",
    });
    const [isModalOpen, setModalOpen] = useState(false);
    const [search, setSearch] = useState(""); // <-- Add search state


    // Fetch services
    const { data: services, isLoading, error, refetch } = useQuery({
        queryKey: ["radiologytest"],
        queryFn: () => fetchData("/admin/radiology"),
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: (newService) => createData("/admin/radiology", newService),
        onSuccess: () => {
            queryClient.invalidateQueries(["radiologytest"]);
            SuccessHandling("Service created successfully");
            setModalOpen(false);
            setFormData({
                test_name: "",
                test_charge: "",
            });
            refetch()
        },
        onError: (error) => ErrorHandeling(error)
    });

    // Delete mutation
    const updateMutation = useMutation({
        mutationFn: (newdata) => updateData("/admin/radiology", newdata._id, newdata),
        onSuccess: (data) => {
            queryClient.invalidateQueries(["radiologytest"]);
            setModalOpen(false);
            SuccessHandling(data?.message);
            setFormData({
                test_name: "",
                test_charge: "",
            });
            refetch()
        },
        onError: (error) => ErrorHandeling(error)
    });
    const deleteMutation = useMutation({
        mutationFn: (id) => deleteData("/admin/radiology", id),
        onSuccess: (data) => {
            queryClient.invalidateQueries(["radiologytest"]);
            SuccessHandling(data?.message);
            refetch()
        },
        onError: (error) => ErrorHandeling(error)
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleUpdate = () => {
        updateMutation.mutate(formData);
    };

    const handleSubmit = () => {
        createMutation.mutate(formData);
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this service?")) {
            deleteMutation.mutate(id);
        }
    };


    const handleEdit = (item) => {
        setFormData({ ...item, isEditing: true });
        setModalOpen(true);
    };

    // Filtered services based on search
    const filteredServices = services?.data?.filter(service =>
        service.test_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <Suspense fallback={<Loading />}>
                <div className="flex flex-wrap w-full justify-between">
                    <Tab tabs={TabLinks} category="Radiology" />
                    <MiddleSection>
                        <div className="w-full">
                            <Heading heading="Radiology Services">
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
                                                        Radiology Test<span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="test_name"
                                                        value={formData.test_name}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Radiology Charge
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="test_charge"
                                                        value={formData.test_charge}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end">
                                                {
                                                    formData.isEditing ? (
                                                        <button
                                                            onClick={handleUpdate}
                                                            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-secondary"
                                                        >
                                                            Update {updateMutation.isPending && <Spinner />}
                                                        </button>
                                                    ) : <button
                                                        onClick={handleSubmit}
                                                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-secondary"
                                                    >
                                                        Submit  {createMutation.isPending && <Spinner />}
                                                    </button>

                                                }

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
                                placeholder="Search Test..."
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

                                            <th className="px-4 py-3">Test Name</th>
                                            <th className="px-4 py-3">Charge</th>
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
                                        {filteredServices?.length > 0 ? (
                                            filteredServices.map(service => (
                                                <tr key={service._id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3">{service?.test_name}</td>
                                                    <td className="px-4 py-3">{service?.test_charge}</td>
                                                    <td className="px-4 py-3 flex space-x-2">
                                                        <button onClick={() => handleEdit(service)} className="text-blue-500 hover:text-blue-700">
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
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="text-center py-4 text-gray-500">
                                                    No services found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </MiddleSection>
                </div >
            </Suspense >
        </>
    );
};

export default withAuth(radiologyRecords);