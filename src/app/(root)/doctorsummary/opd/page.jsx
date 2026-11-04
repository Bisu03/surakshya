"use client";

import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import { getDate } from "@/lib/currentDate";
import { fetchData } from "@/services/apiService";
import { ErrorHandeling } from "@/utils/errorHandling";
import { useQuery } from "@tanstack/react-query";
import React, { lazy, Suspense, useState, useRef, useMemo, useCallback } from "react";
import Select from "react-select";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { formatDate } from "@/lib/formateDate";
import { withAuth } from "@/services/withAuth";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const OpdSummary = () => {
    const [startDate, setStartDate] = useState(getDate());
    const [endDate, setEndDate] = useState(getDate());
    const [consultant, setConsultant] = useState(null);
    const [tableData, setTableData] = useState([]);
    const tableRef = useRef(null);
    const [loading, setLoading] = useState(false);

    // Fetch doctor data with caching
    const { data: doctorrecord, isLoading: loadingDoctors } = useQuery({
        queryKey: ["doctorrecord"],
        queryFn: () => fetchData("/doctor"),
        staleTime: 600000 // 10 minutes cache
    });

    // Memoize doctor options
    const doctorOptions = useMemo(() =>
        doctorrecord?.data?.map(doctor => ({
            value: doctor,
            label: doctor.drname,
        })) || [],
        [doctorrecord?.data]
    );

    // Fetch OPD data handler
    const handleGetdetails = useCallback(async () => {
        setLoading(true);
        try {
            if (!consultant?.value?.drname) return;

            const { data } = await fetchData(
                `/doctorsummary/opd?drname=${consultant.value.drname}&startDate=${startDate}&endDate=${endDate}`
            );
            setTableData(data);
            setLoading(false);
        } catch (error) {
            ErrorHandeling(error);
            setLoading(false);
            setTableData([]);
        }
    }, [consultant, startDate, endDate]);

    // PDF Export handler
    const exportPDF = useCallback(() => {
        const input = tableRef.current;
        html2canvas(input).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const imgHeight = canvas.height * imgWidth / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`${consultant?.value?.drname}_opd_report.pdf`);
        });
    }, [consultant]);

    // CSV Data preparation
    const csvData = useMemo(() =>
        tableData.map(item => ({
            "Patient Name": item.fullname,
            "UHID": item.mrdId,
            "Date": formatDate(item.consultantDate)
        })),
        [tableData]
    );

    return (
        <Suspense fallback={<Loading />}>
            <div className="w-full min-h-screen p-4">
                <MiddleSection>
                    {/* Header Section */}
                    <Heading heading="OPD Summary" className="mb-6" />

                    {/* Filters Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
                        {/* Doctor Selector */}
                        <div className="w-full">
                            <Select
                                options={doctorOptions}
                                value={consultant}
                                onChange={setConsultant}
                                isClearable
                                placeholder="Select Doctor"
                                isLoading={loadingDoctors}
                                className="react-select-container"
                                classNamePrefix="react-select"
                            />
                        </div>

                        {/* Date Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                                type="date"
                                className="input input-bordered w-full"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <input
                                type="date"
                                className="input input-bordered w-full"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2 justify-end">
                            <button
                                className="btn btn-primary w-full sm:w-auto"
                                onClick={handleGetdetails}
                                disabled={!consultant}
                            >
                                Search
                            </button>


                            <CSVLink
                                data={csvData}
                                filename={`${consultant?.value?.drname}_opd_report.csv`}
                                className="btn btn-success w-full sm:w-auto"
                            >
                                Export Excel
                            </CSVLink>
                            <button
                                className="btn btn-error w-full sm:w-auto"
                                onClick={exportPDF}
                            >
                                Export PDF
                            </button>

                        </div>
                    </div>

                    
                    {loading && <Loading />}
                    {/* Results Table */}
                    {tableData.length > 0 && (
                        <div className="overflow-x-auto border rounded-lg" ref={tableRef}>
                            <table className="table table-zebra w-full">
                                <thead className="bg-base-200">
                                    <tr>
                                        <th className="w-1/3">Patient Name</th>
                                        <th className="w-1/3">UHID</th>
                                        <th className="w-1/3">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableData.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.fullname || 'N/A'}</td>
                                            <td>{item.mrdId || 'N/A'}</td>
                                            <td>
                                                {item.consultantDate ?
                                                    formatDate(item.consultantDate) : 'N/A'
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </MiddleSection>
            </div>
        </Suspense>
    );
};

export default withAuth(OpdSummary);