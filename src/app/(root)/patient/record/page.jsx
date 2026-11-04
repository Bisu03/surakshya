"use client";

import React, { lazy, Suspense, useEffect, useState } from "react";
import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import { withAuth } from "@/services/withAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteData, fetchData } from "@/services/apiService";
import { FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import Link from "next/link";
import { SuccessHandling } from "@/utils/successHandling";
import { ErrorHandeling } from "@/utils/errorHandling";
import { getDate } from "@/lib/currentDate";
import Spinner from "@/components/ui/Spinner";
import { useSession } from "next-auth/react";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const PatientRecord = () => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10; // You can make this adjustable if needed

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["patientrecord", searchTerm, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("fullname", searchTerm);
      params.append("page", page);
      params.append("limit", limit);
      return fetchData(`/patient?${params.toString()}`);
    },
  });

  useEffect(() => {
    refetch();
  }, [searchTerm, page]);

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteData("/patient", id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["patientrecord"] }); // Refetch data after adding
      SuccessHandling(data.message);
      refetch();
    },
    onError: (error) => {
      ErrorHandeling(error);
      console.error("Error adding data:", error);
    },
  });

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this?")) {
      // Perform delete logic here
      deleteMutation.mutate(id);
    }
  };

  return (
    <>
      <Suspense fallback={<Loading />}>
        <div className="flex flex-wrap w-full justify-between">
          <MiddleSection>
            <div className="w-full">
              <Heading heading="Patient Record">
                <div className="flex flex-wrap w-full justify-end my-4 items-center  ">
                  {/* Name Search */}
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border p-2 rounded w-64"
                  />

                  {/* Clear Button */}
                  <button
                    onClick={() => {
                      setSearchTerm("");
                    }}
                    className="bg-secondary px-4 py-2 rounded hover:bg-gray-300"
                  >
                    Clear Filters
                  </button>
                </div>
              </Heading>

              {isLoading && <Loading />}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-secondary text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <th className="px-4 py-3">UHID</th>
                      <th className="px-4 py-3">Full Name</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Age</th>
                      <th className="px-4 py-3">Gender</th>
                      <th className="px-4 py-3 ">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    {data?.data?.map((patient) => (
                      <tr key={patient?._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{patient?.mrd_id}</td>
                        <td className="px-4 py-3">{patient?.fullname}</td>
                        <td className="px-4 py-3">{patient?.phone_number}</td>
                        <td className="px-4 py-3">{patient?.age}</td>
                        <td className="px-4 py-3">{patient?.gender}</td>
                        {session?.user?.role === "Admin" && (
                          <td className="px-4 py-3 space-x-2 flex">
                            {/* <button className="btn btn-success "> <FaPrint /> </button> */}
                            {/* <Link
                              href={`/patient/${patient._id}`}
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
                              {deleteMutation.isPending && <Spinner />}
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {data?.pagination && (
              <div className="flex justify-end items-center gap-4 my-4">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => prev - 1)}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  Prev
                </button>
                <span>
                  Page {data.pagination.page} of {data.pagination.totalPages}
                </span>
                <button
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </MiddleSection>
        </div>
      </Suspense>
    </>
  );
};

export default withAuth(PatientRecord);
