"use client";

import Loading from "@/components/Loading";
import PrintUi from "@/components/ui/PrintUi";
import HospitalHeader from "@/components/ui/HospitalHeader";
import { formatDate } from "@/lib/formateDate";
import { fetchData } from "@/services/apiService";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useParams } from "next/navigation";
import "suneditor/dist/css/suneditor.min.css";
import React, { useEffect, useState } from "react";

const PrintHeader = () => <HospitalHeader className="mb-4 print:mb-2" />;

const PathologyPrint = ({ data }) => {
  if (!data?.pathology_test?.length) {
    console.warn("No pathology_test data available:", data);
    return null;
  }

  const renderPatientDetails = () => (
    <div >
      <div className="text-base border border-gray-400 w-full">
        <div className="grid grid-cols-4 border-b border-gray-400">
          <div className="col-span-2 border-r border-gray-400 p-1">
            <span className="font-semibold">Name:</span>{" "}
            {data?.patient?.fullname || ""}
          </div>
          <div className="col-span-2 p-1">
            <span className="font-semibold">UHID:</span> {data?.mrd_id || ""}
          </div>
        </div>
        <div className="grid grid-cols-4 border-b border-gray-400">
          <div className="col-span-2 border-r border-gray-400 p-1">
            <span className="font-semibold">Gender/Age:</span>{" "}
            {data?.patient?.gender || ""} / {data?.patient?.age || ""}
          </div>
          <div className="col-span-2 p-1">
            <span className="font-semibold">Bill No.:</span>{" "}
            {data?.bill_no || ""}
          </div>
        </div>
        <div className="grid grid-cols-4">
          <div className="col-span-2 p-1 font-semibold border-r border-gray-400">
            <span className="font-semibold">Referred By:</span>{" "}
            {data?.consultant?.drname || ""}{" "}
            {data?.consultant?.drinfo && (
              <span>({data?.consultant?.drinfo})</span>
            )}
          </div>
          <div className="col-span-2 p-1">
            <span className="font-semibold">Date/Time:</span>{" "}
            {formatDate(data?.reporting_date) || ""}{" "}
            {data?.reporting_time || ""}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTable = (test, items) => {
    const parameters =
      items
        ?.filter((item) => item?.type === "parameter")
        ?.map((item) => ({
          name: item?.data?.name,
          result: item?.data?.result,
          units: item?.data?.units,
          range: item?.data?.range,
          isBold: item?.data?.isBold || false,
          testMethod: item?.data?.testMethod,
        })) || [];

    const subTests =
      items
        ?.filter((item) => item?.type === "subTest")
        ?.map((item) => ({
          name: item?.data?.name,
          parameters:
            item?.data?.parameters?.map((param) => ({
              name: param?.name,
              result: param?.result,
              units: param?.units,
              range: param?.range,
              isBold: param?.isBold || false,
              testMethod: param?.testMethod,
            })) || [],
        })) || [];

    return (
      <div className="text-sm">
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left px-2 border">Test Name</th>
              <th className="text-left px-2 border">Result</th>
              <th className="text-left px-2 border">Normal Value</th>
            </tr>
          </thead>
          <tbody>
            {parameters
              ?.filter((param) => param?.result)
              ?.map((param, paramIndex) => (
                <tr className="items-center" key={`param-${paramIndex}`}>
                  <td className={`px-2 ${param?.isBold ? "font-bold" : ""}`}>
                    {param?.name} <br />
                    {param?.testMethod && (
                      <span className="text-[10px] m-0 p-0">
                        ({param?.testMethod})
                      </span>
                    )}
                  </td>
                  <td className={`px-2  ${param?.isBold ? "font-bold" : ""}`}>
                    {param?.result} {param?.units || ""}
                  </td>
                  <td
                    className="px-2 text-[12px] "
                    style={{
                      whiteSpace: "pre-wrap",
                      minWidth: "120px",
                      maxWidth: "300px",
                    }}
                  >
                    {param?.range}
                  </td>
                </tr>
              ))}
            {subTests?.flatMap((subTest, subTestIndex) => [
              <tr key={`sub-${subTestIndex}-header`}>
                <td className="px-2  font-bold" colSpan="3">
                  {subTest?.name}
                </td>
              </tr>,
              ...(subTest?.parameters
                ?.filter((param) => param?.result)
                ?.map((param, paramIndex) => (
                  <tr className="items-center" key={`sub-${subTestIndex}-param-${paramIndex}`}>
                    <td className={`px-2  ${param?.isBold ? "font-bold" : ""}`}>
                      {param?.name} <br />
                      {param?.testMethod && (
                        <span className="text-[10px] m-0 p-0">
                          ({param?.testMethod})
                        </span>
                      )}
                    </td>
                    <td className={`px-2  ${param?.isBold ? "font-bold" : ""}`}>
                      {param?.result} {param?.units || ""}
                    </td>
                    <td
                      className="px-2 text-[12px] "
                      style={{
                        whiteSpace: "pre-wrap",
                        minWidth: "120px",
                        maxWidth: "300px",
                      }}
                    >
                      {param?.range}
                    </td>
                  </tr>
                )) || []),
            ])}
          </tbody>
        </table>
      </div>
    );
  };

  const renderInstrumentAndComment = (test) => {
    const testInstrument = test?.instrument;
    const testComment = test?.comment;
    const testAssessment = test?.assessment;
    const testReportAnalysis = test?.report_analysis;
    const showAssessment = test?.show_assessment ?? false;
    const showReportAnalysis = test?.show_report_analysis ?? false;

    return (
      <div className="mt-4 text-[12px] print:mt-[4mm]">
        {testInstrument && (
          <p className="print:mb-[2mm]">
            <strong>Instrument used:</strong> {testInstrument}
          </p>
        )}
        {testComment && (
          <p className="print:mb-[2mm]">
            <strong>Comment:</strong> {testComment}
          </p>
        )}
        {showReportAnalysis && testReportAnalysis && (
          <div className="print:page-break-inside-avoid print:mt-[4mm]">
            <p className="font-semibold mt-2 print:mt-0">
              Report Analysis/Notes:
            </p>
            <div
              className="sun-editor-editable rounded print:border print:p-2"
              dangerouslySetInnerHTML={{
                __html: testReportAnalysis || "",
              }}
            />
          </div>
        )}
        {showAssessment && testAssessment && (
          <div className="print:page-break-inside-avoid print:mt-[4mm]">
            <p className="font-semibold mt-2 print:mt-0">Assessment:</p>
            <div
              className="sun-editor-editable rounded print:border print:p-2"
              dangerouslySetInnerHTML={{
                __html: testAssessment || "",
              }}
            />
          </div>
        )}
      </div>
    );
  };

  const splitTestItems = (test) => {
    const parameters =
      test?.testItems?.filter((item) => item?.type === "parameter") || [];
    const subTestParameters =
      test?.testItems
        ?.filter((item) => item?.type === "subTest")
        ?.flatMap((item) => item?.data?.parameters || []) || [];
    const totalItems = parameters.length + subTestParameters.length;

    console.log(`Test ${test?.name}: ${totalItems} items`);

    if (totalItems <= 20) {
      return [{ items: test?.testItems || [], pageBreak: false }];
    }

    let currentCount = 0;
    const firstPageItems = [];
    const secondPageItems = [];

    for (const item of test?.testItems || []) {
      if (item.type === "parameter") {
        if (currentCount < 20) {
          firstPageItems.push(item);
          currentCount += 1;
        } else {
          secondPageItems.push(item);
        }
      } else if (item.type === "subTest") {
        const subTestParams = item?.data?.parameters || [];
        if (currentCount + subTestParams.length <= 20) {
          firstPageItems.push(item);
          currentCount += subTestParams.length;
        } else {
          const remaining = 20 - currentCount;
          if (remaining > 0) {
            firstPageItems.push({
              ...item,
              data: {
                ...item.data,
                parameters: subTestParams.slice(0, remaining),
              },
            });
            secondPageItems.push({
              ...item,
              data: {
                ...item.data,
                parameters: subTestParams.slice(remaining),
              },
            });
            currentCount += remaining;
          } else {
            secondPageItems.push(item);
            currentCount += subTestParams.length;
          }
        }
      }
    }

    console.log(
      `Split for ${test?.name}: First page: ${firstPageItems.length} items, Second page: ${secondPageItems.length} items`
    );

    if (!firstPageItems.length) {
      console.warn(`Empty first page for test ${test?.name}`);
      return [{ items: test?.testItems || [], pageBreak: false }];
    }

    return [
      { items: firstPageItems, pageBreak: false },
      { items: secondPageItems, pageBreak: true },
    ];
  };

  return (
    <>
      <div className="flex flex-col">
        {data?.pathology_test?.map((test, index) => {
          const pages = splitTestItems(test);
          return pages.map((page, pageIndex) => (
            <div
              key={`${test?._id || index}-page-${pageIndex}`}
              className={`test-section flex flex-col ${
                index === 0 && pageIndex === 0 ? "first-page" : ""
              }`}
              style={{
                pageBreakBefore: index > 0 || pageIndex > 0 ? "always" : "auto",
              }}
            >
              {index === 0 && pageIndex === 0 && (
                <PrintHeader />
              )}
              {renderPatientDetails()}
              <div className="text-center">
                {test?.sampleType && (
                  <p className="text-left text-base print:mb-[2mm]">
                    Specimen: {test?.sampleType}
                  </p>
                )}
                <h2 className="text-lg font-bold uppercase print:mb-[2mm]">
                  {test?.department}
                </h2>
                {test?.reporting_details?.length > 0 && (
                  <div className="text-left text-base mt-2 print:mt-0 print:mb-[2mm]">
                    {test?.reporting_details?.map((detail, detailIndex) => (
                      <p key={detailIndex}>
                        {detail?.label}:{" "}
                        {detail?.type === "date"
                          ? formatDate(detail.input)
                          : detail?.input}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {renderTable(test, page.items)}
              {renderInstrumentAndComment(test)}
            </div>
          ));
        })}
      </div>
    </>
  );
};

const RadiologyPrint = ({ data }) => (
  <>
    <style jsx>
      {`
      @media print {
        .min-h-\[90vh\] {
          min-height: auto;
          margin-bottom: 0 !important;
        }
        .radiology-section {
          margin-bottom: 55mm !important;
          break-after: auto;
        }
        .first-page {
          page-break-before: avoid !important;
        }
        .print\:page-break-inside-avoid {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .print\:mt-\[16mm\] {
          margin-top: 16mm !important;
        }
        .print\:mt-\[4mm\] {
          margin-top: 4mm !important;
        }
        .print\:mb-\[2mm\] {
          margin-bottom: 2mm !important;
        }
        .print\:border {
          border: 1px solid #d1d5db !important;
        }
        .print\:p-2 {
          padding: 8px !important;
        }
        @page {
          margin: 0;
        }
      }
    `}
    </style>
    <div className="radiology-section flex flex-col first-page">
      <PrintHeader />
      <div >
        <div className="text-lg border border-gray-400 w-full">
          <div className="grid grid-cols-4 border-b border-gray-400">
            <div className="col-span-2 border-r border-gray-400 p-1">
              <span className="font-semibold">Name:</span>{" "}
              {data?.patient?.fullname || ""}
            </div>
            <div className="col-span-2 p-1">
              <span className="font-semibold">UHID:</span>{" "}
              {data?.mrd_id || ""}
            </div>
          </div>
          <div className="grid grid-cols-4 border-b border-gray-400">
            <div className="col-span-2 border-r border-gray-400 p-1">
              <span className="font-semibold">Gender/Age:</span>{" "}
              {data?.patient?.gender || ""} / {data?.patient?.age || ""}
            </div>
            <div className="col-span-2 p-1">
              <span className="font-semibold">Bill No.:</span>{" "}
              {data?.bill_no || ""}
            </div>
          </div>
          <div className="grid grid-cols-4">
            <div className="col-span-2 p-1 font-semibold border-r border-gray-400">
              <span className="font-semibold">Referred By:</span>{" "}
              {data?.consultant?.drname || ""}{" "}
              {data?.consultant?.drinfo && (
                <span>({data?.consultant?.drinfo})</span>
              )}
            </div>
            <div className="col-span-2 p-1">
              <span className="font-semibold">Date/Time:</span>{" "}
              {formatDate(data?.reporting_date) || ""}{" "}
              {data?.reporting_time || ""}
            </div>
          </div>
        </div>
      </div>
      {data?.radiology_reading && (
        <div className="mt-4 print:mt-[4mm] print:page-break-inside-avoid">
          <p className="font-semibold print:mb-[2mm]">Radiology Reading:</p>
          <div
            className="sun-editor-editable rounded print:border print:p-2"
            dangerouslySetInnerHTML={{
              __html: data?.radiology_reading || "",
            }}
          />
        </div>
      )}
    </div>
  </>
);

const LabPrint = () => {
  const { data: session } = useSession();
  const [ToggleTest, setToggleTest] = useState(true);
  const { slug } = useParams();

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["labtestrecord", slug],
    queryFn: () => fetchData(`/labtest/${slug}`),
  });

  useEffect(() => {
    refetch();
  }, [slug]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.altKey && e.key === "1") {
        e.preventDefault();
        setToggleTest(true);
      } else if (e.altKey && e.key === "2") {
        e.preventDefault();
        setToggleTest(false);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [ToggleTest]);

  if (isLoading) return <Loading />;

  return (
    <>
      <div className="flex justify-end space-x-2 p-4">
        <button
          className={`${ToggleTest ? "btn-error" : "btn-secondary"} btn`}
          onClick={() => setToggleTest(true)}
          title="Alt+1"
        >
          Pathology (Alt+1)
        </button>
        <button
          className={`${!ToggleTest ? "btn-error" : "btn-secondary"} btn`}
          onClick={() => setToggleTest(false)}
          title="Alt+2"
        >
          Radiology (Alt+2)
        </button>
      </div>
      <PrintUi path="/labtest/record">
        <div className="mx-auto bg-white p-6">
          {ToggleTest ? (
            <PathologyPrint data={data?.data} />
          ) : (
            <RadiologyPrint data={data?.data} />
          )}
        </div>
      </PrintUi>
    </>
  );
};

export default LabPrint;
