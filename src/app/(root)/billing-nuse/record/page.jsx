"use client";
import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import Tab from "@/components/Tab";
import Spinner from "@/components/ui/Spinner";
import { getDate } from "@/lib/currentDate";
import { deleteData, fetchData } from "@/services/apiService";
import { withAuth } from "@/services/withAuth";
import { ErrorHandeling } from "@/utils/errorHandling";
import { SuccessHandling } from "@/utils/successHandling";
import { TabLinks } from "@/utils/tablinks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import React, { lazy, Suspense, useEffect, useState } from "react";
import { FaPrint } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
const MiddleSection = lazy(() => import("@/components/Middlesection"));

const BillingRecord = () => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [billNo, setBillNo] = useState("");
    const [startDate, setStartDate] = useState(getDate());
    const [endDate, setEndDate] = useState(getDate());
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [billNo, startDate, endDate]);

    const { data, error, isLoading, refetch } = useQuery({
        queryKey: ["billingrecord"],
        queryFn: () => fetchData(
            `/billing?search=${debouncedSearch}&billNo=${billNo}&startDate=${startDate}&endDate=${endDate}`
        )
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => deleteData("/billing", id),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["billingrecord"] });
            SuccessHandling(data.message);
            refetch();
        },
        onError: (error) => {
            ErrorHandeling(error);
            console.error("Error deleting bill:", error);
        },
    });

    const handleDelete = (id) => {
        deleteMutation.mutate(id);
    };

    return (
        <>
            <Suspense fallback={<Loading />}>
                <div className="flex flex-wrap w-full justify-between">
                    <Tab tabs={TabLinks} category="Billing" />
                    <MiddleSection>
                        <div className="w-full">
                            <Heading heading="Billing Records">
                                <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">

                                    <input
                                        className="py-2 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        type="text"
                                        value={billNo}
                                        onChange={(e) => setBillNo(e.target.value)}
                                        placeholder="Bill Number"
                                    />
                                    <div className="flex space-x-2">
                                        <input
                                            type="date"
                                            className="border rounded-lg px-4 py-2"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                        />
                                        <input
                                            type="date"
                                            className="border rounded-lg px-4 py-2"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </Heading>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-secondary text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            <th className="px-4 py-3">Bill No</th>
                                            <th className="px-4 py-3">Patient Name</th>
                                            <th className="px-4 py-3">UH ID</th>
                                            <th className="px-4 py-3">REG ID</th>
                                            <th className="px-4 py-3">Billing Date</th>
                                            <th className="px-4 py-3">Total Amount</th>
                                            <th className="px-4 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {data?.data?.map((bill) => (
                                            <tr key={bill._id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">{bill.bill_no}</td>
                                                <td className="px-4 py-3">{bill.patient?.fullname}</td>
                                                <td className="px-4 py-3">{bill.mrd_id}</td>
                                                <td className="px-4 py-3">{bill.reg_id}</td>
                                                <td className="px-4 py-3">
                                                    {new Date(bill.billing_date).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3">
                                                    ₹{(
                                                        (bill.service_cart?.totalAmount || 0) +
                                                        (bill.pathology_cart?.totalAmount || 0)
                                                    ).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 space-x-2 flex">
                                                    <Link
                                                        href={`/billing/print/${bill.reg_id}`}
                                                        className="btn btn-primary"
                                                    >
                                                        <FaPrint />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(bill._id)}
                                                        className="btn btn-error"
                                                    >
                                                        <MdDelete />
                                                        {deleteMutation?.isPending && <Spinner />}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        {isLoading && <Loading />}
                    </MiddleSection>
                </div>
            </Suspense>
        </>
    );
};

export default withAuth(BillingRecord);