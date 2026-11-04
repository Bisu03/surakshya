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
import { useSession } from "next-auth/react";
import Link from "next/link";
import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { FaPrint } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { useReactToPrint } from "react-to-print";
import * as XLSX from "xlsx";
const MiddleSection = lazy(() => import("@/components/Middlesection"));

const DischargeRecord = () => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const contentRef = useRef(null);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(getDate());
  const [endDate, setEndDate] = useState(getDate());
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dischargerecord", debouncedSearch, startDate, endDate],
    queryFn: () =>
      fetchData(
        `/discharge?search=${debouncedSearch}&startDate=${startDate}&endDate=${endDate}`
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteData(`/discharge`, id),
    onSuccess: (data) => {
      queryClient.invalidateQueries(["dischargerecord"]);
      SuccessHandling(data.message);
    },
    onError: (error) => {
      ErrorHandeling(error);
    },
  });

  const handleDelete = (id) => {
    if (
      window.confirm("Are you sure you want to delete this discharge record?")
    ) {
      deleteMutation.mutate(id);
    }
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      data?.data?.map((record) => ({
        "UHID": record.mrd_id,
        "REGID": record.reg_id,
        "Patient Name": record.patient?.fullname,
        Consultant: record?.consultant?.drname,
        "Discharge Date": record.discharge_date,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Discharge Records");
    XLSX.writeFile(workbook, `Discharge${startDate}_${endDate}.xlsx`);
  };

  const handlePrint = useReactToPrint({ contentRef });

  return (
    <Suspense fallback={<Loading />}>
      <Tab tabs={TabLinks} category="IPD" />
      <div className="flex flex-wrap w-full justify-between">
        <MiddleSection>
          <div className="w-full">
            <Heading heading="Discharge Records">
              <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
                <input
                  type="text"
                  placeholder="Search by Patient Name or UHID"
                  className="border rounded-lg px-4 py-2"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
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
                {/* Add Export Buttons Here */}
                <div className="flex space-x-2">
                  <button
                    onClick={handleExportExcel}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  >
                    Export to Excel
                  </button>
                  <button
                    onClick={handlePrint}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                  >
                    Print PDF
                  </button>
                </div>
              </div>
            </Heading>

            {isLoading ? (
              <Loading />
            ) : (
              <div className="overflow-x-auto">
                <table ref={contentRef} className="w-full">
                  <thead>
                    <tr className="bg-secondary text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Patient Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        UHID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        REGID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Discharge Date/Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data?.data?.map((record) => (
                      <tr key={record._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {record.patient?.fullname}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {record.mrd_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {record.reg_id}
                        </td>
                  
                        <td className="px-6 py-4 whitespace-nowrap">
                          {record.discharge_date}/{record.discharge_time}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap flex space-x-2">
                          <Link
                            href={`/discharge/print/${record.reg_id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FaPrint size={18} />
                          </Link>
                          {session?.user?.role === "Admin" && (
                            <button
                              onClick={() => handleDelete(record._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <MdDelete size={20} />
                            </button>
                          )}
                        </td>
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

export default withAuth(DischargeRecord);
