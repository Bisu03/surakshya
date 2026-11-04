"use client";

import Loading from "@/components/Loading";
import PrintUi from "@/components/ui/PrintUi";
import { HOSPITAL, HOSPITAL_ADDRESS } from "@/lib/hospitalBrand";
import { withAuth } from "@/services/withAuth";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { fetchData } from "@/services/apiService";
import { formatDate } from "@/lib/formateDate";
import { amountToWords } from "@/lib/numberToWord";
import Image from "next/image";

const ConsultantFeePrint = () => {
  const { slug } = useParams();
  const { data: session } = useSession();

  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  const handleGetPatient = async () => {
    try {
      setLoading(true);
      const { data } = await fetchData(`/consultantfee/${slug}`);
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
    handleGetPatient();
  }, [slug]);

  return (
    <PrintUi path="/consultantfee/record">
      {loading && <Loading />}
      <div className=" mx-auto p-8 font-sans bg-white">
        {/* Header Section with exact spacing */}
        <div className="flex justify-between text-sm mb-6">
          <div>Bill No.:- {formData?.billno}</div>
          <div>Reg No.:- {formData?.consultant?.regno}</div>
        </div>

        {/* Doctor Name and Credentials - exact formatting */}
        <div className="text-center ">
          <h1 className="text-4xl font-bold tracking-wide">
            {formData?.consultant?.drname}
          </h1>
          <p className="text-lg mt-1"> {formData?.consultant?.drinfo}</p>
          <p className="mt-1 font-semibold">{HOSPITAL.name}</p>
          <p>{HOSPITAL_ADDRESS}</p>
        </div>

        {/* Exact divider line */}
        <div className="border-t-2 border-black mb-8"></div>

        {/* Receipt Details with exact spacing and underlines */}
        <div className="space-y-2 text-sm">
          <div className="flex">
            <div className="w-36">Receive Amount</div>
            <div className="w-32 border-b border-black mx-2 px-2">
              {formData?.amount}
            </div>
            <div className="w-36">Amount In Word</div>
            <div className="flex-1 border-b border-black mx-2 px-2">
              {amountToWords(formData?.amount)}
            </div>
          </div>

          <div className="flex">
            <div className="w-36">Description</div>
            <div className="flex border-b border-black mx-2 px-2">
              {formData?.desc?.map((item, index) => (
                <p key={index}>{item.value}, </p>
              ))}
            </div>
          </div>

          <div className="flex">
            <div className="w-36">From</div>
            <div className="flex-1 border-b border-black mx-2 px-2">
              {formData?.fullname}
            </div>
          </div>

          <div className="flex">
            <div className="w-36">Guardian Name</div>
            <div className="flex-1 border-b border-black mx-2 px-2">
              {formData?.guardian_name}
            </div>
          </div>

          <div className="flex">
            <div className="w-36">Address</div>
            <div className="flex-1 border-b border-black mx-2 px-2">
              {formData?.address}
            </div>
          </div>

          <div className="flex">
            <div className="w-36">On</div>
            <div className="flex-1 border-b border-black mx-2 px-2">
              {formData?.date}
            </div>
          </div>
        </div>

        {/* Footer with Date and Signature - exact spacing */}
        <div className="flex justify-between mt-16">
          <div>Date:- {formData?.date}</div>
          <div className="text-right"> {formData?.consultant?.drname}</div>
        </div>
      </div>
    </PrintUi>
  );
};

export default withAuth(ConsultantFeePrint);
