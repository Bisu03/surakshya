"use client";
import Loading from "@/components/Loading";
import PrintUi from "@/components/ui/PrintUi";
import { HOSPITAL } from "@/lib/hospitalBrand";
import { withAuth } from "@/services/withAuth";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchData } from "@/services/apiService";
import { formatDate } from "@/lib/formateDate";
import QRCode from "react-qr-code"
import { amountToWords } from "@/lib/numberToWord";

const PathologyReceipt = () => {
    const { data: session } = useSession();
    const { slug } = useParams();

    const { data, isLoading, refetch } = useQuery({
        queryKey: ["pathologyrecord", slug],
        queryFn: () => fetchData(`/pathology/${slug}`),
    });

    useEffect(() => {
        refetch();
    }, [slug]);

    if (isLoading) return <Loading />;

    return (
        <PrintUi path="/pathology/record">

            <div className="mx-auto bg-white rounded-lg p-4 mt-10 ">
                {/* Patient & Report Details */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Patient Details */}
                    <div className="space-y-1">
                        <h3 className="font-semibold text-sm border-b border-black pb-1 print:text-xs">
                            Patient Details
                        </h3>
                        <div className="text-xs space-y-0.5 print:text-xs">
                            <p>
                                <span className="font-semibold">Full Name:</span>{" "}
                                {data?.data?.patient?.fullname}
                            </p>
                            <div className="flex space-x-2">
                                <p>
                                    <span className="font-semibold">Gender:</span>{" "}
                                    {data?.data?.patient?.gender}
                                </p>
                                <p>
                                    <span className="font-semibold">Age:</span>{" "}
                                    {data?.data?.patient?.age}
                                </p>
                            </div>
                            <p>
                                <span className="font-semibold">Phone No.:</span>{" "}
                                {data?.data?.patient?.phone_number}
                            </p>
                            <p>
                                <span className="font-semibold">Address:</span>{" "}
                                {data?.data?.patient?.address}
                            </p>
                        </div>
                    </div>


                    <div>
                        <h3 className="font-semibold text-sm border-b border-black pb-1 print:text-xs">
                            Report Details
                        </h3>
                        <div className="text-xs space-y-0.5 print:text-xs">
                            <p>
                                <span className="font-semibold"> Date/Time:</span>{" "}
                                {formatDate(data?.data?.reporting_date)}/{data?.data?.reporting_time}
                            </p>
                            <p>
                                <span className="font-semibold">UHID:</span>{" "}
                                {data?.data?.mrd_id}
                            </p>
                            <p>
                                <span className="font-semibold">Bill No.:</span>{" "}
                                {data?.data?.bill_no}
                            </p>
                            <p>
                                <span className="font-semibold">Referred By:</span>{" "}
                                {data?.data?.consultant?.drname}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tests Table */}
                <table className="w-full mb-4 text-xs print:text-xs">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="p-1 text-left border text-xs">Test Name</th>
                            <th className="p-1 text-right border text-xs">Charge (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.data?.test_cart?.services?.map((test, index) => (
                            <tr key={index} className="border">
                                <td className="p-1 border text-xs">{test.pathology_category}</td>
                                <td className="p-1 text-right border text-xs">
                                    {Number(test.pathology_charge).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Billing Summary */}
                <div className="flex justify-between space-x-2">
                    <div>
                        <QRCode
                            size={100}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            value={`${window.location.href}/pathology/download/${data._id}`}
                            viewBox={`0 0 100 100`}
                        />
                    </div>
                    <div className="flex-grow text-left px-4">
                        <h2 className="text-xs font-semibold text-gray-600">Amount in Words:</h2>
                        <h1 className="text-sm font-medium text-gray-700">
                            {amountToWords(data?.data?.amount?.netTotal)}
                        </h1>
                    </div>

                    <div className="w-72 space-y-1 text-xs print:text-xs">
                        <div className="flex justify-between font-semibold">
                            <span>Total Charges:</span>
                            <span className="text-right">
                                ₹{parseFloat(data?.data?.amount?.total)?.toFixed(2)}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span>Discount Amount:</span>
                            <span className="text-right">
                                ₹{parseFloat(data?.data?.amount?.discount)?.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Net Total:</span>
                            <span className="text-right">
                                ₹{parseFloat(data?.data?.amount?.netTotal)?.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Paid Amount:</span>
                            <span className="text-right">
                                ₹{parseFloat(data?.data?.amount?.paid)?.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Payment Method:</span>
                            <span className="text-right capitalize">
                                {data?.data?.paydby}
                            </span>
                        </div>

                        <div className="flex justify-between font-semibold border-t pt-1">
                            <span>Due Amount:</span>
                            <span className="text-red-600 text-right">
                                ₹{parseFloat(data?.data?.amount?.due)?.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Signature & Footer */}
                <div className="mt-8 border-t-2 border-black pt-10">
                    <div className="flex justify-between items-end">
                        <div className="text-xs">
                            Thank you for choosing {HOSPITAL.name}
                        </div>

                        <div className="text-center">
                            <div className="mt-12 w-48 border-b-2 border-black"></div>
                            <p className="text-sm">Signature & Stamp</p>
                        </div>
                    </div>
                </div>
            </div>
        </PrintUi>
    );
};

export default withAuth(PathologyReceipt);
