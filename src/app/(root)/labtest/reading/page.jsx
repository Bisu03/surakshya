"use client";

import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import Tab from "@/components/Tab";
import Spinner from "@/components/ui/Spinner";
import { formatDate } from "@/lib/formateDate";
import { generateUnique } from "@/lib/uniqueNumber";
import { fetchData, updateData } from "@/services/apiService";
import { withAuth } from "@/services/withAuth";
import { ErrorHandeling } from "@/utils/errorHandling";
import { SuccessHandling } from "@/utils/successHandling";
import { TabLinks } from "@/utils/tablinks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { FaPlus, FaSave, FaTrash } from "react-icons/fa";
import SunEditor from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css";
import Select from "react-select";
import { getDate } from "@/lib/currentDate";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const PathologyReading = () => {
  const [modifiedData, setModifiedData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [testSearchTerm, setTestSearchTerm] = useState("");
  const [ToggleTest, setToggleTest] = useState(true);
  const [content, setContent] = useState("");
  const [selectedTests, setSelectedTests] = useState([]);
  const [results, setResults] = useState({});
  const [patientInfo, setPatientInfo] = useState(null);
  const editor = useRef();
  const reportAnalysisEditor = useRef();
  const inputRefs = useRef({}); // Use object for key-based ref management

  const queryClient = useQueryClient();
  const router = useRouter();
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["labtestrecord", searchTerm],
    queryFn: () => fetchData(`/labtest/${searchTerm?.trim()}`),
    enabled: !!searchTerm,
  });
  const { data: testOptions, isLoading: isLoadingTests } = useQuery({
    queryKey: ["pathologyTests", testSearchTerm],
    queryFn: () =>
      fetchData(`/pathologytest?search=${testSearchTerm}`).then(
        (res) =>
          res?.data?.map((test) => ({
            value: test?._id,
            label: test?.name,
            ...test,
          })) || []
      ),
    enabled: ToggleTest && !!testSearchTerm,
  });

  const mutation = useMutation({
    mutationFn: (newItem) => updateData(`/labtest`, searchTerm, newItem),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["labtestrecord"] });
      SuccessHandling(data?.message || "Reading saved successfully");
      router.push("/labtest/print/" + searchTerm);
    },
    onError: (error) => {
      ErrorHandeling(error);
      console.error("Error updating data:", error);
    },
  });

  const handleImageUploadBefore = (files, info, uploadHandler) => {
    const file = files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result;
        uploadHandler({
          result: [{ url: base64, name: file?.name || "image" }],
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBillSearch = async () => {
    if (searchTerm) {
      await refetch();
    }
  };

  const handleAddTest = (serviceIndex) => {
    const newTest = {
      _id: generateUnique(),
      pathology_category: "Pathology",
      pathology_test: [],
    };
    setModifiedData((prev) => ({
      ...prev,
      services: [...(prev?.services || []), newTest],
    }));
  };

  useEffect(() => {
    if (data?.data) {
      setPatientInfo({
        fullname: data?.data?.patient?.fullname || "Patient Details",
        mrd_id: data?.data?.mrd_id || "",
        bill_no: data?.data?.bill_no || "",
        age: data?.data?.patient?.age || "",
        pathology_test_cart: data?.data?.pathology_test_cart || {},
        radiology_test_cart: data?.data?.radiology_test_cart || {},
        reporting_date: data?.data?.reporting_date || "",
        reporting_time: data?.data?.reporting_time || "",
        referr_by: data?.data?.patient?.referr_by || "",
      });

      if (ToggleTest && data?.data?.pathology_test) {
        const existingTests =
          data?.data?.pathology_test?.map((test) => ({
            value: test?._id,
            label: test?.name,
            name: test?.name,
            department: test?.department,
            sampleType: test?.sampleType,
            instrument: test?.instrument || "",
            comment: test?.comment || "",
            assessment: test?.assessment || "",
            report_analysis: test?.report_analysis || "",
            show_assessment: test?.show_assessment ?? false,
            show_report_analysis: test?.show_report_analysis ?? false,
            reporting_details: test?.reporting_details || [],
            testItems:
              test?.testItems?.map((item) => ({
                ...item,
                data: {
                  ...item.data,
                  result:
                    item.data?.result ||
                    (item.data?.field === "boolean" ? false : ""),
                  isBold: item.data?.isBold || false,
                  parameters:
                    item.data?.parameters?.map((p) => ({
                      ...p,
                      result:
                        p?.result || (p?.field === "boolean" ? false : ""),
                      isBold: p?.isBold || false,
                    })) || [],
                },
              })) || [],
          })) || [];
        setSelectedTests(existingTests);
        const initialResults = {};
        existingTests.forEach((test) => {
          initialResults[test?.value] = {
            name: test?.name,
            department: test?.department,
            sampleType: test?.sampleType,
            instrument: test?.instrument,
            comment: test?.comment,
            assessment: test?.assessment,
            report_analysis: test?.report_analysis,
            show_assessment: test?.show_assessment,
            show_report_analysis: test?.show_report_analysis,
            reporting_details: test?.reporting_details.map((detail) => ({
              ...detail,
              input:
                detail?.input || (detail?.type === "date" ? getDate() : ""),
            })),
            testItems: test?.testItems || [],
          };
        });
        setResults(initialResults);
      }
    }
  }, [data, ToggleTest]);

  const handleAddSelectedTest = (testId) => {
    const testToAdd = testOptions?.find((t) => t?.value === testId);
    if (testToAdd && !selectedTests?.some((t) => t?.value === testId)) {
      setSelectedTests((prev) => [...prev, testToAdd]);
      setResults((prev) => ({
        ...prev,
        [testId]: {
          name: testToAdd?.name,
          department: testToAdd?.department,
          sampleType: testToAdd?.sampleType,
          instrument: testToAdd?.instrument || "",
          comment: testToAdd?.comment || "",
          assessment: testToAdd?.assessment || "",
          report_analysis: testToAdd?.report_analysis || "",
          show_assessment: testToAdd?.show_assessment ?? false,
          show_report_analysis: testToAdd?.show_report_analysis ?? false,
          reporting_details:
            testToAdd?.reporting_details?.map((detail) => ({
              ...detail,
              input: detail?.type === "date" ? getDate() : "",
            })) || [],
          testItems:
            testToAdd?.testItems?.map((item) => ({
              ...item,
              data: {
                ...item?.data,
                result:
                  item?.data?.result ||
                  (item?.data?.field === "boolean" ? false : ""),
                isBold: item?.data?.isBold || false,
                parameters:
                  item?.data?.parameters?.map((p) => ({
                    ...p,
                    result: p?.result || (p?.field === "boolean" ? false : ""),
                    isBold: p?.isBold || false,
                  })) || [],
              },
            })) || [],
        },
      }));
    }
  };

  const handleResultChange = (testId, itemIndex, paramIndex, field, value) => {
    setResults((prev) => {
      const updatedResults = { ...prev };
      const testResults = { ...updatedResults[testId] };

      if (
        [
          "name",
          "department",
          "sampleType",
          "instrument",
          "comment",
          "assessment",
          "report_analysis",
          "show_assessment",
          "show_report_analysis",
        ].includes(field)
      ) {
        updatedResults[testId] = { ...testResults, [field]: value };
      } else if (field.startsWith("reporting_detail_input_")) {
        const detailIndex = parseInt(field.split("_")[3]);
        const updatedDetails = [...testResults.reporting_details];
        updatedDetails[detailIndex] = {
          ...updatedDetails[detailIndex],
          input: value,
        };
        updatedResults[testId] = {
          ...testResults,
          reporting_details: updatedDetails,
        };
      } else {
        const testItems = [...(testResults?.testItems || [])];
        if (paramIndex === undefined) {
          testItems[itemIndex] = {
            ...testItems[itemIndex],
            data: {
              ...testItems[itemIndex]?.data,
              [field]: value,
            },
          };
        } else {
          const subTestData = { ...testItems[itemIndex]?.data };
          subTestData.parameters = [...(subTestData?.parameters || [])];
          subTestData.parameters[paramIndex] = {
            ...subTestData?.parameters[paramIndex],
            [field]: value,
          };
          testItems[itemIndex] = {
            ...testItems[itemIndex],
            data: subTestData,
          };
        }
        testResults.testItems = testItems;
        updatedResults[testId] = testResults;
      }
      return updatedResults;
    });
  };

  const handleRemoveTest = (testId) => {
    setSelectedTests((prev) => prev?.filter((t) => t?.value !== testId) || []);
    setResults((prev) => {
      const newResults = { ...prev };
      delete newResults[testId];
      return newResults;
    });
    // Clean up refs for this test
    Object.keys(inputRefs.current).forEach((key) => {
      if (key.startsWith(`${testId}-`)) {
        delete inputRefs.current[key];
      }
    });
  };

  const handleRemoveSubTest = (testId, itemIndex) => {
    setResults((prev) => {
      const updatedResults = { ...prev };
      const testResults = { ...updatedResults[testId] };
      const updatedTestItems = testResults.testItems.filter(
        (_, index) => index !== itemIndex
      );
      updatedResults[testId] = { ...testResults, testItems: updatedTestItems };
      return updatedResults;
    });
    // Clean up refs for this subtest
    Object.keys(inputRefs.current).forEach((key) => {
      if (key.startsWith(`${testId}-${itemIndex}-`) || key === `${testId}-${itemIndex}`) {
        delete inputRefs.current[key];
      }
    });
  };

  const handleRemoveParameter = (testId, itemIndex, paramIndex) => {
    setResults((prev) => {
      const updatedResults = { ...prev };
      const testResults = { ...updatedResults[testId] };
      const testItems = [...testResults.testItems];
      const subTestData = { ...testItems[itemIndex].data };
      subTestData.parameters = subTestData.parameters.filter(
        (_, index) => index !== paramIndex
      );
      testItems[itemIndex] = { ...testItems[itemIndex], data: subTestData };
      testResults.testItems = testItems;
      updatedResults[testId] = testResults;
      return updatedResults;
    });
    // Clean up ref for this parameter
    delete inputRefs.current[`${testId}-${itemIndex}-${paramIndex}`];
  };

  const handleSubmit = () => {
    const updatedData = {
      pathology_test:
        selectedTests?.map((test) => ({
          _id: test?.value,
          name: results[test?.value]?.name || test?.name,
          department: results[test?.value]?.department || test?.department,
          sampleType: results[test?.value]?.sampleType || test?.sampleType,
          instrument:
            results[test?.value]?.instrument || test?.instrument || "",
          comment: results[test?.value]?.comment || test?.comment || "",
          assessment:
            results[test?.value]?.assessment || test?.assessment || "",
          report_analysis:
            results[test?.value]?.report_analysis ||
            test?.report_analysis ||
            "",
          show_assessment: results[test?.value]?.show_assessment ?? false,
          show_report_analysis:
            results[test?.value]?.show_report_analysis ?? false,
          reporting_details: results[test?.value]?.reporting_details || [],
          testItems:
            results[test?.value]?.testItems?.map((item) => ({
              ...item,
              data: {
                ...item?.data,
                result:
                  item?.data?.result ||
                  (item?.data?.field === "boolean" ? false : ""),
                isBold: item?.data?.isBold || false,
                parameters:
                  item?.data?.parameters?.map((p) => ({
                    ...p,
                    result: p?.result || (p?.field === "boolean" ? false : ""),
                    isBold: p?.isBold || false,
                  })) || [],
              },
            })) || [],
        })) || [],
      radiology_reading: content,
    };

    mutation.mutate(updatedData);
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.altKey && e.key === "1") {
        e.preventDefault();
        setToggleTest(true);
      } else if (e.altKey && e.key === "2") {
        e.preventDefault();
        setToggleTest(false);
      } else if (e.key === "F5") {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [ToggleTest]);

  const renderInputField = (testId, itemIndex, paramIndex, item, inputKey) => {
    const field =
      paramIndex === undefined
        ? item?.data?.field
        : item?.data?.parameters?.[paramIndex]?.field;
    const result =
      paramIndex === undefined
        ? results?.[testId]?.testItems?.[itemIndex]?.data?.result
        : results?.[testId]?.testItems?.[itemIndex]?.data?.parameters?.[
            paramIndex
          ]?.result;
    const isBold =
      paramIndex === undefined
        ? results?.[testId]?.testItems?.[itemIndex]?.data?.isBold
        : results?.[testId]?.testItems?.[itemIndex]?.data?.parameters?.[
            paramIndex
          ]?.isBold;

    // Handle Enter key to shift focus to the next result input
    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const inputKeys = Object.keys(inputRefs.current).sort();
        const currentIndex = inputKeys.indexOf(inputKey);
        const nextKey = inputKeys[currentIndex + 1];
        if (nextKey && inputRefs.current[nextKey]?.current) {
          inputRefs.current[nextKey].current.focus();
        }
      }
      // Explicitly allow Delete key to work normally
      if (e.key === "Delete") {
        return;
      }
    };

    if (field === "boolean") {
      return (
        <div className="flex items-center gap-2">
          <input
            ref={(el) => (inputRefs.current[inputKey] = { current: el })}
            type="checkbox"
            checked={result || false}
            onChange={(e) =>
              handleResultChange(
                testId,
                itemIndex,
                paramIndex,
                "result",
                e.target.checked
              )
            }
            onKeyDown={handleKeyDown}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={isBold || false}
              onChange={(e) =>
                handleResultChange(
                  testId,
                  itemIndex,
                  paramIndex,
                  "isBold",
                  e.target.checked
                )
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            Bold
          </label>
        </div>
      );
    } else if (field === "numeric") {
      return (
        <div className="flex items-center gap-2">
          <input
            ref={(el) => (inputRefs.current[inputKey] = { current: el })}
            type="number"
            value={result || ""}
            onChange={(e) =>
              handleResultChange(
                testId,
                itemIndex,
                paramIndex,
                "result",
                e.target.value
              )
            }
            onKeyDown={handleKeyDown}
            className={`w-full py-1 px-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              isBold ? "font-bold" : ""
            }`}
            placeholder="Enter result"
          />
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={isBold || false}
              onChange={(e) =>
                handleResultChange(
                  testId,
                  itemIndex,
                  paramIndex,
                  "isBold",
                  e.target.checked
                )
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            Bold
          </label>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2">
          <input
            ref={(el) => (inputRefs.current[inputKey] = { current: el })}
            type="text"
            value={result || ""}
            onChange={(e) =>
              handleResultChange(
                testId,
                itemIndex,
                paramIndex,
                "result",
                e.target.value
              )
            }
            onKeyDown={handleKeyDown}
            className={`w-full py-1 px-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              isBold ? "font-bold" : ""
            }`}
            placeholder="Enter result"
          />
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={isBold || false}
              onChange={(e) =>
                handleResultChange(
                  testId,
                  itemIndex,
                  paramIndex,
                  "isBold",
                  e.target.checked
                )
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            Bold
          </label>
        </div>
      );
    }
  };

  const getInputIndices = () => {
    const indices = {};

    selectedTests?.forEach((test) => {
      const testId = test?.value;
      results?.[testId]?.testItems?.forEach((item, itemIndex) => {
        if (item?.type === "parameter") {
          indices[`${testId}-${itemIndex}`] = `${testId}-${itemIndex}`;
        } else {
          item?.data?.parameters?.forEach((_, paramIndex) => {
            indices[
              `${testId}-${itemIndex}-${paramIndex}`
            ] = `${testId}-${itemIndex}-${paramIndex}`;
          });
        }
      });
    });

    return indices;
  };

  const inputIndices = getInputIndices();

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex flex-wrap w-full justify-between">
        <Tab tabs={TabLinks} category="Labtest" />
        <MiddleSection>
          <div className="w-full p-2 md:p-4">
            {/* Search Section */}
            <Heading heading="Pathology Reading">
              <div className="flex flex-col md:flex-row gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Enter Bill No."
                  className="p-2 border rounded w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  onClick={handleBillSearch}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Search
                </button>
              </div>
            </Heading>

            {/* Patient Info Section */}
            {isLoading ? (
              <Loading />
            ) : patientInfo ? (
              <div className="w-full bg-white shadow-sm rounded-lg p-4 mt-4">
                <h1 className="text-xl font-bold text-gray-800 mb-4">
                  {patientInfo?.fullname || "N/A"}
                </h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { label: "UHID", value: patientInfo?.mrd_id },
                    { label: "Bill No.", value: patientInfo?.bill_no },
                    { label: "Age", value: patientInfo?.age },
                    {
                      label: "Reporting Date",
                      value: formatDate(patientInfo?.reporting_date),
                    },
                    {
                      label: "Reporting Time",
                      value: patientInfo?.reporting_time,
                    },
                    { label: "Referred By", value: patientInfo?.referr_by },
                  ].map(
                    (item, index) =>
                      item?.value && (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-500 mb-1">
                            {item?.label}
                          </p>
                          <p className="font-medium text-gray-700 truncate">
                            {item?.value}
                          </p>
                        </div>
                      )
                  )}
                </div>

                <div className="flex text-xl">
                  <h1 className="font-semibold">Pathology Test:- </h1>
                  {patientInfo?.pathology_test_cart?.services?.map((test) => (
                    <>{test?.pathology_category} , </>
                  ))}
                </div>
                <div className="flex text-xl">
                  <h1 className="font-semibold">Radiology Test:- </h1>
                  {patientInfo?.radiology_test_cart?.services?.map((test) => (
                    <>{test?.test_name} , </>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Toggle Buttons */}
            <div className="flex flex-col md:flex-row gap-2 mt-6">
              <button
                className={`flex-1 p-2 rounded-lg transition-colors ${
                  ToggleTest
                    ? "bg-red-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
                onClick={() => setToggleTest(true)}
              >
                Pathology (Alt+1)
              </button>
              <button
                className={`flex-1 p-2 rounded-lg transition-colors ${
                  !ToggleTest
                    ? "bg-red-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
                onClick={() => setToggleTest(false)}
              >
                Radiology (Alt+2)
              </button>
            </div>

            {/* Pathology Section */}
            {ToggleTest ? (
              <div className="mt-6 space-y-4">
                {/* Multiselect for Pathology Tests */}
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Pathology Tests
                  </label>
                  <Select
                    isMulti
                    options={testOptions || []}
                    value={selectedTests}
                    onChange={(selected) => {
                      selected?.forEach((test) =>
                        handleAddSelectedTest(test?.value)
                      );
                      setSelectedTests(selected || []);
                    }}
                    isLoading={isLoadingTests}
                    className="basic-multi-select"
                    classNamePrefix="select"
                    onInputChange={(inputValue) =>
                      setTestSearchTerm(inputValue)
                    }
                  />
                </div>

                {/* Pathology Results */}
                {selectedTests?.map((test, index) => (
                  <div
                    key={test?.value}
                    className="bg-white rounded-lg shadow-sm overflow-hidden"
                  >
                    <div className="flex justify-between items-center p-4 border-b">
                      <h1 className="text-lg font-bold text-gray-800">
                        {test?.name || "N/A"}
                      </h1>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRemoveTest(test?.value)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2"
                        >
                          <FaTrash /> Remove
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      {/* Editable Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {[
                          { key: "name", label: "Name" },
                          { key: "department", label: "Department" },
                          { key: "sampleType", label: "Sample Type" },
                          { key: "instrument", label: "Instrument" },
                          { key: "comment", label: "Comment" },
                        ].map(({ key, label }) => (
                          <div key={key} className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              {label}
                            </label>
                            <input
                              type="text"
                              value={
                                results?.[test?.value]?.[key] ||
                                test?.[key] ||
                                ""
                              }
                              onChange={(e) =>
                                handleResultChange(
                                  test?.value,
                                  undefined,
                                  undefined,
                                  key,
                                  e.target.value
                                )
                              }
                              className="w-full py-1 px-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Report Details */}
                      {results?.[test?.value]?.reporting_details?.length >
                        0 && (
                        <div className="mb-4">
                          <h3 className="text-md font-semibold mb-2">
                            Report Details
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {results?.[test?.value]?.reporting_details.map(
                              (detail, detailIndex) => (
                                <div key={detailIndex} className="space-y-2">
                                  <label className="block text-sm font-medium text-gray-700">
                                    {detail.label}
                                  </label>
                                  <input
                                    type={detail.type}
                                    value={detail.input || ""}
                                    onChange={(e) =>
                                      handleResultChange(
                                        test?.value,
                                        undefined,
                                        undefined,
                                        `reporting_detail_input_${detailIndex}`,
                                        e.target.value
                                      )
                                    }
                                    className="w-full py-1 px-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder={`Enter ${detail.label}`}
                                  />
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {/* Test Items */}
                      {results?.[test?.value]?.testItems?.length > 0 && (
                        <div className="mb-4">
                          <h3 className="text-md font-semibold mb-2">
                            Test Items
                          </h3>
                          {results?.[test?.value]?.testItems
                            .sort(
                              (a, b) => (a?.priority || 0) - (b?.priority || 0)
                            )
                            .map((item, itemIndex) => (
                              <div
                                key={itemIndex}
                                className="border-2 p-2 mb-2 rounded-lg relative"
                              >
                                <button
                                  onClick={() =>
                                    handleRemoveSubTest(test?.value, itemIndex)
                                  }
                                  className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-1 text-sm"
                                  title="Remove Subtest"
                                >
                                  <FaTrash />
                                </button>
                                {item?.type === "parameter" ? (
                                  <div className="grid grid-cols-3 gap-4 items-center">
                                    <label className="text-sm">
                                      {item?.data?.name || "N/A"}{" "}
                                      {item?.data?.units && (
                                        <>({item?.data?.units})</>
                                      )}
                                    </label>
                                    <div className="flex items-center gap-2">
                                      {renderInputField(
                                        test?.value,
                                        itemIndex,
                                        undefined,
                                        item,
                                        `${test?.value}-${itemIndex}`
                                      )}
                                    </div>
                                    <div
                                      className="text-sm text-gray-500 font-medium"
                                      style={{ whiteSpace: "pre-wrap" }}
                                    >
                                      Normal Range: {item?.data?.range || "N/A"}
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <h4 className="text-sm font-medium mb-2">
                                      {item?.data?.name || "N/A"}
                                    </h4>
                                    {item?.data?.parameters?.map(
                                      (param, paramIndex) => (
                                        <div
                                          key={paramIndex}
                                          className="grid grid-cols-3 gap-4 mb-2 items-center relative"
                                        >
                                          <button
                                            onClick={() =>
                                              handleRemoveParameter(
                                                test?.value,
                                                itemIndex,
                                                paramIndex
                                              )
                                            }
                                            className="absolute top-0 right-0 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-1 text-sm"
                                            title="Remove Parameter"
                                          >
                                            <FaTrash />
                                          </button>
                                          <label className="text-sm">
                                            {param?.name || "N/A"}{" "}
                                            {param?.units && (
                                              <>({param?.units})</>
                                            )}
                                          </label>
                                          <div className="flex items-center gap-2">
                                            {renderInputField(
                                              test?.value,
                                              itemIndex,
                                              paramIndex,
                                              item,
                                              `${test?.value}-${itemIndex}-${paramIndex}`
                                            )}
                                          </div>
                                          <div
                                            className="text-sm text-gray-500 font-medium"
                                            style={{ whiteSpace: "pre-wrap" }}
                                          >
                                            Normal Range:{" "}
                                            {param?.range || "N/A"}
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      )}

                      {/* Report Analysis */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={
                              results?.[test?.value]?.show_report_analysis ??
                              false
                            }
                            onChange={(e) =>
                              handleResultChange(
                                test?.value,
                                undefined,
                                undefined,
                                "show_report_analysis",
                                e.target.checked
                              )
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <h3 className="text-md font-semibold">
                            Report Analysis/Notes
                          </h3>
                        </div>
                        {results?.[test?.value]?.show_report_analysis && (
                          <div>
                            <SunEditor
                              ref={reportAnalysisEditor}
                              setOptions={{
                                height: "200px",
                                buttonList: [
                                  ["bold", "italic", "underline", "strike"],
                                  ["fontSize", "formatBlock"],
                                  ["fontColor", "hiliteColor"],
                                  ["indent", "outdent"],
                                  ["align", "list", "lineHeight"],
                                  ["table", "link", "image"],
                                  ["undo", "redo", "removeFormat"],
                                ],
                              }}
                              onImageUploadBefore={handleImageUploadBefore}
                              onChange={(content) =>
                                handleResultChange(
                                  test?.value,
                                  undefined,
                                  undefined,
                                  "report_analysis",
                                  content
                                )
                              }
                              setContents={
                                results?.[test?.value]?.report_analysis || ""
                              }
                              className="rounded-t-lg"
                            />
                            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                              <h4 className="font-semibold mb-2">Preview</h4>
                              <div
                                className="sun-editor-editable max-w-none prose"
                                dangerouslySetInnerHTML={{
                                  __html:
                                    results?.[test?.value]?.report_analysis ||
                                    "<p>Enter report analysis above to see the preview here.</p>",
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Assessment */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={
                              results?.[test?.value]?.show_assessment ?? false
                            }
                            onChange={(e) =>
                              handleResultChange(
                                test?.value,
                                undefined,
                                undefined,
                                "show_assessment",
                                e.target.checked
                              )
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <h3 className="text-md font-semibold">Assessment</h3>
                        </div>
                        {results?.[test?.value]?.show_assessment && (
                          <div>
                            <SunEditor
                              setOptions={{
                                height: "200px",
                                buttonList: [
                                  ["bold", "italic", "underline", "strike"],
                                  ["fontSize", "formatBlock"],
                                  ["fontColor", "hiliteColor"],
                                  ["indent", "outdent"],
                                  ["align", "list", "lineHeight"],
                                  ["table", "link", "image"],
                                  ["undo", "redo", "removeFormat"],
                                ],
                              }}
                              onImageUploadBefore={handleImageUploadBefore}
                              onChange={(content) =>
                                handleResultChange(
                                  test?.value,
                                  undefined,
                                  undefined,
                                  "assessment",
                                  content
                                )
                              }
                              setContents={
                                results?.[test?.value]?.assessment || ""
                              }
                              className="rounded-t-lg"
                            />
                            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                              <h4 className="font-semibold mb-2">Preview</h4>
                              <div
                                className="sun-editor-editable max-w-none prose"
                                dangerouslySetInnerHTML={{
                                  __html:
                                    results?.[test?.value]?.assessment ||
                                    "<p>Enter assessment above to see the preview here.</p>",
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Radiology Section */
              <div className="mt-6">
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <SunEditor
                    ref={editor}
                    defaultValue={
                      content || data?.data?.radiology_reading || ""
                    }
                    setOptions={{
                      height: "400px",
                      buttonList: [
                        ["bold", "italic", "underline", "strike"],
                        ["fontSize", "formatBlock"],
                        ["fontColor", "hiliteColor"],
                        ["indent", "outdent"],
                        ["align", "list", "lineHeight"],
                        ["table", "link", "image"],
                        ["undo", "redo", "removeFormat"],
                      ],
                    }}
                    onImageUploadBefore={handleImageUploadBefore}
                    onChange={setContent}
                    className="rounded-t-lg"
                  />
                  <div className="p-4 border-t">
                    <h3 className="font-semibold mb-2">Preview</h3>
                    <div
                      className="sun-editor-editable max-w-none"
                      dangerouslySetInnerHTML={{
                        __html:
                          content || "<p>Enter radiology reading above.</p>",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <button
              className="w-full mt-6 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
              onClick={handleSubmit}
              disabled={mutation.isPending}
            >
              <FaSave className="text-lg" />
              <span>Save Reading</span>
              <kbd className="hidden md:inline-block px-2 py-1 bg-white/20 rounded">
                F5
              </kbd>
              {mutation.isPending && <Spinner className="ml-2" />}
            </button>
          </div>
        </MiddleSection>
      </div>
    </Suspense>
  );
};

export default withAuth(PathologyReading);