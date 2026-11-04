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
import "suneditor/dist/css/suneditor.min.css"; // Import SunEditor styles
import React, { useEffect, useState } from "react";

const PrintHeader = () => <HospitalHeader className="mb-4 print:mb-2" />;

const PathologyPrint = ({ data }) => {
  // Fallback if no pathology data
  if (!data?.pathology_test?.length) {
    console.warn("No pathology_test data available:", data);
    return null;
  }

  const renderPatientDetails = () => (
    <div className="mt-16">
      <div className="text-sm border border-gray-400 w-full">
        {/* Row 1 */}
        <div className="grid grid-cols-4 border-b border-gray-400">
          <div className="col-span-2 border-r border-gray-400 p-1">
            <span className="font-semibold">Name:</span>{" "}
            {data?.patient?.fullname || "Not Available"}
          </div>
          <div className="col-span-2 p-1">
            <span className="font-semibold">UHID:</span>{" "}
            {data?.mrd_id || "N/A"}
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-4 border-b border-gray-400">
          <div className="col-span-2 border-r border-gray-400 p-1">
            <span className="font-semibold">Gender/Age:</span>{" "}
            {data?.patient?.gender || "N/A"} / {data?.patient?.age || "N/A"}
          </div>
          <div className="col-span-2 p-1">
            <span className="font-semibold">Bill No.:</span>{" "}
            {data?.bill_no || "N/A"}
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-4">
          <div className="col-span-2 p-1 font-semibold">
            <span className="font-semibold">Referred By:</span>{" "}
            {data?.consultant?.drname || "N/A"}{" "}
            {data?.consultant?.drinfo && <>({data?.consultant?.drinfo})</>}
          </div>
          <div className="col-span-2 border-r border-gray-400 p-1">
            <span className="font-semibold">Date/Time:</span>{" "}
            {formatDate(data?.reporting_date) || "N/A"}{" "}
            {data?.reporting_time || "N/A"}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTable = (test) => {
    // Fallback to result.parameters and result.subTests for backward compatibility
    const parameters =
      test?.testItems
        ?.filter((item) => item?.type === "parameter")
        ?.map((item) => ({
          name: item?.data?.name,
          result: item?.data?.result,
          units: item?.data?.units,
          range: item?.data?.range,
          isBold: item?.data?.isBold || false,
        })) ||
      test?.result?.parameters ||
      [];

    const subTests =
      test?.testItems
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
            })) || [],
        })) ||
      test?.result?.subTests ||
      [];

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
            {/* Main test parameters */}
            {parameters
              ?.filter((param) => param?.result)
              ?.map((param, paramIndex) => (
                <tr key={`param-${paramIndex}`}>
                  <td
                    className={`px-2 border ${param?.isBold ? "font-bold" : ""
                      }`}
                  >
                    {param?.name || "N/A"} <br />
                    {param?.testMethod && <>({param?.testMethod})</>}
                  </td>
                  <td
                    className={`px-2 border ${param?.isBold ? "font-bold" : ""
                      }`}
                  >
                    {param?.result || "N/A"} {param?.units || ""}
                  </td>
                  <td
                    className="px-2 border"
                    style={{
                      whiteSpace: "pre-wrap",
                      minWidth: "120px",
                      maxWidth: "300px",
                    }}
                  >
                    {param?.range || "N/A"}
                  </td>
                </tr>
              ))}

            {/* SubTests */}
            {subTests?.flatMap((subTest, subTestIndex) => [
              // SubTest header
              <tr key={`sub-${subTestIndex}-header`}>
                <td className="px-2 border font-bold" colSpan="3">
                  {subTest?.name || "N/A"}
                </td>
              </tr>,
              // SubTest parameters
              ...(subTest?.parameters
                ?.filter((param) => param?.result)
                ?.map((param, paramIndex) => (
                  <tr key={`sub-${subTestIndex}-param-${paramIndex}`}>
                    <td
                      className={`px-2 border ${param?.isBold ? "font-bold" : ""
                        }`}
                    >
                      {param?.name || "N/A"} <br />
                      {param?.testMethod && <>({param?.testMethod})</>}
                    </td>
                    <td
                      className={`px-2 border ${param?.isBold ? "font-bold" : ""
                        }`}
                    >
                      {param?.result || "N/A"} {param?.units || ""}
                    </td>
                    <td
                      className="px-2 border"
                      style={{
                        whiteSpace: "pre-wrap",
                        minWidth: "120px",
                        maxWidth: "300px",
                      }}
                    >
                      {param?.range || "N/A"}
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
      <div className="mt-4 text-sm">
        {testInstrument && (
          <p>
            <strong>Instrument used:</strong> {testInstrument}
          </p>
        )}
        {testComment && (
          <p>
            <strong>Comment:</strong> {testComment}
          </p>
        )}
        {showReportAnalysis && testReportAnalysis && (
          <>
            <p className="font-semibold mt-2">Report Analysis:</p>
            <div
              className="sun-editor-editable rounded"
              dangerouslySetInnerHTML={{
                __html: testReportAnalysis || "",
              }}
            />
          </>
        )}
        {showAssessment && testAssessment && (
          <>
            <p className="font-semibold mt-2">Assessment:</p>
            <div
              className="sun-editor-editable rounded"
              dangerouslySetInnerHTML={{
                __html: testAssessment || "",
              }}
            />
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-[90vh] flex flex-col">
      {data?.pathology_test?.map((test, index) => (
        <div
          key={test?._id || index}
          style={{ pageBreakBefore: index > 0 ? "always" : "auto" }}
          className="flex flex-col min-h-[90vh]"
        >
          {index === 0 && <PrintHeader />}
          {renderPatientDetails()}
          <div className="text-center">
            {test?.sampleType && (
              <p className="text-left text-sm">Specimen: {test?.sampleType}</p>
            )}
            <h2 className="text-lg font-bold uppercase">
              {test?.department || "N/A"}
            </h2>
            {/* Render reporting_details */}
            {test?.reporting_details?.length > 0 && (
              <div className="text-left text-sm mt-2">
                {test.reporting_details.map((detail, detailIndex) => (
                  <p key={detailIndex}>
                    {detail.label}:{" "}
                    {detail.type === "date"
                      ? formatDate(detail.input) || "N/A"
                      : detail.input || "N/A"}
                  </p>
                ))}
              </div>
            )}
          </div>
          <table className="w-full border">
            <tbody>
              <tr>
                <td className="px-2 border" colSpan="3">
                  <p className="font-bold text-lg">{test?.name || "N/A"}:</p>
                </td>
              </tr>
            </tbody>
          </table>
          {renderTable(test)}
          {renderInstrumentAndComment(test)}
        </div>
      ))}
    </div>
  );
};

const RadiologyPrint = ({ data }) => (
  <div className="mt-16">
    <PrintHeader />
    <div className="text-sm border border-gray-400 w-full">
      {/* Row 1 */}
      <div className="grid grid-cols-4 border-b border-gray-400">
        <div className="col-span-2 border-r border-gray-400 p-1">
          <span className="font-semibold">Name:</span>{" "}
          {data?.patient?.fullname || "Not Available"}
        </div>
        <div className="col-span-2 p-1">
          <span className="font-semibold">UHID:</span>{" "}
          {data?.mrd_id || "N/A"}
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-4 border-b border-gray-400">
        <div className="col-span-2 border-r border-gray-400 p-1">
          <span className="font-semibold">Gender/Age:</span>{" "}
          {data?.patient?.gender || "N/A"} / {data?.patient?.age || "N/A"}
        </div>
        <div className="col-span-2 p-1">
          <span className="font-semibold">Bill No.:</span>{" "}
          {data?.bill_no || "N/A"}
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-4">
        <div className="col-span-2 p-1 font-semibold">
          <span className="font-semibold">Referred By:</span>{" "}
          {data?.consultant?.drname || "N/A"}{" "}
          {data?.consultant?.drinfo && <>({data?.consultant?.drinfo})</>}
        </div>
        <div className="col-span-2 border-r border-gray-400 p-1">
          <span className="font-semibold">Date/Time:</span>{" "}
          {formatDate(data?.reporting_date) || "N/A"}{" "}
          {data?.reporting_time || "N/A"}
        </div>
      </div>
    </div>
    {data?.radiology_reading && (
      <div className="mt-4">
        <p className="font-semibold">Radiology Reading:</p>
        <div
          className="sun-editor-editable rounded"
          dangerouslySetInnerHTML={{
            __html: data?.radiology_reading || "",
          }}
        />
      </div>
    )}
  </div>
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

        <div className="mx-auto bg-white p-4">
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
