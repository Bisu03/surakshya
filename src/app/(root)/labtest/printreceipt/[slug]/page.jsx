"use client";


import Loading from "@/components/Loading";
import PrintUi from "@/components/ui/PrintUi";
import { HOSPITAL, HOSPITAL_ADDRESS, HOSPITAL_CONTACT } from "@/lib/hospitalBrand";
import { withAuth } from "@/services/withAuth";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchData } from "@/services/apiService";
import { formatDate } from "@/lib/formateDate";
import { amountToWords } from "@/lib/numberToWord";
import QRCode from "react-qr-code";

const LabReceipt = () => {
  const { slug } = useParams();
  const { data: session } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ["labtestrecord", slug],
    queryFn: () => fetchData(`/labtest/${slug}`),
    enabled: !!slug,
    retry: 4,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) return <Loading />;

  const pathologyData = data?.data;
  const patient = pathologyData?.patient;
  const consultant = pathologyData?.consultant;
  const amount = pathologyData?.amount;
  const payments = pathologyData?.payments || [];

  const combinedTests = [
    ...(pathologyData?.pathology_test_cart?.services || []).map((test) => ({
      name: test.pathology_category,
      charge: test.pathology_charge,
    })),
    ...(pathologyData?.radiology_test_cart?.services || []).map((test) => ({
      name: test.test_name,
      charge: test.test_charge,
    })),
  ];

  const chunkSize = 7;
  const testChunks = [];
  for (let i = 0; i < combinedTests.length; i += chunkSize) {
    testChunks.push(combinedTests.slice(i, i + chunkSize));
  }

  const totalPages = testChunks.length;
  const latestPaymentMode = payments.length > 0 ? payments[payments.length - 1].mode : "N/A";

  const Header = () => (
    <>
      <div className="text-center mb-2 print:mb-1 w-full max-w-xl mx-auto flex-shrink-0">
        <h1 className="text-2xl font-bold uppercase tracking-tight mb-0">
          {HOSPITAL.name}
        </h1>
        <p className="text-base font-semibold text-black mb-0 print:text-[14px] w-full flex-shrink">
          {HOSPITAL_ADDRESS}
        </p>
        <div className="text-base font-semibold text-black mb-0 print:text-[15px] w-full flex-shrink">
          <p>{HOSPITAL_CONTACT}</p>
        </div>
      </div>
      <div className="border-b-2 border-black my-0 print:my-0"></div>
      <h2 className="text-base font-bold underline print:text-[12pt] text-center">RECEIPT</h2>
    </>
  );

  return (
    <div className="flex justify-center w-full">
      <PrintUi path="/labtest/record">
        <style jsx global>{`
          @media print {
            .page {
              width: 210mm;
              min-height: 297mm;
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              page-break-after: always;
              font-size: 10pt;
            }
            .page:last-child {
              page-break-after: auto;
            }
            body {
              margin: 0;
            }
            @page {
              size: A4;
              margin: 0;
            }
            .print-header h1 {
              font-size: 16pt !important;
            }
            .print-header p {
              font-size: 10pt !important;
            }
            
            /* Patient Details Print Spacing Fix */
            .print\\:space-y-0 > * + * {
              margin-top: 0 !important;
            }
            .print\\:leading-snug {
              line-height: 1.3 !important;
            }
            .print\\:mb-0\\.5 {
              margin-bottom: 2px !important;
            }
            .print\\:mt-0 {
              margin-top: 0 !important;
            }
            .print\\:gap-2 {
              gap: 0.5rem !important;
            }
            .print\\:text-\\[16px\\] {
              font-size: 16px !important;
            }
            .print\\:text-\\[14px\\] {
              font-size: 14px !important;
            }
            .print\\:text-\\[15px\\] {
              font-size: 15px !important;
            }
            
            /* Very minimal spacing for print */
            .grid p {
              line-height: 1.3 !important;
            }
            
            /* Header fixed width and shrink */
            .flex-shrink {
              flex-shrink: 1;
              overflow-wrap: break-word;
            }
          }
          .page {
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            width: 210mm;
            padding: 12mm;
          }
          .receipt-table th,
          .receipt-table td {
            padding: 0 !important;
            padding-left: 2px !important;
            padding-right: 2px !important;
            font-size: 14px !important;
          }
          @media print {
            .receipt-table th,
            .receipt-table td {
              padding: 0 !important;
              padding-left: 2px !important;
              padding-right: 2px !important;
              font-size: 14px !important;
            }
          }
        `}</style>

        {testChunks.map((chunk, index) => {
          const isLastPage = index === totalPages - 1;

          return (
            <div key={index} className="page">
              <div className="bg-white">
                <Header />

                <div className="grid grid-cols-2 gap-2 mb-2 print:mb-1 print:gap-2">
                  <div className="space-y-0.5 print:space-y-0">
                    <div className="text-xl print:text-[16px] print:leading-snug">
                      <p className="mb-1 print:mb-0.5 print:mt-0">
                        <span className="font-semibold">Full Name:</span>{" "}
                        {patient?.fullname}
                      </p>
                      <div className="flex space-x-2 mb-1 print:mb-0.5 print:mt-0">
                        <p className="mb-0 print:mb-0 print:mt-0">
                          <span className="font-semibold">Gender:</span>{" "}
                          {patient?.gender}
                        </p>
                        <p className="mb-0 print:mb-0 print:mt-0">
                          <span className="font-semibold">Age:</span>{" "}
                          {patient?.age}
                        </p>
                      </div>
                      <p className="mb-0 print:mb-0 print:mt-0">
                        <span className="font-semibold">Phone No.:</span>{" "}
                        {patient?.phone_number}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-0.5 print:space-y-0">
                    <div className="text-xl print:text-[16px] print:leading-snug">
                      <p className="mb-1 print:mb-0.5 print:mt-0">
                        <span className="font-semibold">Date/Time:</span>{" "}
                        {formatDate(pathologyData?.reporting_date)} /{" "}
                        {pathologyData?.reporting_time}
                      </p>
                      {pathologyData?.reg_id && (
                        <p className="mb-1 print:mb-0.5 print:mt-0">
                          <span className="font-semibold">REGID:</span>{" "}
                          {pathologyData?.reg_id}
                        </p>
                      )}
                      <div className="flex space-x-2 mb-1 print:mb-0.5 print:mt-0">
                        <p className="mb-0 print:mb-0 print:mt-0">
                          <span className="font-semibold">Patient Id:</span>{" "}
                          {pathologyData?.mrd_id}
                        </p>
                        <p className="mb-0 print:mb-0 print:mt-0">
                          <span className="font-semibold">Bill No.:</span>{" "}
                          {pathologyData?.bill_no}
                        </p>
                      </div>
                      <p className="mb-0 print:mb-0 print:mt-0">
                        <span className="font-semibold">Referred By:</span>{" "}
                        {consultant?.drname} {consultant?.drinfo && <span>({consultant?.drinfo})</span>}
                      </p>
                    </div>
                  </div>
                </div>

                <table className="receipt-table w-full mb-2 print:mb-1 border border-gray-400">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="text-left px-1">Sl No</th>
                      <th className="text-left px-1">Test Name</th>
                      <th className="text-right px-1">Charge (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chunk?.map((test, i) => (
                      <tr key={i} className="font-medium">
                        <td className="px-2">{i + 1}</td>
                        <td className="px-2">{test?.name}</td>
                        <td className="px-2 text-right">
                          {Number(test?.charge).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {isLastPage && (
                  <div className="flex justify-between space-x-2 mt-2 print:mt-1">
                    <div className="flex-grow text-left">
                      <h2 className="text-sm font-semibold text-gray-600">
                        Amount in Words:
                      </h2>
                      <h1 className="text-base font-medium text-gray-700">
                        {amountToWords(amount?.netTotal)}
                      </h1>
                      <p className="text-sm text-gray-600 mt-12">
                        Created By: {pathologyData?.admited_by}
                      </p>
                    </div>
                    <div>
                      <QRCode
                        size={50}
                        style={{
                          height: "auto",
                          width: "100%",
                        }}
                        value={`${typeof window !== "undefined" ? window.location.origin : ""}/labreport/${pathologyData?.bill_no}`}
                        viewBox="0 0 100 100"
                      />
                    </div>
                    <div className="w-72 m-0 p-0 space-y-0">
                      <div className="flex justify-between font-semibold mb-0">
                        <span>Total Charges:</span>
                        <span className="text-right">₹{amount?.total?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between mb-0">
                        <span>Discount Amount:</span>
                        <span className="text-right">₹{amount?.discount?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between mb-0">
                        <span>Net Total:</span>
                        <span className="text-right">₹{amount?.netTotal?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between mb-0">
                        <span>Paid Amount:</span>
                        <span className="text-right">₹{pathologyData?.total_paid?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between mb-0">
                        <span>Due Amount:</span>
                        <span className="text-red-600 text-right">₹{pathologyData?.due?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between mb-0">
                        <span>Payment Mode:</span>
                        <span className="text-right">{latestPaymentMode}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </PrintUi>
    </div>
  );
};

export default withAuth(LabReceipt);
