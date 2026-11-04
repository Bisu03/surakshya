"use client";

import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import Tab from "@/components/Tab";
import { getDate } from "@/lib/currentDate";
import { fetchData } from "@/services/apiService";
import { ErrorHandeling } from "@/utils/errorHandling";
import { TabLinks } from "@/utils/tablinks";
import { useQuery } from "@tanstack/react-query";
import React, { lazy, Suspense, useState, useRef } from "react";
import Select from "react-select";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { formatDate } from "@/lib/formateDate";
import { withAuth } from "@/services/withAuth";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const IpdSummary = () => {
    const [search, setSearch] = useState("");
    const [startDate, setStartDate] = useState(getDate());
    const [endDate, setEndDate] = useState(getDate());
    const [consultant, setConsultant] = useState({});
    const [tableData, setTableData] = useState([]);
    const tableRef = useRef(null);

    const { data: doctorrecord,isLoading: loadingDoctors } = useQuery({
        queryKey: ["doctorrecord"],
        queryFn: () => fetchData("/doctor"),
    });

    const doctorOptions = doctorrecord?.data?.map((doctor) => ({
        value: doctor,
        label: doctor.drname,
    }));

    const handleGetdetails = async () => {
        try {
            const { data } = await fetchData(
                `/doctorsummary/ipd?drname=${consultant?.value?.drname}&startDate=${startDate}&endDate=${endDate}`
            );
            setTableData(data);
        } catch (error) {
            ErrorHandeling(error);
        }
    };

    const exportPDF = () => {
        const input = tableRef.current;
        html2canvas(input).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const imgHeight = canvas.height * imgWidth / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`${consultant?.value?.drname}_report.pdf`);
        });
    };

    const csvData = tableData.map(item => ({
        "Patient Name": item.fullname,
        "UHID": item.mrdId,
        "REGID": item.regId,
        "Admit Date": item.admitDate,
        "Doctor Name": item.doctorName,
        "Total Visits": item.totalVisits
    }));

    return (
        <Suspense fallback={<Loading />}>
            <div className="flex flex-wrap w-full justify-between">
                <MiddleSection>
                    <div className="w-full">
                        <Heading heading="IPD Summary"></Heading>

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



                        {tableData.length > 0 && (
                            <div className="mt-6 overflow-x-auto" ref={tableRef}>
                                <table className="table table-zebra w-full">
                                    <thead>
                                        <tr>
                                            <th>Patient Name</th>
                                            <th>UHID</th>
                                            <th>REGID</th>
                                            <th>Admit Date</th>
                                            <th>Total Visits</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tableData.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.fullname}</td>
                                                <td>{item.mrdId}</td>
                                                <td>{item.regId}</td>
                                                <td>{formatDate(item?.admitDate)}</td>
                                                <td>{item.totalVisits}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </MiddleSection>
            </div>
        </Suspense>
    );
};

export default withAuth(IpdSummary);