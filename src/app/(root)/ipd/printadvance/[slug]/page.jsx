"use client";

import Loading from "@/components/Loading";
import PrintUi from "@/components/ui/PrintUi";
import HospitalHeader from "@/components/ui/HospitalHeader";
import { HOSPITAL } from "@/lib/hospitalBrand";
import { withAuth } from "@/services/withAuth";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchData } from "@/services/apiService";
import { formatDate } from "@/lib/formateDate";
import QRCode from "react-qr-code";
import { amountToWords } from "@/lib/numberToWord";

const PrintAdvance = () => {
  const { slug } = useParams();
  const { data: session } = useSession();

  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const handleGetPatient = async () => {
    try {
      setLoading(true);
      const { data } = await fetchData(`/billing/${slug}`);
      if (data) {
        setFormData(data);
      }
    } catch (error) {
      ErrorHandeling(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGetPatient(); // Fetch data when slug changes
  }, [slug]);

  return (
    <PrintUi path="/ipd/record">
      <HospitalHeader />

      {loading && <Loading />}
      <div className="mx-auto bg-white p-2 print:p-1">
        {/* Compact Patient Details */}
        <h2 className="text-lg font-bold text-center mb-2">Advance Receipt</h2>
        <div className="grid grid-cols-3 gap-1 mb-2 print:grid-cols-3">
          <div className="col-span-2">
            <h3 className="text-xs font-semibold border-b border-black">
              Patient Details
            </h3>
            <div className="text-[10px] space-y-0.5 print:text-[9px]">
              <p>
                Name:- {formData?.patient?.fullname} (
                {formData?.patient?.gender}/{formData?.patient?.age})
              </p>
              <p>Phone Number:- {formData?.patient?.phone_number}</p>
              <p className="truncate">Address:- {formData?.patient?.address}</p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold border-b border-black">
              Admission
            </h3>
            <div className="text-[10px] space-y-0.5 print:text-[9px]">
              <p>
                {formatDate(formData?.ipd?.admit_date)}{" "}
                {formData?.ipd?.admit_time}
              </p>
              <p>UHID: {formData?.mrd_id}</p>
              <p>REGID: {formData?.reg_id}</p>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-xs font-semibold border-b border-black">
            Advance
          </h3>
          <table className="w-full text-[10px] print:text-[8px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-0.5 text-left border">Date</th>
                <th className="p-0.5 text-right border">Advance Amount</th>
                <th className="p-0.5 text-right border">Paid By</th>
              </tr>
            </thead>
            <tbody>
              {formData?.advances?.map((item, index) => (
                <tr key={index}>
                  <td className="p-0.5 border">{formatDate(item.date)}</td>
                  <td className="p-0.5 text-right border">₹{item.amount}</td>
                  <td className="p-0.5 text-right border">{item.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Compact Footer */}
        <div className=" pt-1 border-t border-black">
          <div className="flex justify-between items-center text-[10px] text-gray-600 mt-4">
            <p>Thank you for choosing {HOSPITAL.name}</p>
            <div className="text-center">
              <div className="mt-10 w-32 border-b border-black"></div>
              <p>Signature & Stamp</p>
            </div>
          </div>
        </div>
      </div>
    </PrintUi>
  );
};

export default withAuth(PrintAdvance);
