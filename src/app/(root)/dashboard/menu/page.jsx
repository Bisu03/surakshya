"use client";

import Loading from "@/components/Loading";
import { getDate } from "@/lib/currentDate";
import { isHiddenPath, LAB_ENABLED } from "@/lib/features";
import { fetchData } from "@/services/apiService";
import { withAuth } from "@/services/withAuth";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import React, { lazy, Suspense, useEffect, useState } from "react";
import { BiHeart, BiLabel } from "react-icons/bi";
import {
    FaArrowCircleDown,
    FaArrowCircleUp,
    FaClinicMedical,
    FaExclamationTriangle,
    FaHospital,
    FaMoneyBill,
} from "react-icons/fa";
import { ImLab } from "react-icons/im";
import { MdBedroomParent, MdDashboard } from "react-icons/md";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const Menu = () => {
    const [startDate, setStartDate] = useState(getDate());
    const [endDate, setEndDate] = useState(getDate());

    const links = [
        { href: "#", icon: <MdDashboard size={60} />, label: "Daily Report" },
        { href: "/ipd/admit", icon: <MdBedroomParent size={60} />, label: "IPD" },
        { href: "/opd/admit", icon: <FaClinicMedical size={60} />, label: "OPD" },
        { href: "/ipd/ipdservice", icon: <FaMoneyBill size={60} />, label: "Bill" },
        { href: "/labtest/create", icon: <ImLab size={60} />, label: "Lab Test" },
    ].filter(({ href }) => !isHiddenPath(href));

    const { data, error, isLoading, refetch } = useQuery({
        queryKey: ["dashboardsummary"],
        queryFn: () =>
            fetchData(
                `/dashboard/dailysummary?startDate=${startDate}&endDate=${endDate}`
            ),
    });

    useEffect(() => {
        refetch();
    }, [startDate, endDate]);

    // Currency formatter
    const formatCurrency = (value) => 
        new Intl.NumberFormat('en-IN', { 
            style: 'currency', 
            currency: 'INR',
            maximumFractionDigits: 0 
        }).format(value || 0);

    // Calculate total income
    const totalIncome = (
        (Number(data?.data?.ipd?.totalAdmissionFees) || 0) +
        (Number(data?.data?.opd?.totalFees) || 0) +
        ((Number(data?.data?.billing?.totalNet) || 0) -
        (Number(data?.data?.billing?.totalDue) || 0)) +
        ((Number(data?.data?.lab?.totalNet) || 0) -
        (Number(data?.data?.lab?.totalDue) || 0))
    );

    const totalExpense = Number(data?.data?.expense?.totalExpense) || 0;
    const netIncome = totalIncome - totalExpense;

    return (
        <Suspense fallback={<Loading />}>
            <div className="flex flex-wrap w-full justify-between px-2 sm:px-4">
                <MiddleSection>
                    {/* Quick Links Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-2">
                        {links.map(({ href, icon, label }) => (
                            <Link
                                key={href}
                                href={href}
                                className="flex flex-col items-center justify-center p-2 sm:p-4 hover:scale-105 transition-transform duration-300 border rounded-lg hover:shadow-md"
                            >
                                <div className="text-primary">{icon}</div>
                                <p className="mt-2 text-sm sm:text-lg font-semibold text-gray-700 text-center">
                                    {label}
                                </p>
                            </Link>
                        ))}
                    </div>

                    {/* Date Inputs */}
                    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg mx-2">
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-2">Start Date</label>
                            <input
                                type="date"
                                className="w-full p-2 border rounded-md"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-2">End Date</label>
                            <input
                                type="date"
                                className="w-full p-2 border rounded-md"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-2 sm:px-0 mt-4">
                        {[
                            { 
                                title: "IPD Admissions", 
                                value: data?.data?.ipd?.count || 0, 
                                icon: <BiHeart className="text-teal-300" />,
                                description: "Patients currently admitted"
                            },
                            {
                                title: "IPD Discharge",
                                value: data?.data?.billing?.dischargedCount || 0,
                                icon: <BiLabel className="text-teal-300" />,
                                description: "Patients Currently Discharged"
                            },
                            { 
                                title: "OPD Patient", 
                                value: data?.data?.opd?.count || 0, 
                                icon: <FaHospital className="text-teal-300" />,
                                description: "Patients currently admitted"
                            },
                            LAB_ENABLED && {
                                title: "Lab Test",
                                value: data?.data?.lab?.count || 0,
                                icon: <ImLab className="text-teal-300" />,
                                description: "Lab Test Currently Done"
                            },
                            {
                                title: "Stock In (Qty)",
                                value: data?.data?.stock?.stockInQty || 0,
                                icon: <FaArrowCircleUp className="text-green-400" />,
                                description: "Stock received in range"
                            },
                            {
                                title: "Stock Out (Qty)",
                                value: data?.data?.stock?.stockOutQty || 0,
                                icon: <FaArrowCircleDown className="text-orange-400" />,
                                description: "Stock consumed in range"
                            },
                            {
                                title: "Medicines Out of Stock",
                                value: data?.data?.stock?.outOfStockMedicineCount || 0,
                                icon: <FaExclamationTriangle className="text-red-400" />,
                                description: "Currently at zero stock"
                            },
                        ].filter(Boolean).map((stat, index) => (
                            <div key={index} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between pb-2">
                                    <h3 className="text-sm font-medium text-gray-600">{stat.title}</h3>
                                    {stat.icon}
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {stat.value}
                                    </div>
                                    <p className="text-xs text-gray-500">{stat.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Income Overview */}
                    <div className="mt-6 mx-2 sm:mx-0">
                        <div className="rounded-lg border bg-white p-4 shadow-sm">
                            <div className="pb-4">
                                <h3 className="text-lg font-medium text-gray-800">Income Overview</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row items-center justify-between">
                                    <div className="text-sm font-medium text-gray-600 mb-2 sm:mb-0">
                                        Total Income
                                    </div>
                                    <div className="text-xl font-bold flex items-center text-gray-900">
                                        {formatCurrency(totalIncome)}
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center justify-between">
                                    <div className="text-sm font-medium text-gray-600 mb-2 sm:mb-0">
                                        Total Expense
                                    </div>
                                    <div className="text-xl font-bold flex items-center text-red-600">
                                        {formatCurrency(totalExpense)}
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center justify-between">
                                    <div className="text-sm font-medium text-gray-600 mb-2 sm:mb-0">
                                        Net Income
                                    </div>
                                    <div className="text-xl font-bold flex items-center text-gray-900">
                                        {formatCurrency(netIncome)}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Left Column */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-gray-600">IPD Collection</div>
                                            <div className="text-sm font-medium text-gray-800">
                                                {formatCurrency(data?.data?.ipd?.totalAdmissionFees)}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-gray-600">OPD Collection</div>
                                            <div className="text-sm font-medium text-gray-800">
                                                {formatCurrency(data?.data?.opd?.totalFees)}
                                            </div>
                                        </div>
                                        {LAB_ENABLED && (
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-gray-600">Lab Collection</div>
                                                <div className="text-sm font-medium text-gray-800">
                                                    {formatCurrency(data?.data?.lab?.totalPaid)}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-gray-600">IPD Billing Paid</div>
                                            <div className="text-sm font-medium text-gray-800">
                                                {formatCurrency(
                                                    (Number(data?.data?.billing?.totalNet) || 0) -
                                                    (Number(data?.data?.billing?.totalDue) || 0)
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-gray-600">IPD Billing Due</div>
                                            <div className="text-sm font-medium text-gray-800">
                                                {formatCurrency(data?.data?.billing?.totalDue)}
                                            </div>
                                        </div>
                                        {LAB_ENABLED && (
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-gray-600">Lab Due</div>
                                                <div className="text-sm font-medium text-gray-800">
                                                    {formatCurrency(data?.data?.lab?.totalDue)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </MiddleSection>
            </div>
        </Suspense>
    );
};

export default withAuth(Menu);