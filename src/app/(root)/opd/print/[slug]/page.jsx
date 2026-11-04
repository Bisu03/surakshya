"use client";

import Loading from "@/components/Loading";
import PrintUi from "@/components/ui/PrintUi";
import HospitalHeader from "@/components/ui/HospitalHeader";
import { formatDate } from "@/lib/formateDate";
import { fetchData } from "@/services/apiService";
import { withAuth } from "@/services/withAuth";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

const OpdPrint = () => {
  const { data: session } = useSession();
  const { slug } = useParams();

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["opddetails", slug], // Unique query key
    queryFn: () => fetchData(`/opd/${slug}`), // Function to fetch data
    enabled: !!slug, // Only run query when slug is available
    retry: 4, // Retry failed requests up to 2 times
    staleTime: 1000 * 60 * 5, // 5 minutes stale time
  });

  return (
    <>
      {isLoading && <Loading />}

      {/* Declaration */}
      <PrintUi path="/opd/record">
        {/* Main Container */}
        <div className="min-h-[100vh] p-6 flex flex-col justify-between">
          {/* Hospital Header */}
          <HospitalHeader />

          <div className="flex justify-between border-b border-black">
            <div className=" text-sm space-y-1">
              <div>
                <span className="font-semibold">UHID:</span>{" "}
                {data?.data?.mrd_id}
              </div>
              <div>
                <span className="font-semibold">Full Name:</span>{" "}
                {data?.data?.patient?.fullname}
              </div>
              <div>
                <span className="font-semibold">Sex:</span>{" "}
                {data?.data?.patient?.gender}
              </div>
              <div>
                <span className="font-semibold">Address:</span>{" "}
                {data?.data?.patient?.address}
              </div>
            </div>

            <div className="text-sm space-y-1">
              <div>
                <span className="font-semibold">Date & Time:</span>{" "}
                {formatDate(data?.data?.consultant_date)}{" "}
                {data?.data?.consultant_time}
              </div>
              <div>
                <span className="font-semibold">Age:</span>{" "}
                {data?.data?.patient?.age}
              </div>
              <div>
                <span className="font-semibold">Contact No.:</span>{" "}
                {data?.data?.patient?.phone_number}
              </div>
            </div>
          </div>
          <div className="flex justify-between border-b border-black">
            <div className=" text-sm space-y-1">
              <div>
                <span className="font-semibold">Department:</span>{" "}
                {data?.data?.consultant?.category}
              </div>
            </div>

            <div className="text-sm space-y-1">
              <div>
                <span className="font-semibold">Consltant:</span>{" "}
                {data?.data?.consultant?.drname} <br />
                {data?.data?.consultant?.drinfo}
              </div>
              {data?.data?.consultant?.regno && (
                <div>
                  <span className="font-semibold"> Reg No.:</span>
                  {data?.data?.consultant?.regno}
                </div>
              )}
              {data?.data?.consultant?.contact && (
                <div>
                  <span className="font-semibold"> Contact No.:</span>
                  {data?.data?.consultant?.contact}
                </div>
              )}
              {data?.data?.consultant?.email && (
                <div>
                  <span className="font-semibold"> Email:</span>
                  {data?.data?.consultant?.email}
                </div>
              )}
            </div>
          </div>

          {/* Patient Details Header */}
          {/* <div className="bg-gray-100 p-4 rounded-lg mb-6">
                        <div className="flex justify-between items-center flex-wrap gap-4">
                            <div className="text-lg">
                                <span className="font-bold">Name:</span>{" "}
                                {data?.data?.patient?.fullname}
                            </div>
                            <div className="flex gap-6">
                                <div>
                                    <span className="font-bold">Age:</span>{" "}
                                    {data?.data?.patient?.age}
                                </div>
                                <div>
                                    <span className="font-bold">Sex:</span>{" "}
                                    {data?.data?.patient?.gender}
                                </div>
                                <div>
                                    <span className="font-bold">Date:</span>{" "}
                                    {formatDate(data?.data?.consultant_date)}
                                </div>
                                <div>
                                    <span className="font-bold">Time:</span>{" "}
                                    {formatDate(data?.data?.consultant_time)}
                                </div>
                            </div>
                        </div>
                    </div> */}

          {/* Main Content */}
          <div className="flex flex-1 gap-8 mt-2">
            {/* Left Column - Clinical Findings */}
            <div>
              <div className="flex w-full space-x-6 item-center ">

                <div className="w-72 text-lg">
                  <span className="font-semibold">Complain:</span>
                  <span >{data?.data.present_complain}</span>
                </div>
                <h1 className="text-lg font-semibold">Advice</h1>
              </div>
            </div>
          </div>

          {/* Doctor Footer */}
          <div className="mt-8 border-t-2 border-black pt-10">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs">
                  In case of any emergency contact to your nearest hospital .
                </p>
              </div>

              <div className="text-center">
                <div className="mb-2 h-1 w-48 border-b-2 border-black"></div>
                <p className="text-sm">Consultant Signature</p>
              </div>
            </div>
            <p className="text-sm text-center">Not for medico legal purpose</p>
          </div>
        </div>
      </PrintUi>
    </>
  );
};

export default withAuth(OpdPrint);
