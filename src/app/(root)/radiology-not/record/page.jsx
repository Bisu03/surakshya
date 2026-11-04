"use client";

import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import Tab from "@/components/Tab";
import Spinner from "@/components/ui/Spinner";
import { deleteData, fetchData } from "@/services/apiService";
import { withAuth } from "@/services/withAuth";
import { ErrorHandeling } from "@/utils/errorHandling";
import { SuccessHandling } from "@/utils/successHandling";
import { TabLinks } from "@/utils/tablinks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import React, { lazy, Suspense, useEffect, useState } from "react";
import { FaPrint } from "react-icons/fa";
import { MdDelete, MdEdit } from "react-icons/md";
const MiddleSection = lazy(() => import("@/components/Middlesection"));

const PathologyRecord = () => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setCurrentPage(1); // Reset to first page when search changes
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [search]);

    const { data, error, isLoading, refetch } = useQuery({
        queryKey: ["pathologyrecord"],
        queryFn: () => fetchData(
            `/pathology?regid=${debouncedSearch}&page=${currentPage}&limit=${pageSize}`
        ),
        onSuccess: (data) => {
            setTotalPages(data?.pagination?.totalPages || 1);
        }
    });

    // Pagination controls
    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(1, prev - 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(totalPages, prev + 1));
    };

    const deleteMutation = useMutation({
        mutationFn: (id) => deleteData("/pathology", id),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["pathologyrecord"] }); // Refetch data after adding
            SuccessHandling("Record Deleted");
            refetch();
        },
        onError: (error) => {
            ErrorHandeling(error);
            console.error("Error adding data:", error);
        },
    });

    const handleDelete = (id) => {
        deleteMutation.mutate(id);
    };

    return (
        <>
            <Suspense fallback={<Loading />}>
                <div className="flex flex-wrap w-full justify-between">
                    <Tab tabs={TabLinks} category="Pathology Patient" />
                    <MiddleSection>
                        <div className="w-full">
                            <Heading heading="Pathology Record">
                                <div className="flex items-center space-x-2">
                                    <input
                                        className="w-full py-2 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search by name"
                                    />
                                </div>
                            </Heading>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-secondary text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            <th className="px-4 py-3">UHID</th>
                                            <th className="px-4 py-3">Bill No</th>
                                            <th className="px-4 py-3">Full Name</th>
                                            <th className="px-4 py-3">Phone</th>
                                            <th className="px-4 py-3">Age</th>
                                            <th className="px-4 py-3">Report Date & Time </th>
                                            <th className="px-4 py-3">Total Amount</th>
                                            <th className="px-4 py-3 ">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {data?.data?.map((patient) => (
                                            <tr key={patient._id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">{patient?.mrd_id}</td>
                                                <td className="px-4 py-3">{patient?.bill_no}</td>
                                                <td className="px-4 py-3">
                                                    {patient?.patient?.fullname}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {patient?.patient?.phone_number}
                                                </td>
                                                <td className="px-4 py-3">{patient?.patient?.age}</td>
                                                <td className="px-4 py-3">
                                                    {patient?.reporting_date}/{patient?.reporting_time}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {patient?.amount?.netTotal}/- paid by {patient?.paidby}
                                                </td>
                                                <td className="px-4 py-3 space-x-2 flex">
                                                    <Link
                                                        href={`/pathology/update/${patient.bill_no}`}
                                                        className="btn btn-primary "
                                                    >
                                                        {" "}
                                                        <MdEdit />
                                                    </Link>
                                                    <Link
                                                        href={`/pathology/printreceipt/${patient.bill_no}`}
                                                        className="btn btn-primary "
                                                    >
                                                        {" "}
                                                        <FaPrint />
                                                    </Link>
                                                    {/* <Link
                                                        href={`/ipd/update/${patient._id}`}
                                                        className="btn btn-secondary "
                                                    >
                                                        {" "}
                                                        <FaEdit />{" "}
                                                    </Link> */}
                                                    <button
                                                        onClick={() => handleDelete(patient._id)}
                                                        className="btn btn-error "
                                                    >
                                                        {" "}
                                                        <MdDelete />{" "}
                                                        {deleteMutation?.isPending && <Spinner />}{" "}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="flex justify-between items-center mt-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <select
                                            value={pageSize}
                                            onChange={(e) => setPageSize(Number(e.target.value))}
                                            className="border rounded px-2 py-1 text-sm"
                                        >
                                            {[10, 20, 50].map(size => (
                                                <option key={size} value={size}>{size} per page</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={handlePreviousPage}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={handleNextPage}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {isLoading && <Loading />}
                    </MiddleSection>
                </div>
            </Suspense>
        </>
    );
};

export default withAuth(PathologyRecord);
