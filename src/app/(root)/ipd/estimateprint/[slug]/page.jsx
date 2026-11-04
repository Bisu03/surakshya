"use client";

import Loading from "@/components/Loading";
import PrintUi from "@/components/ui/PrintUi";
import HospitalHeader from "@/components/ui/HospitalHeader";
import { HOSPITAL } from "@/lib/hospitalBrand";
import { withAuth } from "@/services/withAuth";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { fetchData } from "@/services/apiService";
import { formatDate } from "@/lib/formateDate";
import { amountToWords } from "@/lib/numberToWord";
import { normalizeMedicineCart } from "@/lib/money";
import { ErrorHandeling } from "@/utils/errorHandling";

const IpsEstimate = () => {
  const { slug } = useParams();
  const { data: session } = useSession();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  const [DoctorCharge, setDoctorCharge] = useState({ items: [], total: 0 });
  const [ServiceCharges, setServiceCharges] = useState({ items: [], total: 0 });
  const [MedicineCharge, setMedicineCharge] = useState({ items: [], total: 0 });
  const [AccessoryCharge, setAccessoryCharge] = useState({ items: [], total: 0 });

  const handleGetPatient = async () => {
    try {
      setLoading(true);
      const { data } = await fetchData(`/billing/${slug}`);
      if (data) {
        setFormData(data);
        setDoctorCharge(data?.consultant_cart || { items: [], total: 0 });
        setServiceCharges(data?.service_cart || { items: [], total: 0 });
        setMedicineCharge(normalizeMedicineCart(data?.medicine_cart));
        setAccessoryCharge(normalizeMedicineCart(data?.accessory_cart));
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
        <h2 className="text-lg font-bold text-center mb-2">Estimate Receipt</h2>
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
            Doctor Charges
          </h3>
          <table className="w-full text-[10px] print:text-[8px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-0.5 text-left border">Doctor</th>
                <th className="p-0.5 text-right border">Rate</th>
                <th className="p-0.5 text-right border">Visits</th>
                <th className="p-0.5 text-right border">Total</th>
              </tr>
            </thead>
            <tbody>
              {DoctorCharge?.items?.map((item, index) => (
                <tr key={index}>
                  <td className="p-0.5 border">{item?.drname}</td>
                  <td className="p-0.5 text-right border">
                    ₹{(item?.charge)}/visit
                  </td>
                  <td className="p-0.5 text-right border">
                    {item?.doctor_visit}
                  </td>
                  <td className="p-0.5 text-right border">₹{item?.charge * item?.doctor_visit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {ServiceCharges?.items?.length > 0 && (
          <div className="mt-1">
            <h3 className="text-xs font-semibold border-b border-black">
              Service Charges
            </h3>
            <table className="w-full text-[10px] print:text-[10px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-0.5 text-left border">Service</th>
                  <th className="p-0.5 text-right border">Rate</th>
                  <th className="p-0.5 text-right border">Qty</th>
                  <th className="p-0.5 text-right border">Total</th>
                </tr>
              </thead>
              <tbody>
                {ServiceCharges?.items?.map((item, index) => (
                  <tr key={index}>
                    <td className="p-0.5 border">{item?.servicename}</td>
                    <td className="p-0.5 text-right border">
                      ₹{item?.unitcharge}{" "}
                      {item?.unittype ? `/${item?.unittype}` : ""}
                    </td>
                    <td className="p-0.5 text-right border">
                      {item?.unit || "-"}
                    </td>
                    <td className="p-0.5 text-right border">
                      ₹{item?.unitcharge * item?.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {MedicineCharge?.total > 0 && (
          <div className="mt-1">
            <h3 className="text-xs font-semibold border-b border-black">
              Medicine Charges
            </h3>
            <table className="w-full text-[10px] print:text-[10px]">
              <tbody>
                <tr>
                  <td className="p-0.5 border">Medicine Charges</td>
                  <td className="p-0.5 text-right border">
                    ₹{MedicineCharge.total.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {AccessoryCharge?.total > 0 && (
          <div className="mt-1">
            <h3 className="text-xs font-semibold border-b border-black">
              Accessory Charges
            </h3>
            <table className="w-full text-[10px] print:text-[10px]">
              <tbody>
                <tr>
                  <td className="p-0.5 border">Accessory Charges</td>
                  <td className="p-0.5 text-right border">
                    ₹{AccessoryCharge.total.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Compact Billing Summary */}
        <div className="mt-2 flex justify-between gap-2 text-[10px] print:text-[8px]">
          <div className="flex-1">
            <p className="font-semibold">Amount in Words:</p>
            <p className="italic">
              {amountToWords(formData?.amount?.netTotal)}
            </p>
          </div>

          <div className="w-48 space-y-0.5">
            <div className="flex justify-between">
              <span>Total:</span>
              <span>₹{formData?.amount?.total?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>₹{formData?.amount?.discount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Net Total:</span>
              <span>₹{formData?.amount?.netTotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Paid:</span>
              <span>₹{formData?.amount?.paid?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Method:</span>
              <span className="capitalize">{formData?.paidby}</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-0.5">
              <span>Due:</span>
              <span className="text-red-600">
                ₹{formData?.amount?.due?.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Compact Footer */}
        <div className="mt-1 pt-1 border-t border-black">
          <div className="flex justify-between items-center text-[10px] text-gray-600">
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

export default withAuth(IpsEstimate);
