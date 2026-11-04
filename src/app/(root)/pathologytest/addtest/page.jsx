"use client"

import Heading from "@/components/Heading"
import Loading from "@/components/Loading"
import Spinner from "@/components/ui/Spinner"
import { createData } from "@/services/apiService"
import { withAuth } from "@/services/withAuth"
import { ErrorHandeling } from "@/utils/errorHandling"
import { SuccessHandling } from "@/utils/successHandling"
import { lazy, Suspense, useState, useRef } from "react"
import {
  FaFlask,
  FaVial,
  FaHospital,
  FaFileAlt,
  FaMicroscope,
  FaPlus,
  FaTrash,
  FaRegListAlt,
  FaLayerGroup,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa"
import SunEditor from "suneditor-react"
import "suneditor/dist/css/suneditor.min.css"

const MiddleSection = lazy(() => import("@/components/Middlesection"))

const AddPathologyTest = () => {
  const [test, setTest] = useState({
    name: "",
    department: "",
    sampleType: "",
    suffix: "",
    comment: "",
    instrument: "",
    type: "single field",
    testItems: [],
    assessment: "",
    reporting_details: [], // Stores { label, type } only
  })
  const [newParameter, setNewParameter] = useState({
    name: "",
    field: "text",
    units: "",
    range: "",
    testMethod: "",
    priority: 0,
  })
  const [newSubTest, setNewSubTest] = useState({
    name: "",
    parameters: [],
    priority: 0,
  })
  const [newSubParameters, setNewSubParameters] = useState([])
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState("")
  const [newReportingDetail, setNewReportingDetail] = useState({
    label: "",
    type: "text",
  })
  const editor = useRef(null)

  const handleImageUploadBefore = (files, info, uploadHandler) => {
    uploadHandler()
  }

  const handleAddParameter = () => {
    if (!newParameter?.name?.trim()) return
    setTest((prev) => ({
      ...prev,
      testItems: [
        ...prev?.testItems,
        {
          type: "parameter",
          data: { ...newParameter, name: newParameter?.name?.trim() },
          priority: newParameter?.priority || 0,
        },
      ],
    }))
    setNewParameter({
      name: "",
      field: "text",
      units: "",
      range: "",
      testMethod: "",
      priority: 0,
    })
  }

  const handleRemoveItem = (index) => {
    setTest((prev) => ({
      ...prev,
      testItems: prev?.testItems?.filter((_, i) => i !== index) || [],
    }))
    if (test?.testItems?.[index]?.type === "subTest") {
      setNewSubParameters((prev) => prev?.filter((_, i) => i !== index) || [])
    }
  }

  const handleAddSubParameter = (subTestIndex) => {
    if (!newSubParameters?.[subTestIndex]?.name?.trim()) return
    const updatedTestItems = [...test?.testItems]
    const subTest = updatedTestItems?.[subTestIndex]?.data
    subTest?.parameters?.push({
      ...newSubParameters?.[subTestIndex],
      name: newSubParameters?.[subTestIndex]?.name?.trim(),
    })
    setTest((prev) => ({ ...prev, testItems: updatedTestItems }))
    setNewSubParameters((prev) => {
      const updated = [...prev]
      updated[subTestIndex] = {
        name: "",
        field: "text",
        units: "",
        range: "",
        testMethod: "",
        priority: 0,
      }
      return updated
    })
  }

  const handleRemoveSubParameter = (subTestIndex, paramIndex) => {
    const updatedTestItems = [...test?.testItems]
    updatedTestItems[subTestIndex].data.parameters = updatedTestItems?.[subTestIndex]?.data?.parameters?.filter(
      (_, i) => i !== paramIndex
    ) || []
    setTest((prev) => ({ ...prev, testItems: updatedTestItems }))
  }

  const handleAddSubTest = () => {
    if (!newSubTest?.name?.trim()) return
    const subTestIndex = test?.testItems?.filter((item) => item?.type === "subTest")?.length || 0
    setTest((prev) => ({
      ...prev,
      testItems: [
        ...prev?.testItems,
        {
          type: "subTest",
          data: { ...newSubTest, name: newSubTest?.name?.trim(), parameters: [] },
          priority: newSubTest?.priority || 0,
        },
      ],
    }))
    setNewSubParameters((prev) => [
      ...prev,
      {
        name: "",
        field: "text",
        units: "",
        range: "",
        testMethod: "",
        priority: 0,
      },
    ])
    setNewSubTest({ name: "", parameters: [], priority: 0 })
  }

  const handleMoveUp = (index) => {
    if (index === 0) return
    setTest((prev) => {
      const updatedTestItems = [...prev?.testItems]
      const tempPriority = updatedTestItems?.[index]?.priority
      updatedTestItems[index].priority = updatedTestItems?.[index - 1]?.priority
      updatedTestItems[index - 1].priority = tempPriority
      const [item] = updatedTestItems?.splice(index, 1)
      updatedTestItems?.splice(index - 1, 0, item)
      return { ...prev, testItems: updatedTestItems }
    })
  }

  const handleMoveDown = (index) => {
    if (index === test?.testItems?.length - 1) return
    setTest((prev) => {
      const updatedTestItems = [...prev?.testItems]
      const tempPriority = updatedTestItems?.[index]?.priority
      updatedTestItems[index].priority = updatedTestItems?.[index + 1]?.priority
      updatedTestItems[index + 1].priority = tempPriority
      const [item] = updatedTestItems?.splice(index, 1)
      updatedTestItems?.splice(index + 1, 0, item)
      return { ...prev, testItems: updatedTestItems }
    })
  }

  const handleAddReportingDetail = () => {
    if (!newReportingDetail?.label?.trim()) return
    setTest((prev) => ({
      ...prev,
      reporting_details: [
        ...prev.reporting_details,
        {
          label: newReportingDetail.label.trim(),
          type: newReportingDetail.type,
        },
      ],
    }))
    setNewReportingDetail({ label: "", type: "text" })
  }

  const handleRemoveReportingDetail = (index) => {
    setTest((prev) => ({
      ...prev,
      reporting_details: prev.reporting_details.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const testData = { ...test, assessment: content }
      const response = await createData("/pathologytest", testData)
      SuccessHandling(response?.message)
      setTest({
        name: "",
        department: "",
        sampleType: "",
        suffix: "",
        type: "single field",
        comment: "",
        instrument: "",
        testItems: [],
        assessment: "",
        reporting_details: [],
      })
      setContent("")
      setNewSubParameters([])
      setNewReportingDetail({ label: "", type: "text" })
      setLoading(false)
    } catch (error) {
      setLoading(false)
      ErrorHandeling(error)
    }
  }

  const sortedTestItems = [...test?.testItems].sort((a, b) => (a?.priority || 0) - (b?.priority || 0))

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex flex-wrap w-full justify-between">
        <MiddleSection>
          <div className="w-full">
            <Heading heading="Add Pathology Test">
              <div className="flex flex-col md:flex-row gap-2"></div>
            </Heading>

            <div className="flex flex-wrap w-full justify-between p-2">
              <div className="w-full rounded-xl shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Test Details Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <FaFlask className="mr-2 text-teal-600" />
                        Test Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={test?.name || ""}
                        onChange={(e) => setTest({ ...test, name: e.target.value })}
                        className="w-full py-2 px-4 border border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <FaHospital className="mr-2 text-teal-600" />
                        Department
                      </label>
                      <input
                        type="text"
                        value={test?.department || ""}
                        onChange={(e) => setTest({ ...test, department: e.target.value })}
                        className="w-full py-2 px-4 border border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <FaVial className="mr-2 text-teal-600" />
                        Sample Type
                      </label>
                      <input
                        type="text"
                        value={test?.sampleType || ""}
                        onChange={(e) => setTest({ ...test, sampleType: e.target.value })}
                        className="w-full py-2 px-4 border border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <FaFileAlt className="mr-2 text-teal-600" />
                        Comment
                      </label>
                      <input
                        type="text"
                        value={test?.comment || ""}
                        onChange={(e) => setTest({ ...test, comment: e.target.value })}
                        className="w-full py-2 px-4 border border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <FaMicroscope className="mr-2 text-teal-600" />
                        Instrument Used
                      </label>
                      <input
                        type="text"
                        value={test?.instrument || ""}
                        onChange={(e) => setTest({ ...test, instrument: e.target.value })}
                        className="w-full py-2 px-4 border border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        Suffix
                      </label>
                      <input
                        type="text"
                        value={test?.suffix || ""}
                        onChange={(e) => setTest({ ...test, suffix: e.target.value })}
                        className="w-full py-2 px-4 border border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Reporting Details Section */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold mb-2 flex items-center text-teal-700">
                      <FaRegListAlt className="mr-2" /> Reporting Details
                    </h2>
                    {test.reporting_details.length > 0 && (
                      <div className="space-y-3">
                        {test.reporting_details.map((detail, index) => (
                          <div key={index} className="border border-teal-200 p-5 rounded-lg bg-teal-50 flex justify-between items-center">
                            <div>
                              <p className="font-medium text-teal-800">{detail.label}</p>
                              <p className="text-sm text-gray-600">Type: {detail.type}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveReportingDetail(index)}
                              className="text-red-500 hover:text-red-700 flex items-center"
                            >
                              <FaTrash className="mr-1" size={14} /> Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-md font-medium text-teal-700 mb-3 flex items-center">
                        <FaPlus className="mr-2" /> Add New Reporting Detail
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Label</label>
                          <input
                            type="text"
                            placeholder="Label"
                            value={newReportingDetail.label}
                            onChange={(e) =>
                              setNewReportingDetail({
                                ...newReportingDetail,
                                label: e.target.value,
                              })
                            }
                            className="w-full py-2 px-4 border border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Type</label>
                          <select
                            value={newReportingDetail.type}
                            onChange={(e) =>
                              setNewReportingDetail({
                                ...newReportingDetail,
                                type: e.target.value,
                              })
                            }
                            className="w-full py-2 px-4 border border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                          >
                            <option value="text">Text</option>
                            <option value="date">Date</option>
                          </select>
                        </div>
                        <div className="space-y-2 pt-6">
                          <button
                            type="button"
                            onClick={handleAddReportingDetail}
                            className="w-full py-2 px-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center"
                          >
                            <FaPlus className="mr-2" /> Add Reporting Detail
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Test Items Section */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold mb-2 flex items-center text-teal-700">
                      <FaRegListAlt className="mr-2" /> Test Items
                    </h2>

                    {sortedTestItems?.length > 0 && (
                      <div className="space-y-3">
                        {sortedTestItems.map((item, index) => (
                          <div key={index} className="border border-teal-200 p-5 rounded-lg bg-teal-50">
                            {item?.type === "parameter" ? (
                              <div className="flex flex-wrap md:flex-nowrap justify-between items-center gap-4">
                                <div className="flex-1 min-w-[200px]">
                                  <p className="font-medium text-teal-800">{item?.data?.name || "N/A"}</p>
                                  <p className="text-sm text-gray-600">
                                    {item?.data?.field || "N/A"} • {item?.data?.units || "N/A"} • Priority: {item?.priority || 0}
                                  </p>
                                </div>
                                <div className="flex-1 min-w-[200px]">
                                  <p className="text-sm text-gray-700" style={{ whiteSpace: "pre-wrap" }}>
                                    <span className="font-medium">Range:</span> {item?.data?.range || "N/A"}
                                  </p>
                                  <p className="text-sm text-gray-700">
                                    <span className="font-medium">Method:</span> {item?.data?.testMethod || "N/A"}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => handleMoveUp(index)}
                                    disabled={index === 0}
                                    className={`p-2 rounded-full ${
                                      index === 0 ? "text-gray-400 cursor-not-allowed" : "text-teal-600 hover:bg-teal-100"
                                    }`}
                                  >
                                    <FaArrowUp size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveDown(index)}
                                    disabled={index === sortedTestItems?.length - 1}
                                    className={`p-2 rounded-full ${
                                      index === sortedTestItems?.length - 1 ? "text-gray-400 cursor-not-allowed" : "text-teal-600 hover:bg-teal-100"
                                    }`}
                                  >
                                    <FaArrowDown size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(index)}
                                    className="text-red-500 hover:text-red-700 flex items-center"
                                  >
                                    <FaTrash className="mr-1" size={14} /> Remove
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex justify-between items-center mb-4 pb-2 border-b border-teal-200">
                                  <h3 className="text-lg font-medium text-teal-800 flex items-center">
                                    <FaVial className="mr-2" /> {item?.data?.name || "N/A"} (Priority: {item?.priority || 0})
                                  </h3>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      type="button"
                                      onClick={() => handleMoveUp(index)}
                                      disabled={index === 0}
                                      className={`p-2 rounded-full ${
                                        index === 0 ? "text-gray-400 cursor-not-allowed" : "text-teal-600 hover:bg-teal-100"
                                      }`}
                                    >
                                      <FaArrowUp size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveDown(index)}
                                      disabled={index === sortedTestItems?.length - 1}
                                      className={`p-2 rounded-full ${
                                        index === sortedTestItems?.length - 1 ? "text-gray-400 cursor-not-allowed" : "text-teal-600 hover:bg-teal-100"
                                      }`}
                                    >
                                      <FaArrowDown size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveItem(index)}
                                      className="text-red-500 hover:text-red-700 flex items-center"
                                    >
                                      <FaTrash className="mr-1" /> Remove
                                    </button>
                                  </div>
                                </div>

                                {item?.data?.parameters?.length > 0 && (
                                  <div className="space-y-3 mb-4">
                                    {item?.data?.parameters
                                      ?.sort((a, b) => (a?.priority || 0) - (b?.priority || 0))
                                      ?.map((param, paramIndex) => (
                                        <div
                                          key={paramIndex}
                                          className="bg-white p-3 rounded-lg border border-teal-100 flex flex-wrap md:flex-nowrap justify-between items-center gap-4"
                                        >
                                          <div className="flex-1 min-w-[200px]">
                                            <p className="font-medium text-teal-800">{param?.name || "N/A"}</p>
                                            <p className="text-sm text-gray-600">
                                              {param?.field || "N/A"} • {param?.units || "N/A"} • Priority: {param?.priority || 0}
                                            </p>
                                          </div>
                                          <div className="flex-1 min-w-[200px]">
                                            <p className="text-sm text-gray-700" style={{ whiteSpace: "pre-wrap" }}>
                                              <span className="font-medium">Range:</span> {param?.range || "N/A"}
                                            </p>
                                            <p className="text-sm text-gray-700">
                                              <span className="font-medium">Method:</span> {param?.testMethod || "N/A"}
                                            </p>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveSubParameter(index, paramIndex)}
                                            className="text-red-500 hover:text-red-700 flex items-center"
                                          >
                                            <FaTrash className="mr-1" size={14} /> Remove
                                          </button>
                                        </div>
                                      ))}
                                  </div>
                                )}

                                <div className="bg-white p-4 rounded-lg border border-teal-100">
                                  <h4 className="text-md font-medium text-teal-700 mb-3 flex items-center">
                                    <FaPlus className="mr-2" /> Add Parameter to {item?.data?.name || "Sub Test"}
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                      <label className="block text-sm font-medium text-gray-700">Sub Parameter Name</label>
                                      <input
                                        type="text"
                                        placeholder="Sub Parameter Name"
                                        value={newSubParameters?.[index]?.name || ""}
                                        onChange={(e) =>
                                          setNewSubParameters((prev) => {
                                            const updated = [...prev]
                                            updated[index] = {
                                              ...updated[index],
                                              name: e.target.value,
                                            }
                                            return updated
                                          })
                                        }
                                        className="w-full py-2 px-4 border border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="block text-sm font-medium text-gray-700">Field</label>
                                      <select
                                        value={newSubParameters?.[index]?.field || "numeric"}
                                        onChange={(e) =>
                                          setNewSubParameters((prev) => {
                                            const updated = [...prev]
                                            updated[index] = {
                                              ...updated[index],
                                              field: e.target.value,
                                            }
                                            return updated
                                          })
                                        }
                                        className="w-full py-2 px-4 border border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                      >
                                        <option value="numeric">Numeric</option>
                                        <option value="text">Text</option>
                                        <option value="boolean">Boolean</option>
                                      </select>
                                    </div>
                                    <div className="space-y-2">
                                      <label className="block text-sm font-medium text-gray-700">Units</label>
                                      <input
                                        type="text"
                                        placeholder="Units"
                                        value={newSubParameters?.[index]?.units || ""}
                                        onChange={(e) =>
                                          setNewSubParameters((prev) => {
                                            const updated = [...prev]
                                            updated[index] = {
                                              ...updated[index],
                                              units: e.target.value,
                                            }
                                            return updated
                                          })
                                        }
                                        className="w-full py-2 px-4 border border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="block text-sm font-medium text-gray-700">Range (e.g., 20-500)</label>
                                      <textarea
                                        placeholder="Range (e.g., 20-500)"
                                        value={newSubParameters?.[index]?.range || ""}
                                        onChange={(e) =>
                                          setNewSubParameters((prev) => {
                                            const updated = [...prev]
                                            updated[index] = {
                                              ...updated[index],
                                              range: e.target.value,
                                            }
                                            return updated
                                          })
                                        }
                                        className="w-full py-2 px-4 border border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                      ></textarea>
                                    </div>
                                    <div className="space-y-2">
                                      <label className="block text-sm font-medium text-gray-700">Test Method</label>
                                      <input
                                        type="text"
                                        placeholder="Test Method"
                                        value={newSubParameters?.[index]?.testMethod || ""}
                                        onChange={(e) =>
                                          setNewSubParameters((prev) => {
                                            const updated = [...prev]
                                            updated[index] = {
                                              ...updated[index],
                                              testMethod: e.target.value,
                                            }
                                            return updated
                                          })
                                        }
                                        className="w-full py-2 px-4 border border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="block text-sm font-medium text-gray-700">Priority (Lower is Higher)</label>
                                      <input
                                        type="number"
                                        placeholder="Priority"
                                        value={newSubParameters?.[index]?.priority || 0}
                                        onChange={(e) =>
                                          setNewSubParameters((prev) => {
                                            const updated = [...prev]
                                            updated[index] = {
                                              ...updated[index],
                                              priority: parseInt(e.target.value) || 0,
                                            }
                                            return updated
                                          })
                                        }
                                        className="w-full py-2 px-4 border border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                      />
                                    </div>
                                    <div className="space-y-2 pt-6">
                                      <button
                                        type="button"
                                        onClick={() => handleAddSubParameter(index)}
                                        className="w-full py-2 px-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center"
                                      >
                                        <FaPlus className="mr-2" /> Add Parameter
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add New Parameter */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-md font-medium text-teal-700 mb-4 flex items-center">
                        <FaPlus className="mr-2" /> Add New Parameter
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Parameter Name</label>
                          <input
                            type="text"
                            placeholder="Parameter Name"
                            value={newParameter?.name || ""}
                            onChange={(e) =>
                              setNewParameter({
                                ...newParameter,
                                name: e.target.value,
                              })
                            }
                            className="w-full py-2 px-4 border border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Field</label>
                          <select
                            value={newParameter?.field || "numeric"}
                            onChange={(e) =>
                              setNewParameter({
                                ...newParameter,
                                field: e.target.value,
                              })
                            }
                            className="w-full py-2 px-4 border border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                          >
                            <option value="numeric">Numeric</option>
                            <option value="text">Text</option>
                            <option value="boolean">Boolean</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Units</label>
                          <input
                            type="text"
                            placeholder="Units"
                            value={newParameter?.units || ""}
                            onChange={(e) =>
                              setNewParameter({
                                ...newParameter,
                                units: e.target.value,
                              })
                            }
                            className="w-full py-2 px-4 border border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Range (e.g., 20-500)</label>
                          <textarea
                            placeholder="Range (e.g., 20-500)"
                            value={newParameter?.range || ""}
                            onChange={(e) =>
                              setNewParameter({
                                ...newParameter,
                                range: e.target.value,
                              })
                            }
                            className="w-full py-2 px-4 border border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                          ></textarea>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Test Method</label>
                          <input
                            type="text"
                            placeholder="Test Method"
                            value={newParameter?.testMethod || ""}
                            onChange={(e) =>
                              setNewParameter({
                                ...newParameter,
                                testMethod: e.target.value,
                              })
                            }
                            className="w-full py-2 px-4 border border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Priority (Lower is Higher)</label>
                          <input
                            type="number"
                            placeholder="Priority"
                            value={newParameter?.priority || 0}
                            onChange={(e) =>
                              setNewParameter({
                                ...newParameter,
                                priority: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-full py-2 px-4 border border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                          />
                        </div>
                        <div className="space-y-2 pt-6">
                          <button
                            type="button"
                            onClick={handleAddParameter}
                            className="w-full py-2 px-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center"
                          >
                            <FaPlus className="mr-2" /> Add Parameter
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Add New Sub Test */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-md font-medium text-teal-700 mb-3 flex items-center">
                        <FaLayerGroup className="mr-2" /> Add New Sub Test
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Sub Test Name</label>
                          <input
                            type="text"
                            placeholder="Sub Test Name"
                            value={newSubTest?.name || ""}
                            onChange={(e) =>
                              setNewSubTest({
                                ...newSubTest,
                                name: e.target.value,
                              })
                            }
                            className="w-full py-2 px-4 border border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Priority (Lower is Higher)</label>
                          <input
                            type="number"
                            placeholder="Priority"
                            value={newSubTest?.priority || 0}
                            onChange={(e) =>
                              setNewSubTest({
                                ...newSubTest,
                                priority: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-full py-2 px-4 border border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                          />
                        </div>
                        <div className="space-y-2 pt-6">
                          <button
                            type="button"
                            onClick={handleAddSubTest}
                            className="w-full py-2 px-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center"
                          >
                            <FaPlus className="mr-2" /> Add Sub Test
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SunEditor and Preview Section */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold mb-2 flex items-center text-teal-700">
                      <FaFileAlt className="mr-2" /> Test Assessment
                    </h2>
                    <SunEditor
                      ref={editor}
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
                    <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                      <h3 className="font-semibold mb-2 text-teal-700">Preview</h3>
                      <div
                        className="sun-editor-editable max-w-none prose prose-teal"
                        dangerouslySetInnerHTML={{
                          __html: content || "<p>Enter your assessment above to see the preview here.</p>",
                        }}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-6 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTest({
                          name: "",
                          department: "",
                          sampleType: "",
                          suffix: "",
                          type: "single field",
                          comment: "",
                          instrument: "",
                          testItems: [],
                          assessment: "",
                          reporting_details: [],
                        })
                        setContent("")
                        setNewSubParameters([])
                        setNewReportingDetail({ label: "", type: "text" })
                      }}
                      className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center"
                    >
                      <FaTrash className="mr-2" /> Clear
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center"
                    >
                      <FaFlask className="mr-2" /> Submit Test {loading && <Spinner />}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </MiddleSection>
      </div>
    </Suspense>
  )
}

export default withAuth(AddPathologyTest)