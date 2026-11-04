"use client";

import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import Spinner from "@/components/ui/Spinner";
import { getDate } from "@/lib/currentDate";
import { formattedTime } from "@/lib/timeGenerate";
import { fetchData, updateData } from "@/services/apiService";
import { withAuth } from "@/services/withAuth";
import { ErrorHandeling } from "@/utils/errorHandling";
import { SuccessHandling } from "@/utils/successHandling";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { lazy, Suspense, useState } from "react";
import toast from "react-hot-toast";
import { FaTrash } from "react-icons/fa";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const MakeBills = () => {
    const queryClient = useQueryClient();
    const { data: services, error, isLoading } = useQuery({
        queryKey: ["servicerecord"],
        queryFn: () => fetchData("/admin/service"),
    });

    const router = useRouter()

    const initialState = {
        services: [],
        totalAmount: 0
    }

    const [searchQuery, setSearchQuery] = useState("");
    const [serviceCart, setServiceCart] = useState(initialState);
    const [formData, setFormData] = useState({
        billing_date: getDate(),
        billing_time: formattedTime(),
        discount: 0,
        gst: 0,
        due: 0,
    });
    const [quantities, setQuantities] = useState({});
    const [RegNo, setRegNo] = useState()

    const [loading, setLoading] = useState(false)

    const filteredServices = (services?.data || [])?.filter(service =>
        service?.servicename?.toLowerCase()?.includes(searchQuery.toLowerCase())
    );

    const handleQuantityChange = (serviceId, value) => {
        const numericValue = value === "" ? 1 : Math.max(1, parseInt(value) || 1);
        setQuantities(prev => ({
            ...prev,
            [serviceId]: value === "" ? "" : numericValue
        }));
    };

    const calculateTotal = (services) => {
        return services.reduce((sum, item) => sum + (item.unitcharge * item.quantity), 0);
    };

    const addToCart = (service) => {
        const inputValue = quantities[service._id] || "";
        const quantity = inputValue === "" ? 1 : Math.max(1, parseInt(inputValue) || 1);

        setServiceCart(prev => {
            const existingIndex = prev.services.findIndex(item => item._id === service._id);
            let newServices = [...prev.services];

            if (existingIndex !== -1) {
                newServices[existingIndex] = {
                    ...newServices[existingIndex],
                    quantity: newServices[existingIndex].quantity + quantity
                };
            } else {
                newServices.push({ ...service, quantity });
            }

            return {
                services: newServices,
                totalAmount: calculateTotal(newServices)
            };
        });
        setQuantities(prev => ({ ...prev, [service._id]: "" }));
    };

    const removeFromCart = (serviceId) => {
        setServiceCart(prev => {
            const newServices = prev.services.filter(item => item._id !== serviceId);
            return {
                services: newServices,
                totalAmount: calculateTotal(newServices)
            };
        });
    };

    const updateQuantity = (serviceId, newValue) => {
        const newQuantity = Math.max(1, parseInt(newValue) || 1);

        setServiceCart(prev => {
            const newServices = prev.services.map(item =>
                item._id === serviceId ? { ...item, quantity: newQuantity } : item
            );
            return {
                services: newServices,
                totalAmount: calculateTotal(newServices)
            };
        });
    };

    const handleGetpatientinfor = async () => {
        setLoading(true)
        try {
            const { data } = await fetchData(`/billing/${RegNo}`)
            setFormData({ ...formData, ...data })
            setServiceCart(data?.service_cart || initialState)
            setLoading(false)
        } catch (error) {
            ErrorHandeling(error)
            setLoading(false)
        }

    }

    const mutation = useMutation({
        mutationFn: (newItem) => updateData(`/billing`, formData._id, newItem),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["billingrecord"] }); // Refetch data after adding;
            SuccessHandling(data.message);
            router.push(`/billing/print/${formData?.reg_id}`)
        },
        onError: (error) => {
            ErrorHandeling(error);
            console.error("Error adding data:", error);
        },
    });

    const handleGenerateBill = async () => {
        mutation.mutate({ ...formData, service_cart: serviceCart });
    }

    const subtotal = (serviceCart?.totalAmount || 0) + (formData?.pathology_cart?.totalAmount || 0);
    const discountAmount = subtotal * (formData.discount / 100);
    const gstAmount = (subtotal - discountAmount) * (formData.gst / 100);
    const total = (subtotal - discountAmount) + gstAmount;

    if (isLoading) return <Loading />;
    if (error) return <div>Error loading services</div>;

    return (
        <Suspense fallback={<Loading />}>
            <div className="flex flex-wrap w-full justify-between">
                <MiddleSection>
                    <div className="w-full">
                        <Heading heading="Billing" >
                            <div className="flex items-center space-x-2">
                                <input
                                    className="w-full py-2 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    type="text"
                                    name="RegNo"
                                    value={RegNo}
                                    onChange={(e) => setRegNo(e.target.value)}
                                    placeholder="Enter REGID"
                                />
                                <button onClick={handleGetpatientinfor} className="btn btn-secondary"> Get </button>
                            </div>
                        </Heading>
                    </div>
                    {loading && <Loading />}
                    <div className="w-full bg-gray-100 p-2 md:p-4 rounded-lg shadow-sm mb-4">
                        <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-3 md:mb-4 truncate">
                            {formData?.patient?.fullname || "No Patient Selected"}
                        </h1>
                        <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-4 gap-2 md:gap-4 ">
                            {formData?.mrd_id && (
                                <div className="space-y-0.5 min-w-[200px]">
                                    <p className="text-xs md:text-sm font-medium text-gray-500">UH ID</p>
                                    <p className="text-gray-700 text-sm md:text-base font-mono truncate">
                                        {formData.mrd_id}
                                    </p>
                                </div>
                            )}

                            {formData?.reg_id && (
                                <div className="space-y-0.5 min-w-[200px]">
                                    <p className="text-xs md:text-sm font-medium text-gray-500">REG ID</p>
                                    <p className="text-gray-700 text-sm md:text-base font-mono truncate">
                                        {formData.reg_id}
                                    </p>
                                </div>
                            )}

                            {formData?.bill_no && (
                                <div className="space-y-0.5 min-w-[200px]">
                                    <p className="text-xs md:text-sm font-medium text-gray-500">Bill No.</p>
                                    <p className="text-gray-700 text-sm md:text-base truncate">
                                        {formData.bill_no}
                                    </p>
                                </div>
                            )}

                            <div className="space-y-0.5 min-w-[200px]">
                                <p className="text-xs md:text-sm font-medium text-gray-500">Billing Date</p>
                                <input
                                    type="date"
                                    className="w-full p-1 border rounded"
                                    value={formData.billing_date}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        billing_date: e.target.value
                                    }))}
                                />
                            </div>

                            {/* Add Time Input */}
                            <div className="space-y-0.5 min-w-[200px]">
                                <p className="text-xs md:text-sm font-medium text-gray-500">Billing Time</p>
                                <input
                                    type="test"
                                    className="w-full p-1 border rounded"
                                    value={formData.billing_time}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        billing_time: e.target.value
                                    }))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 flex flex-col lg:flex-row gap-6">
                        {/* Wider Service List Section */}
                        <div className="flex-[2]">
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Search services..."
                                    className="w-full p-2 border rounded"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="space-y-3">
                                {filteredServices.map(service => (
                                    <div key={service._id} className="flex items-center justify-between p-2 border rounded bg-gray-200">
                                        <div className="flex-1 min-w-[60%]">
                                            <h3 className="font-semibold truncate">{service.servicename}</h3>
                                            <p className="text-sm text-gray-500">
                                                ₹{service.unitcharge}/{service.unittype}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="1"
                                                className="w-20 p-1 border rounded"
                                                placeholder="Qty"
                                                value={quantities[service._id] ?? ""}
                                                onChange={(e) =>
                                                    handleQuantityChange(service._id, e.target.value)
                                                }
                                            />
                                            <button
                                                onClick={() => addToCart(service)}
                                                className="px-4 py-1.5 bg-primary text-white rounded hover:bg-secondary"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Cart Section */}
                        <div className="flex-1 max-w-[600px] bg-gray-50 p-2 rounded-lg">
                            <h2 className="text-xl font-semibold mb-4">Service Cart</h2>

                            <>
                                <div className="space-y-2 mb-4">
                                    {formData?.pathology_cart?.services?.map(item => (
                                        <div key={item._id} className="flex justify-between items-center  bg-white rounded">
                                            <div className="flex-1">
                                                <h3 className="font-medium truncate">{item.pathology_category}</h3>

                                            </div>
                                            <div className="flex items-center gap-2">

                                                <button
                                                    className=" text-xl"
                                                >
                                                    ₹{item.pathology_charge}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {serviceCart.services.map(item => (
                                        <div key={item._id} className="flex justify-between items-center  bg-white rounded">
                                            <div className="flex-1">
                                                <h3 className="font-medium truncate">{item.servicename}</h3>
                                                <p className="text-sm text-gray-500">
                                                    ₹{item.unitcharge} x {item.quantity} {item.unittype}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateQuantity(item._id, e.target.value)}
                                                    className="w-16 p-1 border rounded"
                                                />
                                                <button
                                                    onClick={() => removeFromCart(item._id)}
                                                    className="text-red-500 hover:text-red-700 text-xl"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t pt-4 space-y-4">
                                    <div className="flex justify-between font-semibold text-lg">
                                        <span>Subtotal:</span>
                                        <span>₹{subtotal.toFixed(2)}</span>
                                    </div>

                                    <div className="space-y-0.5">
                                        <p className="text-xs md:text-sm font-medium text-gray-500">Discount (%)</p>
                                        <input
                                            type="number"
                                            className="w-full p-1 border rounded"
                                            value={formData.discount}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                discount: Math.max(0, parseFloat(e.target.value) || 0)
                                            }))}
                                        />
                                    </div>

                                    <div className="space-y-0.5">
                                        <p className="text-xs md:text-sm font-medium text-gray-500">GST (%)</p>
                                        <input
                                            type="number"
                                            className="w-full p-1 border rounded"
                                            value={formData.gst}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                gst: Math.max(0, parseFloat(e.target.value) || 0)
                                            }))}
                                        />
                                    </div>

                                    <div className="flex justify-between font-semibold text-lg">
                                        <span>Total:</span>
                                        <span>₹{total.toFixed(2)}</span>
                                    </div>

                                    <div className="space-y-0.5">
                                        <p className="text-xs md:text-sm font-medium text-gray-500">Due Amount</p>
                                        <input
                                            type="number"
                                            className="w-full p-1 border rounded"
                                            value={formData.due}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                due: Math.max(0, parseFloat(e.target.value) || 0)
                                            }))}
                                        />
                                    </div>

                                    <button onClick={handleGenerateBill} className="w-full mt-4 bg-green-500 text-white py-2 rounded hover:bg-green-600">
                                        Generate Bill {mutation.isPending && <Spinner />}
                                    </button>
                                </div>
                            </>

                        </div>
                    </div>
                </MiddleSection>
            </div>
        </Suspense>
    );
};

export default withAuth(MakeBills);