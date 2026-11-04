
"use client";

import Loading from "@/components/Loading";
import PrintUi from "@/components/ui/PrintUi";
import HospitalHeader from "@/components/ui/HospitalHeader";
import { formatDate } from "@/lib/formateDate";
import { amountToWords } from "@/lib/numberToWord";
import { fetchData } from "@/services/apiService";
import { withAuth } from "@/services/withAuth";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

const PrintReceipt = () => {
  const { data: session } = useSession();
  const { slug } = useParams();

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["moneyreceipt", slug], // Unique query key
    queryFn: () => fetchData(`/moneyreceipt/${slug}`), // Function to fetch data
  });

  useEffect(() => {
    refetch(); // Fetch data when slug changes
  }, [slug]);

  const [docType, setDocType] = useState({
    finalBill: false,
    moneyReceipt: true,
  });

  const headingText =
    [
      docType.finalBill ? "Final Bill" : null,
      docType.moneyReceipt ? "Money Receipt" : null,
    ]
      .filter(Boolean)
      .join(" / ") || "Money Receipt";

  return (
    <PrintUi path="/moneyreceipt/addnew" >
      {/* Screen-only selector: chooses the printed heading. Hidden in print. */}
      <div className="print:hidden flex flex-wrap items-center gap-4 px-6 py-3 bg-gray-50 border-b">
        <span className="text-sm font-medium text-gray-600">
          Document type:
        </span>
        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={docType.finalBill}
            onChange={(e) =>
              setDocType((prev) => ({ ...prev, finalBill: e.target.checked }))
            }
          />
          Final Bill
        </label>
        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={docType.moneyReceipt}
            onChange={(e) =>
              setDocType((prev) => ({ ...prev, moneyReceipt: e.target.checked }))
            }
          />
          Money Receipt
        </label>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none">
        <HospitalHeader />

        <h2 className="text-center text-lg font-bold mt-4 mb-3 underline">
          {headingText}
        </h2>
        {isLoading && <Loading />}

        {/* Patient Info */}
        <div className="grid grid-cols-2 gap-4 text-sm px-4">
          <div className="space-y-1">
            <p>
              <span className="font-semibold">UHID:</span>{" "}
              {data?.data?.mrd_id || "-"}
            </p>
            <p>
              <span className="font-semibold">REGID:</span>{" "}
              {data?.data?.reg_id || "-"}
            </p>
            <p>
              <span className="font-semibold">Patient Name:</span>{" "}
              {data?.data?.patient?.fullname || "-"}
            </p>
            <p>
              <span className="font-semibold">Age/Gender:</span>{" "}
              {data?.data?.patient?.age || "-"} /{" "}
              {data?.data?.patient?.gender || "-"}
            </p>
            <p>
              <span className="font-semibold">Guardian Name:</span>{" "}
              {data?.data?.patient?.guardian_name || "-"}
            </p>
          </div>

          <div className="space-y-1">
            <p>
              <span className="font-semibold">Address:</span>{" "}
              {data?.data?.patient?.address || "-"}
            </p>
            <p>
              <span className="font-semibold">Admission Date:</span>{" "}
              {formatDate(data?.data?.admit_date)}{" "}
              {data?.data?.admit_time || "-"}
            </p>
            <p>
              <span className="font-semibold">Discharge Date:</span>{" "}
              {formatDate(data?.data?.billing_date)}{" "}
              {data?.data?.billing_time || "-"}
            </p>
          </div>
        </div>

        <div className="px-4 border-t border-dashed border-gray-400 pt-1">
          <div className="flex justify-between items-start text-sm flex-wrap gap-4">
            {/* Left side */}
            <div className="space-y-1">
              <p>
                <span className="font-semibold">Payment Mode:</span>{" "}
                {data?.data?.paidby || "-"}
              </p>
              <p>
                <span className="font-semibold">Paid Amount:</span> ₹
                {data?.data?.amount?.toFixed(2) || "0.00"}
              </p>
            </div>

            {/* Right side */}
            <div className="space-y-1 text-right">
              <p>
                <span className="font-semibold">In Words:</span>{" "}
                {amountToWords(data?.data?.amount)} Only
              </p>
            </div>
          </div>
        </div>

        {/* Signature + Footer */}
        <div className="mt-4 mb-2 px-4">
          <div className="flex justify-between items-end text-sm">
            <span>Date: {formatDate(data?.data?.billing_date)}</span>
            <div className="text-center">
              <div className="mt-12 border-t-2 border-black w-32 mx-auto" />
              <div className="mb-6">Signature</div>
            </div>
          </div>
        </div>
      </div>
    </PrintUi>
  );
};

export default withAuth(PrintReceipt);
