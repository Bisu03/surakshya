"use client";

import Loading from '@/components/Loading';
import PrintUi from '@/components/ui/PrintUi';
import HospitalHeader from '@/components/ui/HospitalHeader';
import { HOSPITAL } from '@/lib/hospitalBrand';
import { withAuth } from '@/services/withAuth';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { formatDate } from '@/lib/formateDate';

const BillPrint = () => {
    const { data: session } = useSession();
    const { slug } = useParams();
    const [formData, setFormData] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const handleGetBillingInfo = async () => {
        try {
            const { data } = await axios.get(`/api/v1/billing/${slug}`);
            setFormData(data?.data);
        } catch (error) {
            console.error("Error fetching billing data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        handleGetBillingInfo();
    }, [slug]);

    // Calculate values
    const subtotal = (formData?.service_cart?.totalAmount || 0) + (formData?.pathology_cart?.totalAmount || 0);
    const discountAmount = subtotal * (formData?.discount / 100);
    const discountedTotal = subtotal - discountAmount;
    const gstAmount = discountedTotal * (formData?.gst / 100);
    const grandTotal = discountedTotal + gstAmount;
    const amountPaid = grandTotal - (formData?.due || 0);

    if (isLoading) return <Loading />;

    return (
        <PrintUi path="/billing">
            <HospitalHeader />

            <div className="mx-auto bg-white p-4 rounded-lg">
                {/* Invoice Header */}
                <div className="flex flex-col sm:flex-row justify-between mb-4 print:mb-2">
                    <div className="mb-2 sm:mb-0">
                        <h2 className="text-lg font-bold print:text-md">Money Receipt</h2>
                        <p className="text-xs print:text-2xs">Bill No: {formData?.bill_no}</p>
                    </div>
                    <div className="text-right text-xs print:text-2xs">
                        <p>Date: {formatDate(formData?.billing_date)}</p>
                        <p>Time: {formData?.billing_time}</p>
                    </div>
                </div>

                {/* Patient Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 print:gap-1">
                    <div className="space-y-1">
                        <h3 className="font-semibold text-sm border-b pb-1 print:text-xs">Patient Details</h3>
                        <div className="text-xs space-y-0.5 print:text-2xs">
                            <p>Name: {formData?.patient?.fullname}</p>
                            <p>Phone: {formData?.patient?.phone_number}</p>
                            <div className="grid grid-cols-2 gap-1">
                                <span>UH ID: {formData?.mrd_id}</span>
                                <span>REG ID: {formData?.reg_id}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <h3 className="font-semibold text-sm border-b pb-1 print:text-xs">Address Details</h3>
                        <div className="text-xs space-y-0.5 print:text-2xs">
                            <p>{formData?.patient?.city_vill}</p>
                            <p>{formData?.patient?.dist}, {formData?.patient?.state}</p>
                            <div className="grid grid-cols-2 gap-1">
                                <span>P.S: {formData?.patient?.ps}</span>
                                <span>P.O: {formData?.patient?.po}</span>
                            </div>
                            <p>PIN: {formData?.patient?.pincode}</p>
                        </div>
                    </div>
                </div>

                {/* Services Table */}
                <table className="w-full mb-4 text-xs print:text-2xs">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="p-1 text-left border">Service</th>
                            <th className="p-1 text-left border">Unit</th>
                            <th className="p-1 text-left border">Rate</th>
                            <th className="p-1 text-left border">Qty</th>
                            <th className="p-1 text-left border">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {formData?.pathology_cart?.services?.map((service, index) => (
                            <tr key={index} className="border">
                                <td className="p-1 border">{service.pathology_category}</td>
                                <td className="p-1 border">-</td>
                                <td className="p-1 border">₹{Number(service.pathology_charge).toFixed(2)}</td>
                                <td className="p-1 border">-</td>
                                <td className="p-1 border">₹{Number(service.pathology_charge).toFixed(2)}</td>
                            </tr>
                        ))}
                        {formData?.service_cart?.services?.map((service, index) => (
                            <tr key={index} className="border">
                                <td className="p-1 border">{service.servicename}</td>
                                <td className="p-1 border">{service.unittype}</td>
                                <td className="p-1 border">₹{Number(service.unitcharge).toFixed(2)}</td>
                                <td className="p-1 border">{service.quantity}</td>
                                <td className="p-1 border">₹{(Number(service.unitcharge) * service.quantity).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals Section */}
                <div className="flex justify-end">
                    <div className="w-72 space-y-1 text-xs print:text-2xs">
                        <div className="flex justify-between">
                            <span className="font-semibold">Subtotal:</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>

                        {formData?.discount > 0 && (
                            <div className="flex justify-between">
                                <span>Discount ({formData?.discount}%):</span>
                                <span>- ₹{discountAmount.toFixed(2)}</span>
                            </div>
                        )}

                        {formData?.gst > 0 && (
                            <div className="flex justify-between">
                                <span>GST ({formData?.gst}%):</span>
                                <span>+ ₹{gstAmount.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="flex justify-between font-semibold border-t pt-1">
                            <span>Grand Total:</span>
                            <span>₹{grandTotal.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between">
                            <span>Payment Method:</span>
                            <span className="capitalize">{formData?.paidby}</span>
                        </div>

                        <div className="flex justify-between">
                            <span>Amount Paid:</span>
                            <span>₹{amountPaid.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between font-semibold border-t pt-1">
                            <span>Due Amount:</span>
                            <span>₹{formData?.due?.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-4 text-center text-2xs print:mt-2">
                    <p>Thank you for choosing {HOSPITAL.name}</p>
                    <p>Admitted by: {formData?.patient?.admited_by} on {formatDate(formData?.billing_date)}</p>
                </div>
            </div>
        </PrintUi>
    );
};

export default withAuth(BillPrint);
